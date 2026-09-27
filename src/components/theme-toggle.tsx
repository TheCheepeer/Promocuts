"use client";

import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme();

    const options: { label: string; value: Theme; icon: React.ReactNode }[] = [
        {
            label: "Modo Claro",
            value: "light",
            icon: <Sun className="w-4 h-4" />,
        },
        {
            label: "Modo Escuro",
            value: "dark",
            icon: <Moon className="w-4 h-4" />,
        },
        {
            label: "Sistema",
            value: "system",
            icon: <Monitor className="w-4 h-4" />,
        },
    ];

    return (
        <div
            role="group"
            aria-label="Alternar tema"
            className={cn(
                "inline-flex items-center rounded-lg p-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
                className,
            )}
        >
            {options.map((option) => {
                const isActive = theme === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        aria-label={option.label}
                        aria-pressed={isActive}
                        className={cn(
                            "flex items-center justify-center p-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                            isActive
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                        )}
                    >
                        {option.icon}
                    </button>
                );
            })}
        </div>
    );
}
