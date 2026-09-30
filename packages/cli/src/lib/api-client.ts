import {hc} from "hono/client";
import type { AppType } from "@CleoCode/server";
import { clearAuth, getAuth } from "./auth";

const apiUrl = (process.env.API_URL ?? "").trim() || "http://localhost:3000";

export const apiClient = hc<AppType>(
    apiUrl,
    {
        fetch: async (
            input: Parameters<typeof fetch>[0], 
            init: Parameters<typeof fetch>[1]) => 
                {
            const headers = new Headers(init?.headers);
            const auth = getAuth();

            if (auth) {
                headers.set("Authorization", `Bearer ${auth.token}`);
            }

            const response = await fetch(input, { ...init, headers });

            if (response.status === 401) {
                clearAuth();
            }

            return response;
        }
    }
);
