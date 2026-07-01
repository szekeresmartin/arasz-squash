import { League, Match, Player, Sponsor } from '../types';

type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export class AdminDataError extends Error {
  code: 'config' | 'auth' | 'remote';

  constructor(message: string, code: 'config' | 'auth' | 'remote') {
    super(message);
    this.name = 'AdminDataError';
    this.code = code;
  }
}

function getSupabaseConfig(): SupabaseConfig | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

async function extractErrorMessage(response: Response, path: string): Promise<string> {
  const text = await response.text();
  let message = `Admin írás sikertelen (${path}): ${response.status}`;

  try {
    const parsed = JSON.parse(text) as { message?: string; details?: string; hint?: string };
    message = parsed.message ?? message;
    const extras = [parsed.details, parsed.hint].filter(Boolean).join(' ');
    if (extras) {
      message = `${message} ${extras}`;
    }
  } catch {
    if (text.trim()) {
      message = `${message} ${text.trim()}`;
    }
  }

  return message;
}

// "players" and "matches" intentionally have no SELECT grant for anon/authenticated
// (reads go through the public_* views) -- Prefer: return=representation would make
// PostgREST try to SELECT the written row back, which fails with "permission denied"
// against those tables. Only request a representation back when the caller actually
// needs the written row (e.g. league creation, to learn its generated id/season).
async function adminRequest<T = void>(
  accessToken: string,
  path: string,
  method: 'POST' | 'PATCH',
  body: unknown,
  returnRepresentation = false,
): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminDataError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: returnRepresentation ? 'return=representation' : 'return=minimal',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, path);
    throw new AdminDataError(message, response.status === 401 || response.status === 403 ? 'auth' : 'remote');
  }

  if (!returnRepresentation) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `liga-${Date.now()}`;
}

async function fetchCurrentSeasonId(): Promise<string> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminDataError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/seasons?select=id&is_current=eq.true&limit=1`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new AdminDataError(await extractErrorMessage(response, 'seasons'), 'remote');
  }

  const rows = await response.json() as Array<{ id: string }>;
  const currentSeason = rows[0];
  if (!currentSeason) {
    throw new AdminDataError('Nincs beállítva aktuális szezon.', 'remote');
  }

  return currentSeason.id;
}

async function fetchNextDisplayOrder(accessToken: string, seasonId: string): Promise<number> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminDataError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/leagues?select=display_order&season_id=eq.${encodeURIComponent(seasonId)}&order=display_order.desc&limit=1`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new AdminDataError(await extractErrorMessage(response, 'leagues'), 'remote');
  }

  const rows = await response.json() as Array<{ display_order: number }>;
  return (rows[0]?.display_order ?? 0) + 1;
}

export async function createLeague(
  accessToken: string,
  league: { name: string; rules: string; isActive: boolean },
  memberPlayerIds: string[],
): Promise<League> {
  const seasonId = await fetchCurrentSeasonId();
  const displayOrder = await fetchNextDisplayOrder(accessToken, seasonId);
  const id = `l_${Date.now()}`;

  const [created] = await adminRequest<Array<{
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
  }>>(accessToken, 'leagues', 'POST', {
    id,
    season_id: seasonId,
    slug: slugify(league.name),
    name: league.name,
    sheet_name: league.name,
    class_label: league.name,
    display_order: displayOrder,
    player_count: memberPlayerIds.length,
    rules: league.rules,
    is_active: league.isActive,
  }, true);

  if (memberPlayerIds.length > 0) {
    await adminRequest(
      accessToken,
      `players?id=in.(${memberPlayerIds.map(encodeURIComponent).join(',')})`,
      'PATCH',
      { league_id: id },
    );
  }

  return {
    id: created.id,
    name: created.name,
    season: seasonId,
    rules: created.rules,
    isActive: created.is_active,
    playerIds: memberPlayerIds,
    seasonId: created.season_id,
    sheetName: created.sheet_name,
    classLabel: created.class_label,
    displayOrder: created.display_order,
    playerCount: created.player_count,
  };
}

export async function deleteLeague(accessToken: string, leagueId: string): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminDataError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/leagues?id=eq.${encodeURIComponent(leagueId)}`, {
    method: 'DELETE',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
      Prefer: 'return=minimal',
    },
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'leagues');
    throw new AdminDataError(message, response.status === 401 || response.status === 403 ? 'auth' : 'remote');
  }
}

export async function updateLeague(accessToken: string, league: League): Promise<void> {
  await adminRequest(accessToken, `leagues?id=eq.${encodeURIComponent(league.id)}`, 'PATCH', {
    name: league.name,
    rules: league.rules,
    is_active: league.isActive,
  });
}

export async function createPlayer(accessToken: string, player: Player, leagueId: string): Promise<void> {
  await adminRequest(accessToken, 'players', 'POST', {
    id: player.id,
    league_id: leagueId,
    name: player.name,
    source_sheet_name: 'Admin',
    order_index: 0,
    active: true,
    phone: player.phone ?? null,
    email: player.email ?? null,
    join_date: player.joinDate ?? null,
  });
}

export async function updatePlayer(accessToken: string, player: Player): Promise<void> {
  await adminRequest(accessToken, `players?id=eq.${encodeURIComponent(player.id)}`, 'PATCH', {
    name: player.name,
    phone: player.phone ?? null,
    email: player.email ?? null,
  });
}

export async function deactivatePlayer(accessToken: string, playerId: string): Promise<void> {
  await adminRequest(accessToken, `players?id=eq.${encodeURIComponent(playerId)}`, 'PATCH', {
    active: false,
  });
}

export async function updateSubmittedScore(
  accessToken: string,
  matchId: string,
  score: { player1Sets: number; player2Sets: number },
): Promise<void> {
  await adminRequest(accessToken, `matches?id=eq.${encodeURIComponent(matchId)}`, 'PATCH', {
    submitted_score_home: score.player1Sets,
    submitted_score_away: score.player2Sets,
  });
}

export async function bulkInsertMatches(accessToken: string, matches: Match[]): Promise<void> {
  if (matches.length === 0) {
    return;
  }

  await adminRequest(accessToken, 'matches', 'POST', matches.map(match => ({
    id: match.id,
    league_id: match.leagueId,
    player1_id: match.player1Id,
    player2_id: match.player2Id,
    round_number: match.round,
    status: 'planned',
    match_date: match.date ?? null,
    court: match.court ?? null,
  })));
}

export async function deleteCustomMatch(accessToken: string, matchId: string): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminDataError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/matches?id=eq.${encodeURIComponent(matchId)}`, {
    method: 'DELETE',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response, 'matches');
    throw new AdminDataError(message, response.status === 401 || response.status === 403 ? 'auth' : 'remote');
  }
}

export async function createSponsor(accessToken: string, sponsor: Sponsor): Promise<void> {
  await adminRequest(accessToken, 'sponsors', 'POST', {
    id: sponsor.id,
    name: sponsor.name,
    logo_text: sponsor.logoText,
    logo_path: sponsor.logoPath ?? null,
    website_url: sponsor.websiteUrl ?? null,
    color_hex: sponsor.colorHex,
    is_active: sponsor.isActive,
    display_order: 0,
  });
}

export async function updateSponsor(accessToken: string, sponsor: Sponsor): Promise<void> {
  await adminRequest(accessToken, `sponsors?id=eq.${encodeURIComponent(sponsor.id)}`, 'PATCH', {
    name: sponsor.name,
    logo_text: sponsor.logoText,
    website_url: sponsor.websiteUrl ?? null,
    color_hex: sponsor.colorHex,
    is_active: sponsor.isActive,
  });
}

export function classifyAdminDataError(error: unknown): AdminDataError {
  if (error instanceof AdminDataError) {
    return error;
  }

  const message = error instanceof Error ? error.message : 'Ismeretlen hiba történt az admin írás során.';
  return new AdminDataError(message, 'remote');
}
