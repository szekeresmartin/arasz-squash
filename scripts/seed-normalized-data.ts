import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DEFAULT_SPONSORS, normalizeSponsors } from '../src/data.ts';
import type { Result, Sponsor } from '../src/types.ts';

type GeneratedLeague = {
  id: string;
  sheetName: string;
  name: string;
  classLabel: string;
  order: number;
  playerCount: number;
};

type GeneratedPlayer = {
  id: string;
  leagueId: string;
  name: string;
  sourceSheetName: string;
  headerCell: string;
  rowCell: string;
  order: number;
  active: boolean;
};

type GeneratedMatch = {
  id: string;
  leagueId: string;
  player1Id: string;
  player2Id: string;
  sourceCell: string;
  reverseSourceCell?: string;
  status: 'scheduled' | 'approved';
  resultId?: string;
};

type GeneratedResult = Result;

type NormalizedSeasonRow = {
  id: string;
  slug: string;
  name: string;
  starts_at: string | null;
  ends_at: string | null;
  is_current: boolean;
};

type NormalizedLeagueRow = {
  id: string;
  season_id: string;
  slug: string;
  name: string;
  sheet_name: string;
  class_label: string;
  display_order: number;
  player_count: number;
  rules: string;
  is_active: boolean;
};

type NormalizedPlayerRow = {
  id: string;
  league_id: string;
  name: string;
  source_sheet_name: string;
  header_cell: string | null;
  row_cell: string | null;
  order_index: number;
  active: boolean;
  phone: string | null;
  email: string | null;
  join_date: string | null;
};

type NormalizedMatchRow = {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  round_number: number;
  source_cell: string | null;
  reverse_source_cell: string | null;
  status: 'planned' | 'submitted' | 'approved' | 'rejected';
  submission_type: 'planned' | 'custom' | null;
  submitted_score_home: number | null;
  submitted_score_away: number | null;
  submitted_at: string | null;
  submitted_by: string | null;
  submitter_name: string | null;
  submitter_contact: string | null;
  comment: string | null;
  approved_at: string | null;
  approved_by: string | null;
};

type NormalizedResultRow = {
  id: string;
  league_id: string;
  match_id: string;
  player1_id: string;
  player2_id: string;
  source_sheet: string;
  source_cells: string[];
  raw_home_token: string;
  raw_away_token: string | null;
  normalized_sets_won: number;
  normalized_sets_lost: number;
  kind: 'score' | 'walkover';
  status: 'approved';
  played_on_court: boolean;
  is_forfeit: boolean;
  imported_at: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  source: string | null;
  source_reference: string | null;
  normalized_token: string | null;
};

type NormalizedSponsorRow = {
  id: string;
  name: string;
  logo_text: string;
  logo_path: string | null;
  website_url: string | null;
  color_hex: string;
  is_active: boolean;
  display_order: number;
};

const ROOT = process.cwd();
const GENERATED_DIR = resolve(ROOT, 'data/generated');
const DOTENV_PATH = resolve(ROOT, '.env');
const CURRENT_SEASON_ID = 'season-2026-tavasz-nyar';
const CURRENT_SEASON_SLUG = '2026-tavasz-nyar';
const CURRENT_SEASON_NAME = '2026 Tavasz / Nyár';
const LEAGUE_SLUGS = ['a-liga', 'b-liga', 'c-liga', 'd-liga', 'e-liga'] as const;

const RULE_TEXT = `A liga meccsre a WSF szabályrendszere vonatkozik, minden labdamenet pontot ér és 11 pontig tart egy szett. 10-10 után két pont különbséggel lehet nyerni. A mérkőzés öt lejátszott szettből áll.
Pontozás: Győzelemért 5 pont, vereségért 2/3 szett aránynál 3 pont, 1/4 szett aránynál 2 pont, 0/5 szett aránynál 1 pont, játék nélkül 0 pont jár.
Visszalépő játékos esetén a pontok elosztásáról a versenybizottság dönt a sportszerűség elve alapján. Ha valakivel többszöri próbálkozás ellenére sem sikerül időpontot egyeztetni,(és ennek nyoma van a viber csoportban) akkor a rendezőség egyedi elbírálása alapján is jár az 5 pont játék nélkül. Egyenlő pontszám, győzelmi szám, szettkülönbség és megnyert szett esetén az egymás elleni eredmény dönt, ennek hiányában a névsor szerinti sorrend érvényes. Ha minden összehasonlított mutató teljesen egyezik és nincs egymás elleni eredmény, azonos helyezés jár.(a megnyert szetteket, csak lejátszott mérkőzéseknél vesszük alapul, tehát ha az ellenfél nem tudta lejátszani a meccsét sérülés miatt, akkor két játékos eredményének összehasonlításánál a megnyert szetteket nem veszük számításba egyik félnél sem, de a pontokat természetesen igen)
Fontos, hogy küzdj minden szettért, mert a végén sokszor számít, hogy hány szettet tudtál megnyerni és ezen múlhat a helyezésed a ligában.
Labda: "A" ligában 2 sárga pöttyös labda az alap! Ettől eltérni kétféleképpen lehet: 1. Amennyiben mindkét játékos beleegyezik úgy használható a piros pöttyös labda is.    2. Az +50 feletti játékosok kérhetik a piros labdát meccslabdának. 
B - C - D - E  ligában az alap labda az 1 piros pöttyös. Amennyiben mindkét játékos beleegyezik úgy használható bármelyik típus.`;

const LEGACY_RULES_BY_ORDER = [RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT] as const;

function loadDotEnv(path: string) {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    if (!key || process.env[key]) {
      continue;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function readOptionalJsonFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }

  return readJsonFile<T>(filePath);
}

function buildRoundRobinRounds(playerIds: string[]) {
  const ids = [...playerIds];
  if (ids.length % 2 === 1) {
    ids.push('__BYE__');
  }

  const rounds: Array<Array<[string, string]>> = [];
  const fixed = ids[0];
  let rotating = ids.slice(1);
  const roundCount = ids.length - 1;

  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const arrangement = [fixed, ...rotating];
    const pairs: Array<[string, string]> = [];

    for (let i = 0; i < arrangement.length / 2; i += 1) {
      const left = arrangement[i];
      const right = arrangement[arrangement.length - 1 - i];
      if (left !== '__BYE__' && right !== '__BYE__') {
        pairs.push([left, right]);
      }
    }

    rounds.push(pairs);

    if (rotating.length > 0) {
      rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
    }
  }

  return rounds;
}

function buildRoundMap(leagues: GeneratedLeague[], players: GeneratedPlayer[]) {
  const roundMap = new Map<string, number>();

  for (const league of leagues) {
    const orderedPlayers = players
      .filter(player => player.leagueId === league.id && player.active)
      .sort((a, b) => a.order - b.order)
      .map(player => player.id);

    const rounds = buildRoundRobinRounds(orderedPlayers);

    rounds.forEach((pairs, roundIndex) => {
      pairs.forEach(([player1Id, player2Id]) => {
        const key = [player1Id, player2Id].sort().join('::');
        roundMap.set(`${league.id}:${key}`, roundIndex + 1);
      });
    });
  }

  return roundMap;
}

function buildResultMap(results: GeneratedResult[]) {
  return new Map(results.map(result => [result.matchId, result]));
}

function loadSourceData() {
  const leagues = readJsonFile<GeneratedLeague[]>(resolve(GENERATED_DIR, 'leagues.json'));
  const players = readJsonFile<GeneratedPlayer[]>(resolve(GENERATED_DIR, 'players.json'));
  const matches = readJsonFile<GeneratedMatch[]>(resolve(GENERATED_DIR, 'matches.json'));
  const results = readJsonFile<GeneratedResult[]>(resolve(GENERATED_DIR, 'results.json'));
  const sponsorsFromJson = readOptionalJsonFile<Sponsor[]>(resolve(GENERATED_DIR, 'sponsors.json'));

  return { leagues, players, matches, results, sponsorsFromJson };
}

function buildNormalizedRows() {
  const { leagues, players, matches, results, sponsorsFromJson } = loadSourceData();
  const roundMap = buildRoundMap(leagues, players);
  const resultMap = buildResultMap(results);
  const runTimestamp = new Date().toISOString();

  const seasons: NormalizedSeasonRow[] = [{
    id: CURRENT_SEASON_ID,
    slug: CURRENT_SEASON_SLUG,
    name: CURRENT_SEASON_NAME,
    starts_at: null,
    ends_at: null,
    is_current: true,
  }];

  const normalizedLeagues: NormalizedLeagueRow[] = leagues.map((league) => ({
    id: league.id,
    season_id: CURRENT_SEASON_ID,
    slug: LEAGUE_SLUGS[league.order - 1] || `liga-${league.order}`,
    name: league.name,
    sheet_name: league.sheetName,
    class_label: league.classLabel,
    display_order: league.order,
    player_count: league.playerCount,
    rules: LEGACY_RULES_BY_ORDER[league.order - 1] || 'Standard squash liga szabályok érvényesek.',
    is_active: true,
  }));

  const normalizedPlayers: NormalizedPlayerRow[] = players.map((player) => ({
    id: player.id,
    league_id: player.leagueId,
    name: player.name,
    source_sheet_name: player.sourceSheetName,
    header_cell: player.headerCell || null,
    row_cell: player.rowCell || null,
    order_index: player.order,
    active: player.active,
    phone: null,
    email: null,
    join_date: null,
  }));

  const normalizedMatches: NormalizedMatchRow[] = matches.map((match) => {
    const result = resultMap.get(match.id);
    const round_number = roundMap.get(`${match.leagueId}:${[match.player1Id, match.player2Id].sort().join('::')}`) || 1;
    const historicalTimestamp = result?.importedAt || runTimestamp;

    return {
      id: match.id,
      league_id: match.leagueId,
      player1_id: match.player1Id,
      player2_id: match.player2Id,
      round_number,
      source_cell: match.sourceCell || null,
      reverse_source_cell: match.reverseSourceCell || null,
      status: match.status === 'approved' ? 'approved' : 'planned',
      submission_type: 'planned',
      submitted_score_home: result ? result.normalizedSetsWon : null,
      submitted_score_away: result ? result.normalizedSetsLost : null,
      submitted_at: result ? historicalTimestamp : null,
      submitted_by: null,
      submitter_name: null,
      submitter_contact: null,
      comment: null,
      approved_at: result ? historicalTimestamp : null,
      approved_by: null,
    };
  });

  const normalizedResults: NormalizedResultRow[] = results
    .filter(result => result.status === 'approved')
    .map((result) => {
      const historicalTimestamp = result.importedAt || runTimestamp;
      return {
        id: result.id,
        league_id: result.leagueId,
        match_id: result.matchId,
        player1_id: result.player1Id,
        player2_id: result.player2Id,
        source_sheet: result.sourceSheet,
        source_cells: result.sourceCells,
        raw_home_token: result.rawHomeToken,
        raw_away_token: result.rawAwayToken ?? null,
        normalized_sets_won: result.normalizedSetsWon,
        normalized_sets_lost: result.normalizedSetsLost,
        kind: result.kind,
        status: 'approved',
        played_on_court: Boolean(result.playedOnCourt ?? result.kind === 'score'),
        is_forfeit: Boolean(result.isForfeit ?? result.kind === 'walkover'),
        imported_at: historicalTimestamp,
        submitted_at: historicalTimestamp,
        submitted_by: null,
        approved_at: historicalTimestamp,
        approved_by: null,
        source: result.source ?? null,
        source_reference: result.sourceReference ?? null,
        normalized_token: result.normalizedToken ?? null,
      };
    });

  const normalizedSponsors: NormalizedSponsorRow[] = normalizeSponsors(sponsorsFromJson || DEFAULT_SPONSORS).map((sponsor, index) => ({
    id: sponsor.id,
    name: sponsor.name,
    logo_text: sponsor.logoText,
    logo_path: sponsor.logoPath ?? null,
    website_url: sponsor.websiteUrl ?? null,
    color_hex: sponsor.colorHex,
    is_active: sponsor.isActive,
    display_order: index,
  }));

  return {
    seasons,
    leagues: normalizedLeagues,
    players: normalizedPlayers,
    matches: normalizedMatches,
    results: normalizedResults,
    sponsors: normalizedSponsors,
  };
}

function loadSupabaseConfig() {
  loadDotEnv(DOTENV_PATH);

  const supabaseUrl = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  return { supabaseUrl, serviceRoleKey };
}

async function upsertRows<T extends object>(supabaseUrl: string, serviceRoleKey: string, table: string, rows: T[]) {
  if (rows.length === 0) {
    return;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Seed failed for ${table} with status ${response.status}${body ? `: ${body}` : ''}`);
  }
}

async function seedNormalizedData() {
  const config = loadSupabaseConfig();
  const rows = buildNormalizedRows();

  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'seasons', rows.seasons);
  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'leagues', rows.leagues);
  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'players', rows.players);
  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'matches', rows.matches);
  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'results', rows.results);
  await upsertRows(config.supabaseUrl, config.serviceRoleKey, 'sponsors', rows.sponsors);

  console.log(JSON.stringify({
    ok: true,
    season: rows.seasons.length,
    leagues: rows.leagues.length,
    players: rows.players.length,
    matches: rows.matches.length,
    results: rows.results.length,
    sponsors: rows.sponsors.length,
  }, null, 2));
}

seedNormalizedData().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
