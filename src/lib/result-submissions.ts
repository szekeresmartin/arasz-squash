import { MatchScore } from '../types';

type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type SubmitMatchResultInput = {
  matchId: string;
  finalScore: MatchScore;
  submitterName: string;
  comment?: string;
  submittedPlayer1Id?: string;
  submittedPlayer2Id?: string;
};

export type ResetMatchSubmissionInput = {
  matchId: string;
};

export type ApproveMatchResultInput = {
  matchId: string;
  finalScore: {
    player1Sets: number;
    player2Sets: number;
  };
};

export type PublicMatchStatusRow = {
  id: string;
  league_id: string;
  player1_id: string;
  player2_id: string;
  status: 'planned' | 'submitted' | 'approved' | 'rejected';
};

export type SubmitMatchResultOutcome = {
  remoteAttempted: boolean;
  remoteSynced: boolean;
  remoteError?: string;
};

export class ResultSubmissionError extends Error {
  code: 'config' | 'network' | 'remote' | 'validation';

  constructor(message: string, code: 'config' | 'network' | 'remote' | 'validation') {
    super(message);
    this.name = 'ResultSubmissionError';
    this.code = code;
  }
}

function getSupabaseConfig(): SupabaseConfig | null {
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Ismeretlen hiba történt az eredménybeküldés során.';
}

export async function submitMatchResultToSupabase(input: SubmitMatchResultInput): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ResultSubmissionError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/submit_match_result`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      p_match_id: input.matchId,
      p_submitted_score_home: input.finalScore.player1Sets,
      p_submitted_score_away: input.finalScore.player2Sets,
      p_submitter_name: input.submitterName,
      p_comment: input.comment ?? null,
      p_submitted_player1_id: input.submittedPlayer1Id ?? null,
      p_submitted_player2_id: input.submittedPlayer2Id ?? null,
    }),
  });

  if (response.ok) {
    return;
  }

  const responseText = await response.text();
  let message = `Supabase submit_match_result hívás sikertelen: ${response.status}`;

  try {
    const parsed = JSON.parse(responseText) as { message?: string; details?: string; hint?: string };
    message = parsed.message ?? message;
    const extras = [parsed.details, parsed.hint].filter(Boolean).join(' ');
    if (extras) {
      message = `${message} ${extras}`;
    }
  } catch {
    if (responseText.trim()) {
      message = `${message} ${responseText.trim()}`;
    }
  }

  throw new ResultSubmissionError(message, response.status >= 500 ? 'network' : 'remote');
}

export async function resetMatchSubmissionOnSupabase(input: ResetMatchSubmissionInput): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ResultSubmissionError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/reset_match_submission`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      p_match_id: input.matchId,
    }),
  });

  if (response.ok) {
    return;
  }

  const responseText = await response.text();
  let message = `Supabase reset_match_submission hívás sikertelen: ${response.status}`;

  try {
    const parsed = JSON.parse(responseText) as { message?: string; details?: string; hint?: string };
    message = parsed.message ?? message;
    const extras = [parsed.details, parsed.hint].filter(Boolean).join(' ');
    if (extras) {
      message = `${message} ${extras}`;
    }
  } catch {
    if (responseText.trim()) {
      message = `${message} ${responseText.trim()}`;
    }
  }

  throw new ResultSubmissionError(message, response.status >= 500 ? 'network' : 'remote');
}

export async function approveMatchResultOnSupabase(input: ApproveMatchResultInput): Promise<void> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ResultSubmissionError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/approve_match_result`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      p_match_id: input.matchId,
      p_final_score_home: input.finalScore.player1Sets,
      p_final_score_away: input.finalScore.player2Sets,
    }),
  });

  if (response.ok) {
    return;
  }

  const responseText = await response.text();
  let message = `Supabase approve_match_result hívás sikertelen: ${response.status}`;

  try {
    const parsed = JSON.parse(responseText) as { message?: string; details?: string; hint?: string };
    message = parsed.message ?? message;
    const extras = [parsed.details, parsed.hint].filter(Boolean).join(' ');
    if (extras) {
      message = `${message} ${extras}`;
    }
  } catch {
    if (responseText.trim()) {
      message = `${message} ${responseText.trim()}`;
    }
  }

  throw new ResultSubmissionError(message, response.status >= 500 ? 'network' : 'remote');
}

export async function fetchPublicMatchesForLeague(leagueId: string): Promise<PublicMatchStatusRow[]> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new ResultSubmissionError('A Supabase nincs konfigurálva.', 'config');
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/public_matches?select=id,league_id,player1_id,player2_id,status&league_id=eq.${encodeURIComponent(leagueId)}`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text();
    let message = `Supabase public_matches read failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(responseText) as { message?: string; details?: string; hint?: string };
      message = parsed.message ?? message;
      const extras = [parsed.details, parsed.hint].filter(Boolean).join(' ');
      if (extras) {
        message = `${message} ${extras}`;
      }
    } catch {
      if (responseText.trim()) {
        message = `${message} ${responseText.trim()}`;
      }
    }

    throw new ResultSubmissionError(message, response.status >= 500 ? 'network' : 'remote');
  }

  return response.json() as Promise<PublicMatchStatusRow[]>;
}

export async function getLivePairMatchStatus(
  leagueId: string,
  player1Id: string,
  player2Id: string,
): Promise<PublicMatchStatusRow['status'] | null> {
  const leagueMatches = await fetchPublicMatchesForLeague(leagueId);
  const liveMatch = leagueMatches.find((match) => {
    const sameOrder = match.player1_id === player1Id && match.player2_id === player2Id;
    const reverseOrder = match.player1_id === player2Id && match.player2_id === player1Id;
    return sameOrder || reverseOrder;
  });

  return liveMatch?.status ?? null;
}

export function classifySubmissionError(error: unknown): ResultSubmissionError {
  if (error instanceof ResultSubmissionError) {
    return error;
  }

  return new ResultSubmissionError(getErrorMessage(error), 'network');
}
