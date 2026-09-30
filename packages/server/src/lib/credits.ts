import {
    SUPPORTED_CHAT_MODELS,
    estimateCostUsd,
    findSupportedChatModel,
    type ModelPricing,
    type TokenCounts,
} from "@CleoCode/shared";

// Re-exported so existing imports from `lib/credits` keep working;
// canonical implementation lives in `@CleoCode/shared` (no SDK imports).
export { estimateCostUsd, type TokenCounts } from "@CleoCode/shared";

import type { LanguageModelUsage } from "ai";

export type CalculateCreditsForUsageParams = {
    provider: string;
    model: string;
    usage: LanguageModelUsage;
};

export type BillableUsage = {
    credits: number;
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
};

export type SessionUsage = {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
    credits: number;
};

// Minimal shape for aggregation — matches `ChatMessageMetadata` in
// `routes/chat.ts:30-35` and `hooks/use-chat.tsx:20-25` without importing
// `UIMessage` (keeps `lib/credits.ts` free of UI/tool types).
export type UsageMessageLike = {
    id: string;
    metadata?: {
        model?: string;
        usage?: LanguageModelUsage;
    } | null;
};

export type PerMessageUsage = {
    messageId: string;
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
};

export type SessionUsageBreakdown = SessionUsage & {
    perMessage: PerMessageUsage[];
};

const USD_PER_CREDIT = 0.01;

// Counting rule (verified against `ai` v7 LanguageModelUsage, 2026-09-30):
// - `usage.inputTokens: number | undefined` is the billable input count. It
//   already includes cached input (`inputTokenDetails.cacheReadTokens` /
//   `cacheWriteTokens`); do NOT add details on top. Cached tokens bill at the
//   regular input rate.
// - `usage.outputTokens: number | undefined` is the billable output count. It
//   already includes reasoning (`outputTokenDetails.reasoningTokens` +
//   `textTokens`); do NOT add `reasoningTokens` on top (Anthropic thinking
//   models in `lib/models.ts` report thinking inside `outputTokens`).
// - `usage.totalTokens` is ignored for billing; total = input + output to
//   avoid provider inconsistencies. `totalTokens` may be undefined.
// - Missing input/output (aborted stream, old history) throws here so Polar
//   ingest stays strict; session aggregation treats missing as 0 (see
//   `getSessionUsage` in Phase 1.3).

function getTokenCounts(usage: LanguageModelUsage): TokenCounts {
    const inputTokens = usage.inputTokens;
    const outputTokens = usage.outputTokens;
    
    if (inputTokens == null || outputTokens == null) {
        throw new Error("Credit conversion requires both input and output token counts.");
    }

    return { 
        inputTokens, 
        outputTokens 
    };
};

function getModelPricing(provider: string, model: string): ModelPricing {
    const supportedModel = findSupportedChatModel(model);

    if (!supportedModel || supportedModel.provider !== provider) {
        if (!SUPPORTED_CHAT_MODELS.some((supportedModel) => supportedModel.provider === provider)) {
            throw new Error(`Provider ${provider} is not supported.`);
        }
        throw new Error(`Unsupported billing model: ${model} `);
    }

    return supportedModel.pricing;
};

function convertUsdToCredits(estimatedCostUsd: number) {
    if (estimatedCostUsd <= 0) {
        return 0;
    }

    return Math.max(1, Math.ceil(estimatedCostUsd / USD_PER_CREDIT));
};

function roundTo(value: number, decimals: number) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function getBillableCounts(usage: LanguageModelUsage): TokenCounts | null {
    const inputTokens = usage.inputTokens;
    const outputTokens = usage.outputTokens;

    if (inputTokens == null || outputTokens == null) {
        return null;
    }

    return { inputTokens, outputTokens };
}

// Session aggregation (Phase 1.3). Never throws on history: messages without
// usage (aborted streams in `routes/chat.ts:152-154`, pre-feature history),
// without a model, or with an unknown model are skipped (contribute 0).
// Per-model pricing handles mid-session switches via `/models`.
// Per-message cost rounded to 6 decimals; session total summed from raw costs
// then rounded to 4 decimals; credits derived from the rounded total.
export function getSessionUsage(messages: readonly UsageMessageLike[]): SessionUsageBreakdown {
    const perMessage: PerMessageUsage[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let rawCostUsd = 0;

    for (const message of messages) {
        const model = message.metadata?.model;
        const usage = message.metadata?.usage;

        if (!model || !usage) continue;

        const counts = getBillableCounts(usage);
        if (!counts) continue;

        const supportedModel = findSupportedChatModel(model);
        if (!supportedModel) continue;

        const costUsd = roundTo(estimateCostUsd(counts, supportedModel.pricing), 6);

        inputTokens += counts.inputTokens;
        outputTokens += counts.outputTokens;
        rawCostUsd += estimateCostUsd(counts, supportedModel.pricing);

        perMessage.push({
            messageId: message.id,
            model,
            provider: supportedModel.provider,
            inputTokens: counts.inputTokens,
            outputTokens: counts.outputTokens,
            totalTokens: counts.inputTokens + counts.outputTokens,
            costUsd,
        });
    }

    const costUsd = roundTo(rawCostUsd, 4);

    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        costUsd,
        credits: convertUsdToCredits(costUsd),
        perMessage,
    };
};

export function calculateCreditsForUsage({ 
    provider, 
    model, 
    usage
 }: CalculateCreditsForUsageParams): BillableUsage {
    const tokenCounts = getTokenCounts(usage);
    const pricing = getModelPricing(provider, model);
    const estimatedCostUsd = estimateCostUsd(tokenCounts, pricing);
    const credits = convertUsdToCredits(estimatedCostUsd);

    return { 
        credits,
        costUsd: estimatedCostUsd,
        inputTokens: tokenCounts.inputTokens,
        outputTokens: tokenCounts.outputTokens,
        totalTokens: tokenCounts.inputTokens + tokenCounts.outputTokens,
    };
};
