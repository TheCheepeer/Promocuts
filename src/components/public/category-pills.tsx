import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { DynamicCategoryIcon } from "@/components/ui/category-icon";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/database";

interface CategoryPillsProps {
    categories: Category[];
    activeSlug?: string | null;
}

export function CategoryPills({
    categories,
    activeSlug = null,
}: CategoryPillsProps) {
    const isAllActive = !activeSlug;

    return (
        <div className="w-full border-b border-zinc-200/80 bg-white/70 backdrop-blur-xs transition-colors dark:border-zinc-800/80 dark:bg-zinc-950/70">
            <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6 lg:px-8">
                <nav
                    aria-label="Filtro de categorias"
                    className="flex items-center gap-2 overflow-x-auto scroll-smooth py-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                    {/* Chip "Todos" */}
                    <Link
                        href="/"
                        className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                            isAllActive
                                ? "bg-brand-primary text-white shadow-xs"
                                : "border border-zinc-200/70 bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                        )}
                    >
                        <Sparkles
                            className={cn(
                                "h-3.5 w-3.5",
                                isAllActive
                                    ? "text-white"
                                    : "text-brand-primary",
                            )}
                            aria-hidden="true"
                        />
                        <span>Todos</span>
                    </Link>

                    {/* Chips de Categorias Dinamicas */}
                    {categories.map((category) => {
                        const isActive = activeSlug === category.slug;

                        return (
                            <Link
                                key={category.id}
                                href={`/c/${category.slug}`}
                                className={cn(
                                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-brand-primary text-white shadow-xs"
                                        : "border border-zinc-200/70 bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70 hover:text-zinc-950 dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                                )}
                            >
                                <DynamicCategoryIcon
                                    name={category.icon}
                                    className={cn(
                                        "h-3.5 w-3.5",
                                        isActive
                                            ? "text-white"
                                            : "text-zinc-500 dark:text-zinc-400",
                                    )}
                                />
                                <span>{category.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
