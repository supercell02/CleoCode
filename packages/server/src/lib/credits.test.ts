import { describe, expect, test } from "bun:test";
import { calculateCreditsForUsage, estimateCostUsd } from "./credits";
import { SUPPORTED_CHAT_MODELS, findSupportedChatModel } from "@CleoCode/shared";
import type { LanguageModelUsage } from "ai";

function makeUsage(inputTokens?: number, outputTokens?: number): LanguageModelUsage {
    return {
        inputTokens,
        outputTokens,
        totalTokens:
            inputTokens != null && outputTokens != null
                ? inputTokens + outputTokens
                : undefined,
        inputTokenDetails: {
            noCacheTokens: undefined,
            cacheReadTokens: undefined,
            cacheWriteTokens: undefined,
        },
        outputTokenDetails: {
            textTokens: undefined,
            reasoningTokens: undefined,
        },
    };
}

describe("calculateCreditsForUsage", () => {
    test("gpt-5.4 1k in / 500 out = $0.01 = 1 credit", () => {
        const r = calculateCreditsForUsage({
            provider: "openai",
            model: "gpt-5.4",
            usage: makeUsage(1000, 500),
        });
        // (1000*2.5 + 500*15) / 1M = 0.01
        expect(r.costUsd).toBeCloseTo(0.01, 10);
        expect(r.credits).toBe(1);
        expect(r.inputTokens).toBe(1000);
        expect(r.outputTokens).toBe(500);
        expect(r.totalTokens).toBe(1500);
    });

    test("per-model pricing differs (claude-sonnet-4-6)", () => {
        const usage = makeUsage(1000, 500);
        const r = calculateCreditsForUsage({
            provider: "anthropic",
            model: "claude-sonnet-4-6",
            usage,
        });
        // (1000*3 + 500*15) / 1M = 0.0105 -> ceil(0.0105/0.01) = 2
        expect(r.costUsd).toBeCloseTo(0.0105, 10);
        expect(r.credits).toBe(2);
    });

    test("zero usage = 0 credits, 0 USD", () => {
        const r = calculateCreditsForUsage({
            provider: "openai",
            model: "gpt-5.4",
            usage: makeUsage(0, 0),
        });
        expect(r.costUsd).toBe(0);
        expect(r.credits).toBe(0);
        expect(r.totalTokens).toBe(0);
    });

    test("small usage rounds up to minimum 1 credit", () => {
        const r = calculateCreditsForUsage({
            provider: "openai",
            model: "gpt-5.4-nano",
            usage: makeUsage(10, 10),
        });
        // (10*0.2 + 10*1.25)/1M = 0.0000145 -> 1 credit
        expect(r.costUsd).toBeGreaterThan(0);
        expect(r.credits).toBe(1);
    });

    test("missing inputTokens throws (strict billing path)", () => {
        expect(() =>
            calculateCreditsForUsage({
                provider: "openai",
                model: "gpt-5.4",
                usage: makeUsage(undefined, 100),
            }),
        ).toThrow("Credit conversion requires both input and output token counts.");
    });

    test("missing outputTokens throws", () => {
        expect(() =>
            calculateCreditsForUsage({
                provider: "openai",
                model: "gpt-5.4",
                usage: makeUsage(100, undefined),
            }),
        ).toThrow("Credit conversion requires both input and output token counts.");
    });

    test("unknown model throws Unsupported billing model", () => {
        expect(() =>
            calculateCreditsForUsage({
                provider: "openai",
                model: "gpt-99",
                usage: makeUsage(100, 100),
            }),
        ).toThrow("Unsupported billing model");
    });

    test("wrong provider for model throws", () => {
        expect(() =>
            calculateCreditsForUsage({
                provider: "anthropic",
                model: "gpt-5.4",
                usage: makeUsage(100, 100),
            }),
        ).toThrow("Unsupported billing model");
    });

    test("unknown provider throws", () => {
        expect(() =>
            calculateCreditsForUsage({
                provider: "google",
                model: "gemini-x",
                usage: makeUsage(100, 100),
            }),
        ).toThrow("Provider google is not supported.");
    });

    test("reasoning tokens are not double-counted (outputTokens already includes them)", () => {
        // Provider reports reasoning inside outputTokens; we bill outputTokens only.
        const withReasoning: LanguageModelUsage = {
            ...makeUsage(1000, 2000),
            outputTokenDetails: { textTokens: 500, reasoningTokens: 1500 },
        };
        const model = findSupportedChatModel("claude-sonnet-4-6")!;
        const expected = estimateCostUsd(
            { inputTokens: 1000, outputTokens: 2000 },
            model.pricing,
        );
        const r = calculateCreditsForUsage({
            provider: "anthropic",
            model: "claude-sonnet-4-6",
            usage: withReasoning,
        });
        expect(r.costUsd).toBeCloseTo(expected, 10);
    });

    test("every supported model calculates without throwing", () => {
        for (const m of SUPPORTED_CHAT_MODELS) {
            const r = calculateCreditsForUsage({
                provider: m.provider,
                model: m.id,
                usage: makeUsage(100, 100),
            });
            expect(r.totalTokens).toBe(200);
            expect(r.credits).toBeGreaterThanOrEqual(1);
        }
    });
});
