import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { getApiOrigin, resolveApiUrl } from "./config";

export type AuthData = {
  token: string;
  /** Origin (scheme://host:port) the token was issued for. */
  apiOrigin: string;
  /** Full API URL at login time, for display/debugging. */
  apiUrl?: string;
};

const AUTH_DIR = join(homedir(), ".cleocode");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

export function getAuth(): AuthData | null {
  try {
    const data = readFileSync(AUTH_FILE, "utf-8");
    const parsed = JSON.parse(data) as Partial<AuthData>;

    if (typeof parsed.token !== "string" || !parsed.token) return null;
    // Legacy files predate origin binding and must not be forwarded blindly.
    if (typeof parsed.apiOrigin !== "string" || !parsed.apiOrigin) return null;

    return {
      token: parsed.token,
      apiOrigin: parsed.apiOrigin,
      ...(typeof parsed.apiUrl === "string" ? { apiUrl: parsed.apiUrl } : {}),
    };
  } catch {
    return null;
  }
}

export function saveAuth(data: { token: string; apiUrl?: string; apiOrigin?: string }) {
  if (!existsSync(AUTH_DIR)) {
    mkdirSync(AUTH_DIR, { mode: 0o700 });
  }
  const apiUrl = data.apiUrl ?? resolveApiUrl();
  const apiOrigin = data.apiOrigin ?? getApiOrigin(apiUrl);
  const payload: AuthData = { token: data.token, apiOrigin, apiUrl };
  writeFileSync(AUTH_FILE, JSON.stringify(payload), { mode: 0o600 });
}

export function clearAuth() {
  try {
    unlinkSync(AUTH_FILE);
  } catch {
    // Ignore errors
  }
}

/** Only attach credentials when the stored origin matches the current API origin. */
export function getAuthForOrigin(origin: string): AuthData | null {
  const auth = getAuth();
  if (!auth) return null;
  if (!origin || auth.apiOrigin !== origin) return null;
  return auth;
}
