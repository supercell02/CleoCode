import { Hono } from 'hono';
// import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import * as Sentry from "@sentry/hono/bun";
import { z } from 'zod';
import { db } from "@CleoCode/database";

import type { AuthenticatedEnv } from '../middleware/require-auth';
import { requireCreditsBalance } from '../middleware/require-credits-balance';
import { getSessionUsage, type UsageMessageLike } from '../lib/credits';

function toUsageMessages(messages: unknown): UsageMessageLike[] {
    if (!Array.isArray(messages)) return [];
    return messages as unknown as UsageMessageLike[];
}

const createSessionSchema = z.object({
    title:z.string(),
});

const createSessionValidator = zValidator(
    "json",
    createSessionSchema,(result,c) =>{
        if(!result.success){
            Sentry.logger.warn("Session creation validation failed",{
                path: c.req.path,
                errors: result.error.issues.length,
            });
            return c.json({error:"Invalid request body"},400);
        }
    })

const app = new Hono<AuthenticatedEnv>()
    .get("/", async (c) => {
        const userId = c.get("userId");
        const withUsage = c.req.query("withUsage") === "true";

        if (!withUsage) {
            const sessions = await db.session.findMany({
                where:{userId},
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                }
            });

            Sentry.logger.info("Listed sessions",{
                count: sessions.length,
            });

            return c.json(sessions);
        }

        const sessions = await db.session.findMany({
            where:{userId},
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                messages: true,
            }
        });

        const withTotals = sessions.map(({ messages, ...rest }) => ({
            ...rest,
            usage: getSessionUsage(toUsageMessages(messages)),
        }));

        Sentry.logger.info("Listed sessions with usage",{
            count: withTotals.length,
        });

        return c.json(withTotals);
    })
    .get("/:id",async (c) => {
        // await new Promise((r) => setTimeout(r, 5000));

        // throw new HTTPException(
        //     500, 
        //     {message:"Mock error: session loading failed"}
        // );

        const id = c.req.param("id");
        const userId = c.get("userId");
        const session = await db.session.findUnique({
            where: {id , userId},
        });
        if (!session) {
            Sentry.logger.warn("Session not found",{
                sessionid: id,
                userId: userId,
            });
            return c.json({ error: "Session not found" }, 404);
        }

        Sentry.logger.info("Loaded session",
            {
                sessionid: session.id,
                userId: userId,
            });
        const usage = getSessionUsage(toUsageMessages(session.messages));
        return c.json({ ...session, usage });
    })
    .post("/", requireCreditsBalance, createSessionValidator, async (c) => {
        //  await new Promise((r) => setTimeout(r, 5000));

        // throw new HTTPException(
        //     500, 
        //     {message:"Mock error: session loading failed"}
        //  );
        const userId = c.get("userId");
        const data = c.req.valid("json");

        const session = await db.session.create({
            data: {
                ...data,
                userId,
            },
        })
    Sentry.logger.info("Created new session",{
        sessionid: session.id,
        title: session.title,
        userId: session.userId,
    })
        return c.json(session, 201);
    })

export default app;