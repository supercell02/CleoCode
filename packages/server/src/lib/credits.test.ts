import { describe, expect, test } from "bun:test";
import { calculateCreditsForUsage, estimateCostUsd, getSessionUsage } from "./credits";
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

describe("getSessionUsage", () => {
    test("empty session = zeros", () => {
        const r = getSessionUsage([]);
        expect(r).toEqual({
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            costUsd: 0,
            credits: 0,
            perMessage: [],
        });
    });

    test("multi-message same model sums correctly", () => {
        const r = getSessionUsage([
            { id: "m1", metadata: { model: "gpt-5.4", usage: makeUsage(1000, 500) } },
            { id: "m2", metadata: { model: "gpt-5.4", usage: makeUsage(2000, 1000) } },
        ]);
        // msg1: (1000*2.5+500*15)/1M = 0.01; msg2: (2000*2.5+1000*15)/1M = 0.02
        expect(r.inputTokens).toBe(3000);
        expect(r.outputTokens).toBe(1500);
        expect(r.totalTokens).toBe(4500);
        expect(r.costUsd).toBeCloseTo(0.03, 10);
        expect(r.credits).toBe(3);
        expect(r.perMessage).toHaveLength(2);
        expect(r.perMessage[0]!.messageId).toBe("m1");
        expect(r.perMessage[0]!.costUsd).toBeCloseTo(0.01, 10);
    });

    test("mixed-model session uses per-message pricing", () => {
        const r = getSessionUsage([
            { id: "m1", metadata: { model: "gpt-5.4", usage: makeUsage(1000, 0) } },
            { id: "m2", metadata: { model: "claude-sonnet-4-6", usage: makeUsage(1000, 0) } },
        ]);
        // gpt-5.4: 1000*2.5/1M = 0.0025; sonnet: 1000*3/1M = 0.003; total 0.0055
        expect(r.inputTokens).toBe(2000);
        expect(r.costUsd).toBeCloseTo(0.0055, 10);
        expect(r.credits).toBe(1);
        expect(r.perMessage[0]!.provider).toBe("openai");
        expect(r.perMessage[1]!.provider).toBe("anthropic");
    });

    test("messages without usage / model / unknown model are skipped, never throw", () => {
        const r = getSessionUsage([
            { id: "user-1", metadata: { model: "gpt-5.4" } },
            { id: "aborted", metadata: { model: "gpt-5.4", usage: makeUsage(undefined, 100) } },
            { id: "no-meta" },
            { id: "unknown", metadata: { model: "gpt-99", usage: makeUsage(9999, 9999) } },
            { id: "good", metadata: { model: "gpt-5.4", usage: makeUsage(100, 100) } },
        ]);
        expect(r.inputTokens).toBe(100);
        expect(r.outputTokens).toBe(100);
        expect(r.totalTokens).toBe(200);
        expect(r.perMessage).toHaveLength(1);
        expect(r.perMessage[0]!.messageId).toBe("good");
    });

    test("rounding: per-message 6 decimals, session total 4 decimals", () => {
        // 1 in-token on nano: 1*0.2/1M = 0.0000002 -> rounds to 0.000000
        const r = getSessionUsage([
            { id: "m1", metadata: { model: "gpt-5.4-nano", usage: makeUsage(1, 1) } },
        ]);
        // raw: (0.2+1.25)/1M = 0.00000145 -> 6dp = 0.000001; total 4dp = 0
        expect(r.perMessage[0]!.costUsd).toBe(0.000001);
        expect(r.costUsd).toBe(0);
        expect(r.credits).toBe(0);
    });
});
