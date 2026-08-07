import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { createContext, useContext, useCallback, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { Theme, ThemeColors } from "./theme";
import { DEFAULT_THEME, THEMES } from "./theme";

const CONFIG_DIR = join(homedir(), ".cleocode");
const THEME_PREFERENCES_PATH = join(CONFIG_DIR, "preferences.json");

type ThemePreferences = {
    themeName: string;
};

function getInitialTheme(): Theme {
    try {
        const fileContent = readFileSync(THEME_PREFERENCES_PATH, "utf-8");
        const preferences = JSON.parse(fileContent) as Partial<ThemePreferences>;
        
        if (preferences.themeName) {
            const savedTheme = THEMES.find((theme) => theme.name === preferences.themeName);
            if (savedTheme) {
                console.log(`[Theme] Loaded saved theme: ${savedTheme.name}`);
                return savedTheme;
            }
        }
    } catch (error) {
        console.log(`[Theme] No saved preferences found or error reading file:`, error instanceof Error ? error.message : "Unknown error");
    }
    
    console.log(`[Theme] Using default theme: ${DEFAULT_THEME.name}`);
    return DEFAULT_THEME;
}

function persistTheme(theme: Theme): boolean {
    try {
        // Ensure directory exists
        mkdirSync(CONFIG_DIR, { recursive: true });
        
        const preferencesData: ThemePreferences = { themeName: theme.name };
        const jsonContent = JSON.stringify(preferencesData, null, 2);
        
        // Write file synchronously
        writeFileSync(THEME_PREFERENCES_PATH, jsonContent, "utf8");
        
        console.log(`[Theme] Successfully saved theme "${theme.name}" to ${THEME_PREFERENCES_PATH}`);
        return true;
    } catch (error) {
        console.error(`[Theme] Failed to persist theme:`, error instanceof Error ? error.message : "Unknown error");
        return false;
    }
}

type ThemeContextValue = {
    currentTheme: Theme;
    setTheme: (theme: Theme) => void;
    colors: ThemeColors;
    availableThemes: Theme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
    const value = useContext(ThemeContext);
    if (!value) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return value;
}

type ThemeProviderProps = {
    children: ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [currentTheme, setCurrentTheme] = useState<Theme>(() => getInitialTheme());
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize on mount - read from disk
    useEffect(() => {
        const savedTheme = getInitialTheme();
        setCurrentTheme(savedTheme);
        setIsInitialized(true);
    }, []);

    // Update theme and persist to disk
    const setTheme = useCallback((theme: Theme) => {
        console.log(`[Theme] Changing theme to: ${theme.name}`);
        
        const success = persistTheme(theme);
        
        if (success) {
            setCurrentTheme(theme);
            console.log(`[Theme] Theme updated successfully`);
        } else {
            console.error(`[Theme] Failed to update theme`);
        }
    }, []);

    // Don't render children until theme is initialized from disk
    if (!isInitialized) {
        return null;
    }

    return (
        <ThemeContext.Provider 
            value={{ 
                currentTheme, 
                setTheme, 
                colors: currentTheme.colors,
                availableThemes: THEMES,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}