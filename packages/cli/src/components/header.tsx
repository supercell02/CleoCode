import { useTheme } from "../providers/theme";
import { usePromptConfig } from "../providers/prompt-config";
import { Mode } from "../../../database/generated/prisma/client";
export function Header() { 
    const { mode } = usePromptConfig();
    const { colors } = useTheme();
    return (
        
        <box alignItems="center" justifyContent="center">
            <box justifyContent="center" alignItems="flex-end" flexDirection="row" gap={0.5}>
                <ascii-font text="Cleo" font="tiny" color={mode === Mode.BUILD ? colors.primary : colors.planMode}/>
                <ascii-font text="Code" font="tiny"/>
            </box>
        </box>
    )   
}