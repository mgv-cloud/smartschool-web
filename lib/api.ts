// Thin fetch wrapper for the SmartSchool API. Tokens are kept in localStorage for this Phase 1
// build for simplicity — swap for httpOnly cookies before going to production (noted in README).
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smartschool_access_token');
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('smartschool_access_token', accessToken);
  localStorage.setItem('smartschool_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('smartschool_access_token');
  localStorage.removeItem('smartschool_refresh_token');
}

export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data as T;
}
