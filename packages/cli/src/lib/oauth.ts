import open from "open";
import { saveAuth } from "./auth";
import { getApiOrigin, resolveApiUrl } from "./config";

const LOGIN_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

type OAuthState = {
  nonce: string;
  port: number;
};

function toBase64Url(input: Uint8Array | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkceChallange(verifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

function encodeState(state: OAuthState): string {
  return toBase64Url(JSON.stringify(state));
}

function decodeState(state: string) {
  const [encoded] = state.split(".");
  if (!encoded) {
    throw new Error("Invalid state format");
  }

  return JSON.parse(Buffer.from(encoded, "base64").toString("utf-8")) as OAuthState;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function performLogin() {
  const clerkFrontendApi = process.env.CLERK_FRONTEND_API;
  const clientId = process.env.CLERK_OAUTH_CLIENT_ID;
  // Trusted sources only: explicit env / repo install .env / user config.
  // Launch-directory .env is never consulted (see bin/cleocode).
  const apiUrl = resolveApiUrl();
  const apiOrigin = getApiOrigin(apiUrl);

  if (!apiOrigin) {
    throw new Error("Invalid API_URL configuration");
  }
  if (!clerkFrontendApi) {
    throw new Error("Missing required environment variable: CLERK_FRONTEND_API");
  }
  if (!clientId) {
    throw new Error("Missing required environment variable: CLERK_OAUTH_CLIENT_ID");
  }

  const nonce = crypto.randomUUID();
  const codeVerifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const codeChallenge = await createPkceChallange(codeVerifier);

  let settled = false;

  return new Promise<{ token: string }>((resolve, reject) => {
    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname !== "/callback") {
          return new Response("Not Found", { status: 400 });
        }

        const error = url.searchParams.get("error");

        if (error) {
          const msg = url.searchParams.get("error_description") ?? error;
          settled = true;
          reject(new Error(msg));
          setTimeout(() => server.stop(), 500);
          return new Response(`Authentication failed: ${msg}`, { status: 400 });
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");

        if (!code || !state) {
          settled = true;
          reject(new Error("Missing code or state"));
          setTimeout(() => server.stop(), 500);
          return new Response("Bad request", { status: 400 });
        }

        try {
          const payload = decodeState(state);

          if (payload.nonce !== nonce) throw new Error("State Mismatch");
        } catch (err) {
          settled = true;
          reject(err);
          setTimeout(() => server.stop(), 500);
          return new Response("Invalid State", { status: 400 });
        }

        try {
          const redirectUri = `${apiUrl}/auth/callback`;

          const tokenRes = await fetch(`${clerkFrontendApi}/oauth/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
              client_id: clientId,
              code_verifier: codeVerifier,
            }),
          });

          if (!tokenRes.ok) {
            const details = await tokenRes.text();
            throw new Error(details || "Failed to exchange code for token");
          }

          const tokenData = (await tokenRes.json()) as { access_token: string };
          settled = true;
          saveAuth({ token: tokenData.access_token, apiUrl, apiOrigin });
          resolve({ token: tokenData.access_token });
          setTimeout(() => server.stop(), 500);
          return new Response("Authentication successful. You can close this tab.");
        } catch (err) {
          settled = true;
          reject(err);
          const message = getErrorMessage(err);
          setTimeout(() => server.stop(), 500);
          return new Response(`Authentication failed: ${message}`, {
            status: 400,
          });
        }
      },
    });

    const port = server.port;
    if (typeof port !== "number") {
      server.stop();
      reject(new Error("Failed to start callback server"));
      return;
    }

    const state = encodeState({ nonce, port });
    const redirectUri = `${apiUrl}/auth/callback`;

    const authorizeUrl = new URL(`${clerkFrontendApi}/oauth/authorize`);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", "openid profile email");
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("prompt", "login");
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    authorizeUrl.searchParams.set("code_challenge", codeChallenge);

    void open(authorizeUrl.toString());

    setTimeout(() => {
      if (!settled) {
        settled = true;
        server.stop();
        reject(new Error("Login timed out"));
      }
    }, LOGIN_TIMEOUT_MS);
  });
}
