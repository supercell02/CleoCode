import { useMemo } from "react";
import { useChat as useAiChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type InferUITools,
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";

import {
  estimateCostUsd,
  findSupportedChatModel,
  type ModeType,
  type SupportedChatModelId,
  type ToolContracts,
} from "@CleoCode/shared";
import { apiClient, getConfiguredApiOrigin } from "../lib/api-client";
import { getAuthForOrigin } from "../lib/auth";
import { executeLocalTool } from "../lib/local-tools";

export type ChatMessageMetadata = {
  mode?: ModeType;
  model?: SupportedChatModelId | string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

type ChatTools = {
  [Name in keyof InferUITools<ToolContracts>]: {
    input: InferUITools<ToolContracts>[Name]["input"];
    output: unknown;
  };
};

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>;

export type SessionUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
};

const EMPTY_SESSION_USAGE: SessionUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  costUsd: 0,
};

export function useChat(sessionId: string, initialMessages: Message[]) {
  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: apiClient.chat.$url().toString(),
      headers() {
        const auth = getAuthForOrigin(getConfiguredApiOrigin());
        return auth ? { Authorization: `Bearer ${auth.token}` } : new Headers();
      },
      prepareSendMessagesRequest({ messages }) {
        const message = messages[messages.length - 1];
        if (!message) throw new Error("No messages to send");

        const metadata = messages.findLast(
          (m) => m.metadata?.mode && m.metadata?.model,
        )?.metadata;
        const previousMessage = messages[messages.length - 2];
        const requestMessages =
          message.role === "assistant" && previousMessage?.role === "user"
            ? [previousMessage, message]
            : [message];

        return {
          body: {
            id: sessionId,
            messages: requestMessages,
            mode: message.metadata?.mode ?? metadata?.mode,
            model: message.metadata?.model ?? metadata?.model,
          },
        };
      },
    });
  }, [sessionId]);

  const chat = useAiChat<Message>({
    id: sessionId,
    messages: initialMessages,
    transport,
    onToolCall({ toolCall }) {
      const mode = chat.messages.at(-1)?.metadata?.mode ?? "BUILD";
      void executeLocalTool(toolCall.toolName, toolCall.input, mode).then(
        (output) =>
          chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            output,
          }),
      )
      .catch((error) =>
        chat.addToolOutput({
            tool: toolCall.toolName as keyof ChatTools,
            toolCallId: toolCall.toolCallId,
            state: "output-error",
            errorText: error instanceof Error ? error.message : String(error),
        })
    )
    },
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  // Running session totals. `metadata.usage` only arrives on `finish`
  // (server `routes/chat.ts`), so this recomputes exactly once per completed
  // assistant message. Skips streaming/aborted/history messages without
  // usage and unknown models (never throws). Mirrors server `getSessionUsage`
  // totals (per-message pricing, 4-decimal session total).
  const sessionUsage = useMemo<SessionUsage>(() => {
    let inputTokens = 0;
    let outputTokens = 0;
    let rawCostUsd = 0;

    for (const m of chat.messages) {
      const model = m.metadata?.model;
      const usage = m.metadata?.usage;
      if (!model || !usage) continue;

      const inTokens = usage.inputTokens;
      const outTokens = usage.outputTokens;
      if (inTokens == null || outTokens == null) continue;

      const supported = findSupportedChatModel(model);
      if (!supported) continue;

      inputTokens += inTokens;
      outputTokens += outTokens;
      rawCostUsd += estimateCostUsd(
        { inputTokens: inTokens, outputTokens: outTokens },
        supported.pricing,
      );
    }

    if (inputTokens === 0 && outputTokens === 0) return EMPTY_SESSION_USAGE;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUsd: Math.round(rawCostUsd * 10000) / 10000,
    };
  }, [chat.messages]);

  return {
    messages: chat.messages,
    status: chat.status,
    error: chat.error,
    sessionUsage,
    submit: (params: { userText: string; mode:ModeType; model: SupportedChatModelId }) => {
        return chat.sendMessage({
            text: params.userText,
            metadata: {
                mode: params.mode,
                model: params.model,
            },
        })
    },
    abort: chat.stop,
    interrupt: chat.stop,
  }
}
