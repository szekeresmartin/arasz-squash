export type AdminSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
};

const STORAGE_KEY = 'arasz-squash-admin-session';

export class AdminAuthError extends Error {}

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '');
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

async function extractAuthErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { error_description?: string; msg?: string; error?: string };
    return parsed.error_description ?? parsed.msg ?? parsed.error ?? 'Hibás e-mail cím vagy jelszó.';
  } catch {
    return 'Hibás e-mail cím vagy jelszó.';
  }
}

function persistSession(session: AdminSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function readStoredAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<AdminSession>;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt || !parsed.email) {
      return null;
    }

    return parsed as AdminSession;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(STORAGE_KEY);
}

export function isSessionExpiringSoon(session: AdminSession, marginMs = 60_000): boolean {
  return Date.now() + marginMs >= session.expiresAt;
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminAuthError('A Supabase nincs konfigurálva.');
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new AdminAuthError(await extractAuthErrorMessage(response));
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in?: number };
  const session: AdminSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    email,
  };

  persistSession(session);
  return session;
}

export async function refreshAdminSession(session: AdminSession): Promise<AdminSession> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new AdminAuthError('A Supabase nincs konfigurálva.');
  }

  const response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });

  if (!response.ok) {
    clearAdminSession();
    throw new AdminAuthError('A munkamenet lejárt, jelentkezz be újra.');
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in?: number };
  const next: AdminSession = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    email: session.email,
  };

  persistSession(next);
  return next;
}

export async function ensureFreshAdminSession(session: AdminSession): Promise<AdminSession> {
  if (!isSessionExpiringSoon(session)) {
    return session;
  }

  return refreshAdminSession(session);
}

export function signOutAdmin() {
  clearAdminSession();
}
