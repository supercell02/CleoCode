import { TextAttributes } from "@opentui/core";
import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/prompt-config";
import { Mode } from "@CleoCode/shared";

export type StatusBarUsage = {
    totalTokens: number;
    costUsd: number;
};

export function formatTokens(totalTokens: number): string {
    if (!Number.isFinite(totalTokens) || totalTokens <= 0) return "0";
    if (totalTokens < 1000) return `${Math.floor(totalTokens)}`;
    if (totalTokens < 1_000_000) {
        const k = totalTokens / 1000;
        return `${k.toFixed(1).replace(/\.0$/, "")}k`;
    }
    return `${(totalTokens / 1_000_000).toFixed(2)}M`;
}

export function formatUsd(costUsd: number): string {
    if (!Number.isFinite(costUsd) || costUsd <= 0) return "$0.0000";
    return `$${costUsd.toFixed(4)}`;
}

export function formatSessionTotal(usage?: StatusBarUsage | null): string {
    const totalTokens = usage?.totalTokens ?? 0;
    const costUsd = usage?.costUsd ?? 0;
    return `${formatTokens(totalTokens)} tok (${formatUsd(costUsd)})`;
}

export function StatusBar({ usage }: { usage?: StatusBarUsage | null }) { 
    const { mode, model } = usePromptConfig();
    const { colors } = useTheme();
    return (
        <box flexDirection="row" gap={1} width="100%" justifyContent="space-between">
            <box flexDirection="row" gap={1}>
            <text fg={ mode === Mode.PLAN ? colors.planMode : colors.primary}>
                {mode === Mode.BUILD ? "Build" : "Plan"}
            </text>
            <text attributes={TextAttributes.DIM} fg={colors.dimSeparator}>
                &#8250;
            </text>           
            <text fg={colors.primary}>
                {model}
            </text>
            </box>
            <text attributes={TextAttributes.DIM}>
                {formatSessionTotal(usage)}
            </text>
        </box>
    )
}
