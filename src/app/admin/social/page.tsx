import React from "react";
import Link from "next/link";
import {
    Share2,
    Store,
    Smartphone,
    ExternalLink,
    CheckCircle2,
} from "lucide-react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { SocialLinksManager } from "./social-links-manager";
import type { BrandSocialLink } from "@/types/database";

export const metadata = {
    title: "Redes Sociais da Marca",
};

export default async function AdminSocialPage() {
    const { adminDb } = await requireAdminAuth();

    const { data: socialLinksData } = await adminDb
        .from("brand_social_links")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

    const links = (socialLinksData as BrandSocialLink[]) || [];

    const totalLinks = links.length;
    const activeStorefront = links.filter((l) => l.is_active && l.show_in_storefront).length;
    const activeBio = links.filter((l) => l.is_active && l.show_in_bio).length;

    const stats = [
        {
            title: "Total de Canais",
            value: totalLinks,
            subtitle: "Redes cadastradas",
            icon: Share2,
        },
        {
            title: "Na Vitrine",
            value: activeStorefront,
            subtitle: "Cabeçalho da loja",
            icon: Store,
        },
        {
            title: "No Bio Links",
            value: activeBio,
            subtitle: "Abaixo da foto de perfil",
            icon: Smartphone,
        },
        {
            title: "Canais Ativos",
            value: links.filter((l) => l.is_active).length,
            subtitle: "Publicados agora",
            icon: CheckCircle2,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Redes Sociais da Marca
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Gerencie a presença oficial da marca e defina com liberdade onde cada ícone deve aparecer (Vitrine de Cortes ou Página de Bio Links).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver Vitrine
                    </Link>
                    <Link
                        href="/links"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver Bio Links
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
                            className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-4 shadow-xs space-y-1"
                        >
                            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                                <span className="text-xs font-medium">{stat.title}</span>
                                <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-2xl font-black text-zinc-950 dark:text-zinc-50">
                                {stat.value}
                            </div>
                            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                                {stat.subtitle}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gerenciador Principal */}
            <SocialLinksManager initialLinks={links} />
        </div>
    );
}
