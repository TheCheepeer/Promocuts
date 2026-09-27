"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "promocuts-theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined") {
        return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
    const [mounted, setMounted] = useState(false);

    const applyTheme = useCallback((targetTheme: Theme) => {
        if (typeof window === "undefined") {
            return;
        }

        const root = document.documentElement;
        const isDark =
            targetTheme === "dark" ||
            (targetTheme === "system" && getSystemTheme() === "dark");

        const effective: ResolvedTheme = isDark ? "dark" : "light";
        setResolvedTheme(effective);

        if (isDark) {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
        } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
        }
    }, []);

    const setTheme = useCallback(
        (newTheme: Theme) => {
            setThemeState(newTheme);
            try {
                localStorage.setItem(STORAGE_KEY, newTheme);
            } catch {
                // Ignora erros caso o localStorage esteja desabilitado
            }
            applyTheme(newTheme);
        },
        [applyTheme],
    );

    useEffect(() => {
        let savedTheme: Theme = "system";
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            if (
                stored === "light" ||
                stored === "dark" ||
                stored === "system"
            ) {
                savedTheme = stored;
            }
        } catch {
            savedTheme = "system";
        }

        setThemeState(savedTheme);
        applyTheme(savedTheme);
        setMounted(true);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleSystemChange = () => {
            const currentStored =
                (localStorage.getItem(STORAGE_KEY) as Theme) || "system";
            if (currentStored === "system") {
                applyTheme("system");
            }
        };

        mediaQuery.addEventListener("change", handleSystemChange);
        return () => {
            mediaQuery.removeEventListener("change", handleSystemChange);
        };
    }, [applyTheme]);

    return (
        <ThemeContext.Provider
            value={{
                theme: mounted ? theme : "system",
                resolvedTheme: mounted ? resolvedTheme : "light",
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error(
            "useTheme deve ser utilizado dentro de um ThemeProvider",
        );
    }
    return context;
}
