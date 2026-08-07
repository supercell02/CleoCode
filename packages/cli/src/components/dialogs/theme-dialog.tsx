import { useCallback, useEffect, useRef, useState } from "react";
import { useDialog } from "../../providers/dialog";
import { useTheme } from "../../providers/theme";
import { DialogSearchList } from "../../providers/dialog/dialog-search-list";
import { THEMES } from "../../providers/theme/theme";
import type { Theme } from "../../providers/theme/theme";

export const ThemeDialogContent = () => {
    const dialog = useDialog();
    const { setTheme, currentTheme } = useTheme();
    const originalThemeRef = useRef(currentTheme);
    const [previewTheme, setPreviewTheme] = useState(currentTheme);
    const confirmedRef = useRef(false);

    // Store original theme when dialog opens
    useEffect(() => {
        originalThemeRef.current = currentTheme;
        confirmedRef.current = false;
    }, [currentTheme]);

    // Cleanup: restore original theme if dialog closes without confirmation
    useEffect(() => {
        return () => {
            if (!confirmedRef.current && originalThemeRef.current) {
                setTheme(originalThemeRef.current);
            }
        };
    }, [setTheme]);

    const handleSelect = useCallback(
        (theme: Theme) => {
            confirmedRef.current = true;
            setTheme(theme);
            dialog.close();
        },
        [setTheme, dialog]
    );

    const handleHighlight = useCallback(
        (theme: Theme) => {
            setPreviewTheme(theme);
            setTheme(theme);
        },
        [setTheme]
    );

    return (
        <DialogSearchList
            items={THEMES}
            onSelect={handleSelect}
            onHighlight={handleHighlight}
            filterFn={(t, query) =>
                t.name.toLowerCase().includes(query.toLowerCase())
            }
            renderItem={(theme, isSelected) => (
                <text selectable={false} fg={isSelected ? "black" : "white"}>
                    {theme.name === originalThemeRef.current.name
                        ? "\u0020\u2022\u0020"
                        : "\u0020\u0020\u0020"}
                    {theme.name}
                </text>
            )}
            getKey={(t) => t.name}
            placeholder="Search themes"
            emptyText="No themes found"
        />
    );
};