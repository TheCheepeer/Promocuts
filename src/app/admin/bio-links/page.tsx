import React from "react";
import Link from "next/link";
import {
    Link2,
    MousePointerClick,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    ExternalLink,
} from "lucide-react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { getSiteSettings } from "@/lib/settings";
import { BioLinksTabs } from "./bio-links-tabs";
import type { BioLink } from "@/types/database";

export const metadata = {
    title: "Bio Links e Comunidades",
};

export default async function AdminBioLinksPage() {
    const { adminDb } = await requireAdminAuth();
    const settings = await getSiteSettings();

    const { data: linksData } = await adminDb
        .from("bio_links")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

    const links = (linksData as BioLink[]) || [];

    const totalLinks = links.length;
    const activeLinks = links.filter((l) => l.is_active).length;
    const highlightedLinks = links.filter((l) => l.is_highlighted && l.is_active).length;
    const totalClicks = links.reduce((acc, l) => acc + (l.clicks_count || 0), 0);

    const stats = [
        {
            title: "Total de Links",
            value: totalLinks,
            subtitle: "Canais e páginas cadastradas",
            icon: Link2,
        },
        {
            title: "Links Ativos",
            value: activeLinks,
            subtitle: "Visíveis aos visitantes",
            icon: CheckCircle2,
        },
        {
            title: "Destaques Pulsantes",
            value: highlightedLinks,
            subtitle: "Lives ou avisos urgentes",
            icon: Sparkles,
        },
        {
            title: "Cliques Acumulados",
            value: totalClicks,
            subtitle: "Interações em bio links",
            icon: MousePointerClick,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Bio Links e Comunidades
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Gerencie canais de transmissão, comunidades, redes e formas de apoio para exibição na página de links.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/links"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver Página Pública
                    </Link>
                    <Link
                        href="/admin/metrics"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        Ver Métricas
                    </Link>
                </div>
            </div>

            {/* Cartões Estatísticos de Resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                                    {stat.title}
                                </span>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                            </div>
                            <div className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                                {stat.value.toLocaleString("pt-BR")}
                            </div>
                            <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                                {stat.subtitle}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Abas: Links & Comunidades e Personalização & Design */}
            <BioLinksTabs links={links} settings={settings} />
        </div>
    );
}
