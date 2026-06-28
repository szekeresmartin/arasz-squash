export type LatestPublicResultRow = {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  normalized_sets_won: number;
  normalized_sets_lost: number;
  created_at?: string | null;
  imported_at?: string | null;
  approved_at?: string | null;
};

type SupabasePublicResultRow = {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  normalized_sets_won: number;
  normalized_sets_lost: number;
  created_at: string | null;
  imported_at: string | null;
  approved_at: string | null;
};

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export async function loadLatestPublicResults(): Promise<LatestPublicResultRow[]> {
  const config = getSupabaseConfig();
  if (!config) {
    return [];
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/latest_public_results?select=id,league_id,player1_id,player2_id,normalized_sets_won,normalized_sets_lost,created_at,imported_at,approved_at`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase latest_public_results read failed with status ${response.status}`);
  }

  const rows = await response.json() as SupabasePublicResultRow[];
  return rows.map((row) => ({
    id: row.id,
    league_id: row.league_id,
    player1_id: row.player1_id,
    player2_id: row.player2_id,
    normalized_sets_won: row.normalized_sets_won,
    normalized_sets_lost: row.normalized_sets_lost,
    created_at: row.created_at,
    imported_at: row.imported_at,
    approved_at: row.approved_at,
  }));
}
