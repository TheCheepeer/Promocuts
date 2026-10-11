"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Video,
    ShoppingBag,
    FolderTree,
    Palette,
    ExternalLink,
    LogOut,
    Menu,
    X,
    Shield,
    BarChart3,
    Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "./actions";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
}

const navItems: NavItem[] = [
    {
        label: "Visão Geral",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
    },
    {
        label: "Métricas",
        href: "/admin/metrics",
        icon: BarChart3,
    },
    {
        label: "Bio Links",
        href: "/admin/bio-links",
        icon: Link2,
    },
    {
        label: "Vídeos",
        href: "/admin/videos",
        icon: Video,
    },
    {
        label: "Produtos",
        href: "/admin/products",
        icon: ShoppingBag,
    },
    {
        label: "Categorias",
        href: "/admin/categories",
        icon: FolderTree,
    },
    {
        label: "Configurações",
        href: "/admin/settings",
        icon: Palette,
    },
];

interface AdminNavProps {
    userEmail: string;
}

export function AdminNav({ userEmail }: AdminNavProps) {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isLinkActive = (item: NavItem) => {
        if (item.exact) {
            return pathname === item.href;
        }
        return pathname.startsWith(item.href);
    };

    return (
        <>
            {/* Cabecalho Mobile */}
            <header className="md:hidden sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        <Shield className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                        PromoCuts Admin
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                        {mobileOpen ? (
                            <X className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <Menu className="h-5 w-5" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </header>

            {/* Gaveta de Navegacao Mobile */}
            {mobileOpen && (
                <div className="fixed inset-0 z-30 md:hidden bg-zinc-950/60 backdrop-blur-xs">
                    <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-white p-5 shadow-xl dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                        <Shield
                                            className="h-4 w-4"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        PromoCuts
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMobileOpen(false)}
                                    aria-label="Fechar menu"
                                    className="p-1 rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    const active = isLinkActive(item);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                                active
                                                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                                                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                                            )}
                                        >
                                            <Icon className="h-4 w-4 shrink-0" />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                    Conectado como
                                </p>
                                <p className="text-xs font-mono font-medium truncate text-zinc-700 dark:text-zinc-300">
                                    {userEmail}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Link
                                    href="/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Ver vitrine publica
                                </Link>

                                <form action={logoutAction}>
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 text-xs font-medium transition-colors"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Encerrar sessao
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra Lateral Fixa para Desktop */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 z-30">
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-5 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                            <Shield className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                            <span className="block text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                                PromoCuts
                            </span>
                            <span className="block text-xs font-medium text-zinc-400 dark:text-zinc-500">
                                Painel Administrativo
                            </span>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-5">
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const active = isLinkActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                        active
                                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium shadow-xs"
                                            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800">
                            <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-medium">
                                Administrador
                            </p>
                            <p
                                className="text-xs font-mono font-medium truncate text-zinc-700 dark:text-zinc-300 mt-0.5"
                                title={userEmail}
                            >
                                {userEmail}
                            </p>
                        </div>

                        <Link
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <span>Ver vitrine publica</span>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                        </Link>

                        <form action={logoutAction}>
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 text-xs font-medium transition-colors cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Encerrar sessao
                            </button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
