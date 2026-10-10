import React from "react";

export default function AdminLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Cabecalho Skeleton */}
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800 space-y-2">
                <div className="h-8 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-4 w-96 max-w-full rounded bg-zinc-100 dark:bg-zinc-900" />
            </div>

            {/* Barra de Acoes / Busca Skeleton */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="h-10 w-full sm:w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-32 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Tabela Skeleton */}
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-4">
                <div className="h-10 w-full rounded bg-zinc-100 dark:bg-zinc-800/60" />
                <div className="h-14 w-full rounded bg-zinc-50 dark:bg-zinc-800/40" />
                <div className="h-14 w-full rounded bg-zinc-50 dark:bg-zinc-800/40" />
                <div className="h-14 w-full rounded bg-zinc-50 dark:bg-zinc-800/40" />
                <div className="h-14 w-full rounded bg-zinc-50 dark:bg-zinc-800/40" />
            </div>
        </div>
    );
}
