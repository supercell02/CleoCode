import "opentui-spinner/react";
import { Mode , type ModeType} from "@CleoCode/shared";
import { useTheme } from "../providers/theme";

type Props = {
    mode?: ModeType;
}

export function Spinner({ mode }: Props) {
    const { colors } = useTheme();
    const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary;
    return <spinner name="aesthetic" color={activeColor} />;
}