import {
    SUPPORTED_CHAT_MODELS,
    findSupportedChatModel,
    type ModelPricing,
} from "@CleoCode/shared";

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

type TokenCounts = {
    inputTokens: number;
    outputTokens: number;
};

const TOKEN_PER_MILLION = 1_000_000;

const USD_PER_CREDIT = 0.01;

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

export function estimateCostUsd({ inputTokens, outputTokens }: TokenCounts, pricing: ModelPricing) {
    return (
        (inputTokens * pricing.inputUsdPerMillionTokens + outputTokens * pricing.outputUsdPerMillionTokens) / TOKEN_PER_MILLION
    );
};

function convertUsdToCredits(estimatedCostUsd: number) {
    if (estimatedCostUsd <= 0) {
        return 0;
    }

    return Math.max(1, Math.ceil(estimatedCostUsd / USD_PER_CREDIT));
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
