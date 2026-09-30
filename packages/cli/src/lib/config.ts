import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_API_URL = "http://localhost:3000";

const CONFIG_DIR = join(homedir(), ".cleocode");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

type UserConfig = {
  apiUrl?: unknown;
  api_url?: unknown;
  API_URL?: unknown;
};

function readUserConfigFile(): UserConfig | null {
  try {
    if (!existsSync(CONFIG_FILE)) return null;
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as UserConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function pickUserApiUrl(config: UserConfig | null): string {
  if (!config) return "";
  const candidates = [config.apiUrl, config.api_url, config.API_URL];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return "";
}

/** Normalize to `origin + pathname` without trailing slash, or "" if invalid. */
export function normalizeApiUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const pathname = url.pathname.replace(/\/+$/, "");
    return `${url.origin}${pathname === "/" ? "" : pathname}`;
  } catch {
    return "";
  }
}

/** Return the URL origin (`scheme://host:port`), or "" if invalid. */
export function getApiOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

/**
 * Resolve the API URL from trusted sources only.
 * Precedence: explicit process env (includes repo install .env loaded by the
 * launcher) > user-level ~/.cleocode/config.json > default.
 * Launch-directory `.env` files are never consulted here.
 */
export function resolveApiUrl(): string {
  const fromEnv = (process.env.API_URL ?? "").trim();
  if (fromEnv) return normalizeApiUrl(fromEnv) || fromEnv;

  const fromUserConfig = pickUserApiUrl(readUserConfigFile());
  if (fromUserConfig) return normalizeApiUrl(fromUserConfig) || fromUserConfig;

  return DEFAULT_API_URL;
}

/** Origin bound to saved credentials for the current configuration. */
export function resolveApiOrigin(): string {
  return getApiOrigin(resolveApiUrl());
}
