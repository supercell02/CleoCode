export type ThemeColors = {
    primary: string;
    planMode: string;
    selection: string;
    thinking: string;
    success: string;
    error: string;
    info: string;
    background: string;
    surface: string;    
    dialogSurface: string;
    thinkingBorder: string;
    dimSeparator: string;
};

export type Theme = {
    name: string;
    colors: ThemeColors;
};

export const THEMES: Theme[] = [
    {
        name: "NightFox",
        colors: {
            primary: "#56D6C2",
            planMode: "#CF8EF4",
            selection: "#89B4FA",
            thinking: "#CF8EF4",
            success: "#82E0AA",
            error: "#E74C5E",
            info: "#56D6C2",
            background: "#0D0D12",
            surface: "#1A1A24",
            dialogSurface: "#0A0A10",
            thinkingBorder: "#34344A",
            dimSeparator: "#4E4E66"
        }
    },
    {
        name: "Midnight Frost",
        colors: {
            primary: "#4DD0E1",
            planMode: "#BB86FC",
            selection: "#64B5F6",
            thinking: "#9C27B0",
            success: "#81C784",
            error: "#FF6B6B",
            info: "#4DD0E1",
            background: "#0A0E27",
            surface: "#1A1F3A",
            dialogSurface: "#0F1429",
            thinkingBorder: "#2D3E5F",
            dimSeparator: "#3D4F71"
        }
    },
    {
        name: "Dracula Pro",
        colors: {
            primary: "#8BE9FD",
            planMode: "#FF79C6",
            selection: "#8BE9FD",
            thinking: "#FF79C6",
            success: "#50FA7B",
            error: "#FF5555",
            info: "#8BE9FD",
            background: "#191A21",
            surface: "#282A36",
            dialogSurface: "#21222C",
            thinkingBorder: "#44475A",
            dimSeparator: "#6272A4"
        }
    },
    {
        name: "Cyberpunk Neon",
        colors: {
            primary: "#00F0FF",
            planMode: "#FF006E",
            selection: "#00F5FF",
            thinking: "#FF006E",
            success: "#39FF14",
            error: "#FF0040",
            info: "#00F0FF",
            background: "#0A0E27",
            surface: "#1B1F4D",
            dialogSurface: "#0F1127",
            thinkingBorder: "#2B3E7F",
            dimSeparator: "#5A6FA3"
        }
    },
    {
        name: "Solarized Dark",
        colors: {
            primary: "#2AA198",
            planMode: "#D33682",
            selection: "#268BD2",
            thinking: "#6C71C4",
            success: "#859900",
            error: "#DC322F",
            info: "#2AA198",
            background: "#002B36",
            surface: "#073642",
            dialogSurface: "#00232A",
            thinkingBorder: "#586E75",
            dimSeparator: "#657B83"
        }
    },
    {
        name: "Forest Twilight",
        colors: {
            primary: "#7CFC00",
            planMode: "#D8A5FF",
            selection: "#87CEEB",
            thinking: "#BA55D3",
            success: "#3CB371",
            error: "#FF6347",
            info: "#7CFC00",
            background: "#1B2B1F",
            surface: "#2D4A33",
            dialogSurface: "#162320",
            thinkingBorder: "#3D5D47",
            dimSeparator: "#4D7D67"
        }
    },
    {
        name: "Ocean Deep",
        colors: {
            primary: "#00D4FF",
            planMode: "#FF1493",
            selection: "#1E90FF",
            thinking: "#DA70D6",
            success: "#00FA9A",
            error: "#FF4500",
            info: "#00D4FF",
            background: "#0B1929",
            surface: "#162E47",
            dialogSurface: "#0D1C2A",
            thinkingBorder: "#2A4D6F",
            dimSeparator: "#3A6D9F"
        }
    },
    {
        name: "Sunset Ember",
        colors: {
            primary: "#FFB347",
            planMode: "#FF69B4",
            selection: "#FFA500",
            thinking: "#FF69B4",
            success: "#90EE90",
            error: "#FF4444",
            info: "#FFB347",
            background: "#2B1B0F",
            surface: "#3D2817",
            dialogSurface: "#23140B",
            thinkingBorder: "#5D4837",
            dimSeparator: "#7D6855"
        }
    },
    {
        name: "Synthwave 80s",
        colors: {
            primary: "#FF006E",
            planMode: "#00F0FF",
            selection: "#FFBE0B",
            thinking: "#00F0FF",
            success: "#FB5607",
            error: "#FF0000",
            info: "#FF006E",
            background: "#1A0033",
            surface: "#2D004D",
            dialogSurface: "#140026",
            thinkingBorder: "#4D0080",
            dimSeparator: "#6D00B3"
        }
    },
    {
        name: "Ethereal Purple",
        colors: {
            primary: "#B19CD9",
            planMode: "#FF85E0",
            selection: "#9D84B7",
            thinking: "#DDA0DD",
            success: "#98FB98",
            error: "#FF6B9D",
            info: "#B19CD9",
            background: "#1F1533",
            surface: "#2D1B47",
            dialogSurface: "#17101F",
            thinkingBorder: "#3D2B5F",
            dimSeparator: "#5D4B8F"
        }
    },
    {
        name: "Monokai Vibrant",
        colors: {
            primary: "#66D9EF",
            planMode: "#F92672",
            selection: "#A1EFE4",
            thinking: "#F92672",
            success: "#A6E22E",
            error: "#F92672",
            info: "#66D9EF",
            background: "#272822",
            surface: "#3E3D32",
            dialogSurface: "#1E1D1A",
            thinkingBorder: "#49483E",
            dimSeparator: "#75715E"
        }
    },
    {
        name: "Emerald Matrix",
        colors: {
            primary: "#00FF41",
            planMode: "#FF00FF",
            selection: "#00E5FF",
            thinking: "#FF00FF",
            success: "#00FF88",
            error: "#FF0055",
            info: "#00FF41",
            background: "#0A1F0F",
            surface: "#1A3F1F",
            dialogSurface: "#061209",
            thinkingBorder: "#2D5D37",
            dimSeparator: "#4D8D67"
        }
    },
    {
        name: "Lavender Mist",
        colors: {
            primary: "#C8B6FF",
            planMode: "#F5A8D8",
            selection: "#B0C4DE",
            thinking: "#DDA0DD",
            success: "#A9DFBF",
            error: "#F8989E",
            info: "#C8B6FF",
            background: "#1E1B2E",
            surface: "#2D2847",
            dialogSurface: "#16131F",
            thinkingBorder: "#3D3A57",
            dimSeparator: "#5D5A87"
        }
    }
];

export const DEFAULT_THEME = THEMES.find((t) => t.name === "NightFox")!;