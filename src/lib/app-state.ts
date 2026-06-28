import { League, Match, Player, Result, Sponsor } from '../types';

export type PersistedAppState = {
  players: Player[];
  leagues: League[];
  matches: Match[];
  results: Result[];
  sponsors: Sponsor[];
};

type PersistedEnvelope = {
  version: number;
  state: PersistedAppState;
};

type SupabaseAppStateRow = {
  id: string;
  data: unknown;
};

export type PersistedAppStateSource = 'remote' | 'local' | 'empty' | 'remote-error';

export type HydratedPersistedAppState = {
  state: PersistedAppState | null;
  source: PersistedAppStateSource;
};

const STORAGE_KEY = 'arasz-squash-state-v2';
const SUPABASE_APP_STATE_ID = 'main';

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

function isPersistedState(value: unknown): value is PersistedAppState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.players)
    && Array.isArray(candidate.leagues)
    && Array.isArray(candidate.matches)
    && Array.isArray(candidate.results)
    && Array.isArray(candidate.sponsors);
}

function unwrapPersistedState(payload: unknown): PersistedAppState | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (isPersistedState(candidate.state)) {
    return candidate.state;
  }

  if (isPersistedState(payload)) {
    return payload;
  }

  return null;
}

function readLocalStorageState(): PersistedAppState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedEnvelope | PersistedAppState;
    if ('version' in parsed) {
      return parsed.version === 1 ? parsed.state : null;
    }

    return isPersistedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocalStorageState(state: PersistedAppState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    version: 1,
    state,
  }));
}

async function readSupabaseState(): Promise<PersistedAppState | null> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase is not configured');
  }

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/app_state?select=data&id=eq.${SUPABASE_APP_STATE_ID}`,
    {
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase read failed with status ${response.status}`);
  }

  const rows = await response.json() as SupabaseAppStateRow[];
  const firstRow = rows[0];
  if (!firstRow) {
    return null;
  }

  const persistedState = unwrapPersistedState(firstRow.data);
  if (!persistedState) {
    throw new Error('Supabase app state payload is invalid');
  }

  return persistedState;
}

async function writeSupabaseState(state: PersistedAppState) {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase is not configured');
  }

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
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Supabase write failed with status ${response.status}`);
  }
}

export async function hydratePersistedAppState(): Promise<HydratedPersistedAppState> {
  try {
    const remoteState = await readSupabaseState();
    if (remoteState) {
      try {
        writeLocalStorageState(remoteState);
      } catch {
        // Cache writes should never block app hydration.
      }
      return { state: remoteState, source: 'remote' };
    }

    const localState = readLocalStorageState();
    if (localState) {
      return { state: localState, source: 'local' };
    }

    return { state: null, source: 'empty' };
  } catch {
    const localState = readLocalStorageState();
    if (localState) {
      return { state: localState, source: 'local' };
    }

    return { state: null, source: 'remote-error' };
  }
}

export async function loadPersistedAppState(): Promise<PersistedAppState | null> {
  const hydrated = await hydratePersistedAppState();
  return hydrated.state;
}

export async function savePersistedAppState(state: PersistedAppState): Promise<void> {
  try {
    await writeSupabaseState(state);
  } catch {
    try {
      writeLocalStorageState(state);
    } catch {
      // Ignore cache write errors.
    }
    return;
  }

  try {
    writeLocalStorageState(state);
  } catch {
    // Ignore cache write errors.
  }
}
