import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type InferUITools,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";

import { db } from "@CleoCode/database/client";
import type { Prisma } from "@CleoCode/database";
import {
  getToolContracts,
  modeSchema,
  type ModeType,
  type ToolContracts,
} from "@CleoCode/shared";

import { buildSystemPrompt } from "../system-prompt";
import type { AuthenticatedEnv } from "../middleware/require-auth";
import { requireCreditsBalance } from "../middleware/require-credits-balance";
import { calculateCreditsForUsage } from "../lib/credits";
import { ingestAiUsage } from "../lib/polar";
import { isSupportedChatModel, resolveChatModel } from "../lib/models";

type ChatMessageMetadata = {
  mode?: ModeType;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

type CleoCodeUIMessage = UIMessage<
  ChatMessageMetadata,
  never,
  InferUITools<ToolContracts>
>;

const submitSchema = z.object({
  id: z.string(),
  messages: z
    .array(
      z.custom<CleoCodeUIMessage>((value) => {
        return (
          value !== null &&
          typeof value === "object" &&
          "id" in value &&
          "parts" in value
        );
      }),
    )
    .min(1),
  mode: modeSchema,
  model: z.string().refine(isSupportedChatModel, "Unsupported model"),
});

const submitValidator = zValidator("json", submitSchema, (result, c) => {
  if (!result.success) {
    return c.json({ error: result.error.message }, 400);
  }
});

function hasPendingToolCalls(messages: CleoCodeUIMessage) {
  return messages.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }
    return false;
  });
}

const app = new Hono<AuthenticatedEnv>().post(
  "/",
  requireCreditsBalance,
  submitValidator,
  async (c) => {
    const userId = c.get("userId");
    const { id, messages, mode, model } = c.req.valid("json");

    const session = await db.session.findUnique({
      where: { id, userId },
    });

    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const startTime = Date.now();
    const tools = getToolContracts(mode);
    const resolvedModel = resolveChatModel(model);
    const previousMessages = Array.isArray(session.messages)
      ? (session.messages as unknown as CleoCodeUIMessage[])
      : [];
    const mergedMessages = [...previousMessages];

    for (const message of messages) {
      const incomingMessage = {
        ...message,
        metadata: { ...message.metadata, mode, model },
      } satisfies CleoCodeUIMessage;
      const existingMessageIndex = mergedMessages.findIndex(
        (m) => m.id === incomingMessage.id,
      );

      if (existingMessageIndex !== -1) {
        mergedMessages[existingMessageIndex] = incomingMessage;
      } else {
        mergedMessages.push(incomingMessage);
      }
    }

    const nextMessages = await validateUIMessages<CleoCodeUIMessage>({
      messages: mergedMessages,
      tools,
    });

    const modelMessages = await convertToModelMessages(nextMessages, { tools });
    let completedUsage: LanguageModelUsage | null = null;

    const result = streamText({
      model: resolvedModel.model,
      system: buildSystemPrompt({ mode }),
      messages: modelMessages,
      tools,
      providerOptions: resolvedModel.providerOptions,
      onFinish(event) {
        completedUsage = event.totalUsage;
      },
    });

    return result.toUIMessageStreamResponse<CleoCodeUIMessage>({
      originalMessages: nextMessages,
      messageMetadata({ part }) {
        if (part.type === "start") {
          return { mode, model };
        }

        if (part.type !== "finish") return undefined;
        // `part.totalUsage` is the synchronous source of truth on the finish
        // chunk. The outer `completedUsage` (set in `streamText onFinish`) is
        // only a fallback — it may not have fired yet when this runs, which
        // previously dropped `usage` and left client totals at zero.
        const usage = part.totalUsage ?? completedUsage;
        const hasBillableUsage =
          usage?.inputTokens != null && usage?.outputTokens != null;
        return {
          mode,
          model,
          durationMs: Date.now() - startTime,
          ...(hasBillableUsage ? { usage } : {}),
        };
      },
      async onFinish(event) {
        if (event.isAborted) return;

        if (hasPendingToolCalls(event.responseMessage)) return;

        await db.session.update({
          where: { id, userId },
          data: {
            messages: event.messages as unknown as Prisma.JsonArray,
          },
        });

        if (!completedUsage) return;

        try {
          const billableUsage = calculateCreditsForUsage({
            provider: resolvedModel.provider,
            model: resolvedModel.modelId,
            usage: completedUsage,
          });

          await ingestAiUsage({
            externalCustomerId: userId,
            eventId: `chat-message:${event.responseMessage.id}`,
            credits: billableUsage.credits,
          });
        } catch (error) {
          console.error("Failed to ingest Polar AI Usage for chat message", {
            error,
            sessionId: id,
            messageId: event.responseMessage.id,
            userId,
          });
        }
      },
      onError(error) {
        return error instanceof Error ? error.message : String(error);
      },
    });
  },
);

export default app;
