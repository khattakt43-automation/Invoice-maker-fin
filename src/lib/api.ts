/**
 * Shared API client.
 *
 * Security (spec #5/#12): every mutating request reads the double-submit CSRF
 * token from the `csrf` cookie and echoes it as the `X-CSRF-Token` header.
 * Credentials (session cookie) are always sent. Reads (GET) skip the header.
 *
 * - `api(path, opts)` — convenience helper (opts.body is an OBJECT, auto-JSON).
 * - `apiFetch(url, init)` — drop-in replacement for the native `fetch` that
 *   injects CSRF + credentials; `init.body` may be a string or object.
 */

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export async function api<T = any>(
  path: string,
  opts: { method?: ApiMethod; body?: any; headers?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const method = opts.method || "GET";
  const headers: Record<string, string> = { ...(opts.headers || {}) };
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = readCookie("csrf");
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...headers },
  };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
  }
  const res = await fetch(path, init);
  let data: any = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { ok: res.ok, status: res.status, data };
}

export const apiGet = <T = any>(p: string) => api<T>(p, { method: "GET" });
export const apiPost = <T = any>(p: string, body?: any) => api<T>(p, { method: "POST", body });
export const apiPut = <T = any>(p: string, body?: any) => api<T>(p, { method: "PUT", body });
export const apiPatch = <T = any>(p: string, body?: any) => api<T>(p, { method: "PATCH", body });
export const apiDelete = <T = any>(p: string, body?: any) => api<T>(p, { method: "DELETE", body });

/**
 * Drop-in for native fetch that injects the CSRF header + same-origin credentials
 * on any non-safe method. Accepts the exact same arguments as `fetch`.
 */
export async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    const csrf = readCookie("csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  // Always send the session cookie with same-origin requests.
  const creds: RequestCredentials = init.credentials || "include";
  return fetch(url, { ...init, method, headers, credentials: creds });
}
