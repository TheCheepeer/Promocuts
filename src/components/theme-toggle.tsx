"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { resolvedTheme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === "dark" : false;

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            className={cn(
                "relative inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer active:scale-95 shadow-sm",
                className,
            )}
        >
            {mounted ? (
                isDark ? (
                    <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200" />
                ) : (
                    <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-200" />
                )
            ) : (
                <span className="w-4 h-4 block" />
            )}
            <span className="sr-only">Alternar tema</span>
        </button>
    );
}
