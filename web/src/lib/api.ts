const ROUTER_URL = process.env.NEXT_PUBLIC_ROUTER_URL;
if (!ROUTER_URL) {
  throw new Error("NEXT_PUBLIC_ROUTER_URL is not set");
}

const SESSION_KEY = "idleproxy_session";

export function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY);
}

export function setSession(token: string): void {
  window.localStorage.setItem(SESSION_KEY, token);
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const session = getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (session) headers.Authorization = `Bearer ${session}`;

  return fetch(`${ROUTER_URL}${path}`, { ...opts, headers });
}
