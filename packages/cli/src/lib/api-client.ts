import { hc } from "hono/client";
import type { AppType } from "@CleoCode/server";
import { clearAuth, getAuthForOrigin } from "./auth";
import { getApiOrigin, resolveApiUrl } from "./config";

const apiUrl = resolveApiUrl();
const apiOrigin = getApiOrigin(apiUrl);

export const apiClient = hc<AppType>(apiUrl, {
  fetch: async (input: Parameters<typeof fetch>[0], init: Parameters<typeof fetch>[1]) => {
    const headers = new Headers(init?.headers);
    const auth = getAuthForOrigin(apiOrigin);
    const attachedToken = Boolean(auth);

    if (auth) {
      headers.set("Authorization", `Bearer ${auth.token}`);
    }

    const response = await fetch(input, { ...init, headers });

    // Only clear saved credentials when the trusted origin rejects them.
    // A 401 from any other origin must not delete the user's login.
    if (response.status === 401 && attachedToken) {
      clearAuth();
    }

    return response;
  },
});

export function getConfiguredApiUrl(): string {
  return apiUrl;
}

export function getConfiguredApiOrigin(): string {
  return apiOrigin;
}
