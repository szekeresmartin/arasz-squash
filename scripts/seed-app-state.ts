import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { DEFAULT_SPONSORS, normalizeSponsors } from '../src/data.ts';
import type { League, Match, Player, Result, Sponsor } from '../src/types.ts';
import type { PersistedAppState } from '../src/lib/app-state.ts';

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

const ROOT = process.cwd();
const GENERATED_DIR = resolve(ROOT, 'data/generated');
const SUPABASE_APP_STATE_ID = 'main';
const DOTENV_PATH = resolve(ROOT, '.env');

const RULE_TEXT = `A liga meccsre a WSF szabályrendszere vonatkozik, minden labdamenet pontot ér és 11 pontig tart egy szett. 10-10 után két pont különbséggel lehet nyerni. A mérkőzés öt lejátszott szettből áll.
Pontozás: Győzelemért 5 pont, vereségért 2/3 szett aránynál 3 pont, 1/4 szett aránynál 2 pont, 0/5 szett aránynál 1 pont, játék nélkül 0 pont jár.
Visszalépő játékos esetén a pontok elosztásáról a versenybizottság dönt a sportszerűség elve alapján. Ha valakivel többszöri próbálkozás ellenére sem sikerül időpontot egyeztetni,(és ennek nyoma van a viber csoportban) akkor a rendezőség egyedi elbírálása alapján is jár az 5 pont játék nélkül. Egyenlő pontszám és részeredmény esetén a megnyert mérkőzések száma, a jobb szett arány, megnyert szettek száma, majd a névsor szerinti sorrend dönt. Azonos helyezést nem alkalmazunk.(a megnyert szetteket, csak lejátszott mérkőzéseknél vesszük alapul, tehát ha az ellenfél nem tudta lejátszani a meccsét sérülés miatt, akkor két játékos eredményének összehasonlításánál a megnyert szetteket nem veszük számításba egyik félnél sem, de a pontokat természetesen igen)
Fontos, hogy küzdj minden szettért, mert a végén sokszor számít, hogy hány szettet tudtál megnyerni és ezen múlhat a helyezésed a ligában.
Labda: "A" ligában 2 sárga pöttyös labda az alap! Ettől eltérni kétféleképpen lehet: 1. Amennyiben mindkét játékos beleegyezik úgy használható a piros pöttyös labda is.    2. Az +50 feletti játékosok kérhetik a piros labdát meccslabdának. 
B - C - D - E  ligában az alap labda az 1 piros pöttyös. Amennyiben mindkét játékos beleegyezik úgy használható bármelyik típus.`;

const LEGACY_RULES_BY_ORDER = [RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT, RULE_TEXT] as const;
const LEAGUE_SLUGS = ['a-liga', 'b-liga', 'c-liga', 'd-liga', 'e-liga'] as const;

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

function buildAppState(): PersistedAppState {
  const leagues = readJsonFile<GeneratedLeague[]>(resolve(GENERATED_DIR, 'leagues.json'));
  const players = readJsonFile<GeneratedPlayer[]>(resolve(GENERATED_DIR, 'players.json'));
  const matches = readJsonFile<GeneratedMatch[]>(resolve(GENERATED_DIR, 'matches.json'));
  const results = readJsonFile<GeneratedResult[]>(resolve(GENERATED_DIR, 'results.json'));
  const sponsorsFromJson = readOptionalJsonFile<Sponsor[]>(resolve(GENERATED_DIR, 'sponsors.json'));

  const roundMap = buildRoundMap(leagues, players);
  const resultMap = buildResultMap(results);
  const defaultSeason = '2026 Tavasz / Nyár';

  const appLeagues: League[] = leagues.map((league) => ({
    id: league.id,
    name: league.name,
    season: defaultSeason,
    rules: LEGACY_RULES_BY_ORDER[league.order - 1] || 'Standard squash liga szabályok érvényesek.',
    isActive: true,
    playerIds: players
      .filter(player => player.leagueId === league.id && player.active)
      .sort((a, b) => a.order - b.order)
      .map(player => player.id),
  }));

  const appPlayers: Player[] = players.map((player) => ({
    id: player.id,
    name: player.name,
    leagueId: player.leagueId,
    order: player.order,
    active: player.active,
    sourceSheetName: player.sourceSheetName,
  }));

  const appResults: Result[] = results.map(result => ({
    ...result,
    playedOnCourt: result.kind === 'score',
    isForfeit: result.kind === 'walkover',
  }));

  const appMatches: Match[] = matches.map((match) => {
    const result = resultMap.get(match.id);
    const round = roundMap.get(`${match.leagueId}:${[match.player1Id, match.player2Id].sort().join('::')}`) || 1;

    return {
      id: match.id,
      leagueId: match.leagueId,
      round,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      status: match.status === 'approved' ? 'Jóváhagyva' : 'Tervezett',
      submittedScore: result ? {
        player1Sets: result.normalizedSetsWon,
        player2Sets: result.normalizedSetsLost,
        sets: [],
      } : undefined,
      sourceCell: match.sourceCell,
      reverseSourceCell: match.reverseSourceCell,
      resultId: match.resultId,
    };
  });

  const appSponsors = normalizeSponsors(sponsorsFromJson || DEFAULT_SPONSORS);

  return {
    players: appPlayers,
    leagues: appLeagues,
    matches: appMatches,
    results: appResults,
    sponsors: appSponsors,
  };
}

function loadSupabaseConfig() {
  loadDotEnv(DOTENV_PATH);

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  }

  return { supabaseUrl, supabaseAnonKey };
}

async function seedAppState() {
  const config = loadSupabaseConfig();
  const state = buildAppState();
  const updatedAt = new Date().toISOString();

  const response = await fetch(`${config.supabaseUrl}/rest/v1/app_state?on_conflict=id`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify({
      id: SUPABASE_APP_STATE_ID,
      data: state,
      updated_at: updatedAt,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Supabase seed failed with status ${response.status}${body ? `: ${body}` : ''}`);
  }

  const payload = await response.json().catch(() => null);
  console.log(JSON.stringify({
    ok: true,
    updatedAt,
    players: state.players.length,
    leagues: state.leagues.length,
    matches: state.matches.length,
    results: state.results.length,
    sponsors: state.sponsors.length,
    response: payload,
  }, null, 2));
}

seedAppState().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
