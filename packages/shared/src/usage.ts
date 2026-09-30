import type { ModelPricing } from "./models";

export type TokenCounts = {
    inputTokens: number;
    outputTokens: number;
};

export const TOKEN_PER_MILLION = 1_000_000;

export function estimateCostUsd(
    { inputTokens, outputTokens }: TokenCounts,
    pricing: ModelPricing,
) {
    return (
        (inputTokens * pricing.inputUsdPerMillionTokens +
            outputTokens * pricing.outputUsdPerMillionTokens) /
        TOKEN_PER_MILLION
    );
}
