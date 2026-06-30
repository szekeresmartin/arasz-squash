import { calculateStandings } from '../data';
import { League, Match, Player, Result, Standing } from '../types';

type SupabaseLeagueRow = {
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

type SupabasePlayerRow = {
  id: string;
  league_id: string;
  name: string;
  source_sheet_name: string;
  header_cell: string | null;
  row_cell: string | null;
  order_index: number;
  active: boolean;
};

type SupabaseMatchRow = {
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
  approved_at: string | null;
  submitted_by?: string | null;
  submitter_name?: string | null;
  submitter_contact?: string | null;
  comment?: string | null;
  approved_by?: string | null;
};

type SupabaseResultRow = {
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
  approved_at: string | null;
  source: string | null;
  source_reference: string | null;
  normalized_token: string | null;
};

type SupabaseStandingRow = {
  league_id: string;
  player_id: string;
  player_name: string;
  position: number;
  matches_played: number;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  set_difference: number;
  points: number;
  ranking_score: number | null;
  form: string[] | null;
};

export type PublicLeagueData = {
  leagues: League[];
  players: Player[];
  matches: Match[];
  results: Result[];
  standings: Standing[];
};

let publicLeagueDataCache: PublicLeagueData | null = null;
let publicLeagueDataPromise: Promise<PublicLeagueData> | null = null;
let publicLeagueDataIsStale = false;

export function invalidatePublicLeagueDataCache() {
  publicLeagueDataIsStale = true;
}

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

function formatSeasonLabel(seasonId: string) {
  if (seasonId === 'season-2026-tavasz-nyar') {
    return '2026 Tavasz / Nyár';
  }

  const withoutPrefix = seasonId.replace(/^season-/, '');
  return withoutPrefix
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function mapLeagueRow(row: SupabaseLeagueRow, playerIds: string[]): League {
  return {
    id: row.id,
    name: row.name,
    season: formatSeasonLabel(row.season_id),
    rules: row.rules,
    isActive: row.is_active,
    playerIds,
    seasonId: row.season_id,
    sheetName: row.sheet_name,
    classLabel: row.class_label,
    displayOrder: row.display_order,
    playerCount: row.player_count,
  };
}

function mapPlayerRow(row: SupabasePlayerRow): Player {
  return {
    id: row.id,
    leagueId: row.league_id,
    name: row.name,
    sourceSheetName: row.source_sheet_name,
    headerCell: row.header_cell ?? undefined,
    rowCell: row.row_cell ?? undefined,
    order: row.order_index,
    active: row.active,
  };
}

function mapMatchStatus(status: SupabaseMatchRow['status']): Match['status'] {
  if (status === 'approved') return 'Jóváhagyva';
  if (status === 'submitted') return 'Beküldve';
  if (status === 'rejected') return 'Elutasítva';
  return 'Tervezett';
}

function mapMatchRow(row: SupabaseMatchRow, approvedResultByMatchId: Map<string, SupabaseResultRow>): Match {
  const approvedResult = approvedResultByMatchId.get(row.id);
  const submittedScore = approvedResult
    ? {
        player1Sets: approvedResult.normalized_sets_won,
        player2Sets: approvedResult.normalized_sets_lost,
        sets: [],
      }
    : row.submitted_score_home != null && row.submitted_score_away != null
      ? {
          player1Sets: row.submitted_score_home,
          player2Sets: row.submitted_score_away,
          sets: [],
        }
      : undefined;

  return {
    id: row.id,
    leagueId: row.league_id,
    round: row.round_number,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    status: mapMatchStatus(row.status),
    submittedScore,
    submittedAt: row.submitted_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    submittedBy: row.submitted_by ?? undefined,
    submitterName: row.submitter_name ?? undefined,
    submitterContact: row.submitter_contact ?? undefined,
    comment: row.comment ?? undefined,
    approvedBy: row.approved_by ?? undefined,
    sourceCell: row.source_cell ?? undefined,
    reverseSourceCell: row.reverse_source_cell ?? undefined,
    submissionType: row.submission_type ?? undefined,
    resultId: approvedResult?.id,
  };
}

function mapResultRow(row: SupabaseResultRow): Result {
  return {
    id: row.id,
    leagueId: row.league_id,
    matchId: row.match_id,
    player1Id: row.player1_id,
    player2Id: row.player2_id,
    sourceSheet: row.source_sheet,
    sourceCells: row.source_cells,
    rawHomeToken: row.raw_home_token,
    rawAwayToken: row.raw_away_token ?? undefined,
    normalizedSetsWon: row.normalized_sets_won,
    normalizedSetsLost: row.normalized_sets_lost,
    kind: row.kind,
    status: row.status,
    playedOnCourt: row.played_on_court,
    isForfeit: row.is_forfeit,
    importedAt: row.imported_at ?? undefined,
    submittedAt: row.submitted_at ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    source: row.source ?? undefined,
    sourceReference: row.source_reference ?? undefined,
    normalizedToken: row.normalized_token ?? undefined,
  };
}

function mapStandingRow(row: SupabaseStandingRow): Standing {
  return {
    leagueId: row.league_id,
    playerId: row.player_id,
    playerName: row.player_name,
    matchesPlayed: row.matches_played,
    wins: row.wins,
    losses: row.losses,
    setsWon: row.sets_won,
    setsLost: row.sets_lost,
    setDifference: row.set_difference,
    basePoints: row.points,
    rankingScore: row.ranking_score ?? (row.points * 1_000_000 + row.wins * 10_000 + row.set_difference * 100 + row.sets_won),
    position: row.position,
    form: (row.form ?? []).map((entry) => (entry === 'W' ? 'W' : 'L')),
  };
}

function buildFallbackStandings(data: {
  leagues: League[];
  players: Player[];
  matches: Match[];
  results: Result[];
}): Standing[] {
  return data.leagues.flatMap((league) => {
    const leaguePlayers = data.players.filter((player) => player.leagueId === league.id);
    const leagueMatches = data.matches.filter((match) => match.leagueId === league.id);
    const leagueResults = data.results.filter((result) => result.leagueId === league.id);
    return calculateStandings(leaguePlayers, leagueMatches, leagueResults).map((standing) => ({
      ...standing,
      leagueId: league.id,
    }));
  });
}

async function fetchSupabaseRows<T>(path: string): Promise<T[]> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase public config is missing');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase ${path} read failed with status ${response.status}`);
  }

  return response.json() as Promise<T[]>;
}

async function fetchPublicLeagueDataFromSupabase(): Promise<PublicLeagueData> {
  const corePromise = Promise.all([
    fetchSupabaseRows<SupabaseLeagueRow>('leagues?select=id,season_id,slug,name,sheet_name,class_label,display_order,player_count,rules,is_active&order=display_order.asc'),
    fetchSupabaseRows<SupabasePlayerRow>('public_players?select=id,league_id,name,source_sheet_name,header_cell,row_cell,order_index,active&order=league_id.asc,order_index.asc'),
    fetchPublicMatchesRows(),
    fetchSupabaseRows<SupabaseResultRow>('public_results?select=id,league_id,match_id,player1_id,player2_id,source_sheet,source_cells,raw_home_token,raw_away_token,normalized_sets_won,normalized_sets_lost,kind,status,played_on_court,is_forfeit,imported_at,submitted_at,approved_at,source,source_reference,normalized_token&order=league_id.asc,created_at.desc,id.desc'),
  ]);
  const standingsPromise = fetchSupabaseRows<SupabaseStandingRow>(
    'public_standings?select=league_id,player_id,player_name,position,matches_played,wins,losses,sets_won,sets_lost,set_difference,points,ranking_score,form&order=league_id.asc,position.asc,player_name.asc',
  ).catch(() => null);

  const [leagueRows, playerRows, matchRows, resultRows] = await corePromise;
  const remoteStandings = await standingsPromise;

  const playerIdsByLeagueId = new Map<string, string[]>();
  const activePlayers = playerRows
    .filter((row) => row.active)
    .map(mapPlayerRow);

  for (const player of activePlayers) {
    const leaguePlayers = playerIdsByLeagueId.get(player.leagueId ?? '');
    if (leaguePlayers) {
      leaguePlayers.push(player.id);
    } else if (player.leagueId) {
      playerIdsByLeagueId.set(player.leagueId, [player.id]);
    }
  }

  const approvedResultRows = resultRows
    .filter((row) => row.status === 'approved')
    .map((row) => row);
  const approvedResultByMatchId = new Map(approvedResultRows.map((row) => [row.match_id, row] as const));

  const leagues = leagueRows.map((row) => mapLeagueRow(row, playerIdsByLeagueId.get(row.id) ?? []));
  const matches = matchRows.map((row) => mapMatchRow(row, approvedResultByMatchId));
  const results = approvedResultRows.map(mapResultRow);
  const fallbackStandings = buildFallbackStandings({
    leagues,
    players: activePlayers,
    matches,
    results,
  });

  let standings = fallbackStandings;
  if (remoteStandings) {
    try {
      standings = remoteStandings.map(mapStandingRow);
    } catch {
      standings = fallbackStandings;
    }
  }

  return {
    leagues,
    players: activePlayers,
    matches,
    results,
    standings,
  };
}

async function fetchPublicMatchesRows(): Promise<SupabaseMatchRow[]> {
  const basePath = 'public_matches?select=id,league_id,player1_id,player2_id,round_number,source_cell,reverse_source_cell,status,submission_type,submitted_score_home,submitted_score_away,submitted_at,approved_at&order=league_id.asc,round_number.asc,id.asc';
  const extendedPath = 'public_matches?select=id,league_id,player1_id,player2_id,round_number,source_cell,reverse_source_cell,status,submission_type,submitted_score_home,submitted_score_away,submitted_at,approved_at,submitted_by,submitter_name,submitter_contact,comment,approved_by&order=league_id.asc,round_number.asc,id.asc';

  try {
    return await fetchSupabaseRows<SupabaseMatchRow>(extendedPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('status 400')) {
      return fetchSupabaseRows<SupabaseMatchRow>(basePath);
    }

    throw error;
  }
}

export async function loadPublicLeagueData(): Promise<PublicLeagueData> {
  if (publicLeagueDataCache && !publicLeagueDataIsStale) {
    return publicLeagueDataCache;
  }

  if (publicLeagueDataPromise) {
    return publicLeagueDataPromise;
  }

  publicLeagueDataPromise = fetchPublicLeagueDataFromSupabase();

  try {
    publicLeagueDataCache = await publicLeagueDataPromise;
    publicLeagueDataIsStale = false;
    return publicLeagueDataCache;
  } finally {
    publicLeagueDataPromise = null;
  }
}

export function getPublicLeagueDataCache() {
  return publicLeagueDataCache;
}

export function clearPublicLeagueDataCache() {
  publicLeagueDataCache = null;
  publicLeagueDataPromise = null;
  publicLeagueDataIsStale = false;
}
