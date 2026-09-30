import { Mode , type ModeType} from "@CleoCode/shared";
import { useEffect, useState } from "react";
import { useTheme } from "../providers/theme";

type Props = {
    mode?: ModeType;
}

export function Spinner({ mode }: Props) {
    const { colors } = useTheme();
    const activeColor = mode === Mode.PLAN ? colors.planMode : colors.primary;
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setFrame((f) => (f + 1) % frames.length);
        }, 80);

        return () => clearInterval(id);
    }, [frames.length]);

    return <text fg={activeColor}>{frames[frame]}</text>;
}
