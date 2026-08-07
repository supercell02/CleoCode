import { useTheme } from "../providers/theme";

export function Header() { 
    const { colors } = useTheme();
    return (
        
        <box alignItems="center" justifyContent="center">
            <box justifyContent="center" alignItems="flex-end" flexDirection="row" gap={0.5}>
                <ascii-font text="Cleo" font="tiny" color={colors.primary}/>
                <ascii-font text="Code" font="tiny"/>
            </box>
        </box>
    )   
}