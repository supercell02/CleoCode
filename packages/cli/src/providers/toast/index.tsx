import { createContext, useContext, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react'; 
import { useTerminalDimensions} from "@opentui/react";
import type { ToastOptions, ToastVariant } from './types';
import { SplitBorderChars } from "../../components/border";

import { DEFAULT_DURATION } from './types';
import { useTheme } from '../theme';

export type ToastContextValue = {
    show: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const value = useContext(ToastContext);
    if (!value) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return value;
};

type ToastProviderProps = {
    children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
    const [currentToasts, setCurrentToasts] = useState<ToastOptions|null>(null);
    const timeoutHandleRef = useRef<NodeJS.Timeout | null>(null);

    const clearCurrentTimeout = useCallback(() => {
        if (timeoutHandleRef.current) {
            clearTimeout(timeoutHandleRef.current);
            timeoutHandleRef.current = null;
        }
    }, []);

    const show = useCallback((options: ToastOptions) => {
        const duration = options.duration ?? DEFAULT_DURATION;

        clearCurrentTimeout();
        
        setCurrentToasts({
            variant: options.variant ?? 'info',
            ...options,
            duration,
        });

        timeoutHandleRef.current = setTimeout(() => {
            setCurrentToasts(null);
        }, duration).unref();

    }, [clearCurrentTimeout]);

    const value: ToastContextValue = {
        show,
    };
    return (
        <ToastContext.Provider value={value}>
            {children}
            <Toast currentToasts={currentToasts} />
        </ToastContext.Provider>
    );
};

type ToastProps = {
    currentToasts: ToastOptions | null;
};  

function Toast({ currentToasts }: ToastProps) {
    const { width } = useTerminalDimensions();
    const { colors } = useTheme();
    if (!currentToasts) {
        return null;
    }

    const variantColors: Record<ToastVariant, string> = {
        success: colors.success, 
        error: colors.error,  
        info: colors.info,    
    };

    const borderColor =  currentToasts.variant 
    ? variantColors[currentToasts.variant] 
    : variantColors.info;

    return (
        <box
            position="absolute"
            justifyContent="center"
            alignItems="flex-start"
            top = {2}
            right = {2}
            width={Math.max(1, Math.min(60, width - 6))}
            paddingLeft={2}
            paddingRight={2}
            paddingTop={1}
            paddingBottom={1}
            backgroundColor={colors.surface}
            borderColor={borderColor}
            border={["left","right"]}
            customBorderChars={SplitBorderChars}

        >
            <box 
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="100%"
            height="100%"
            gap={1}
            >
                <text fg="#E1E1E1" wrapMode = "word" width="100%">
                    {currentToasts.message}
                </text>
            </box>
        </box>
    )
};