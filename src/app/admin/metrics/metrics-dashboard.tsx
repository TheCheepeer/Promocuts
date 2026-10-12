"use client";

import React, { useState, useMemo } from "react";
import {
    ShoppingBag,
    Link2,
    TrendingUp,
    MousePointerClick,
    Video,
    Calendar,
    Eye,
} from "lucide-react";
import { BioLinkIcon } from "../bio-links/bio-link-icons";
import {
    type MetricPeriod,
    parseTrafficSource,
    getDateRangeBounds,
    groupDailyTimeline,
} from "@/lib/analytics";

export interface SerializedAffiliateClick {
    id: string;
    product_id: string;
    video_id: string | null;
    store_name: string | null;
    created_at: string;
    referrer: string | null;
}

export interface SerializedBioClick {
    id: string;
    bio_link_id: string;
    created_at: string;
    referrer: string | null;
}

export interface SerializedPageView {
    id: string;
    path: string;
    created_at: string;
    referrer: string | null;
}

export interface MetricProductInfo {
    id: string;
    name: string;
    store_name: string;
    image_url: string;
}

export interface MetricVideoInfo {
    id: string;
    title: string;
    platform: string;
    thumbnail_url: string | null;
}

export interface MetricBioLinkInfo {
    id: string;
    title: string;
    url: string;
    icon: string | null;
    badge_text: string | null;
    clicks_count: number;
}

interface MetricsDashboardProps {
    affiliateClicks: SerializedAffiliateClick[];
    bioClicks: SerializedBioClick[];
    pageViews?: SerializedPageView[];
    products: MetricProductInfo[];
    videos: MetricVideoInfo[];
    bioLinks: MetricBioLinkInfo[];
}

export function MetricsDashboard({
    affiliateClicks,
    bioClicks,
    pageViews = [],
    products,
    videos,
    bioLinks,
}: MetricsDashboardProps) {
    const [period, setPeriod] = useState<MetricPeriod>("7d");

    // Filtragem temporal reativa no cliente
    const filteredData = useMemo(() => {
        const { startDate } = getDateRangeBounds(period);

        const filteredAffiliate = startDate
            ? affiliateClicks.filter((c) => new Date(c.created_at) >= startDate)
            : affiliateClicks;

        const filteredBio = startDate
            ? bioClicks.filter((c) => new Date(c.created_at) >= startDate)
            : bioClicks;

        const filteredViews = startDate
            ? pageViews.filter((v) => new Date(v.created_at) >= startDate)
            : pageViews;

        return {
            affiliate: filteredAffiliate,
            bio: filteredBio,
            views: filteredViews,
        };
    }, [affiliateClicks, bioClicks, pageViews, period]);

    // KPIs calculados
    const totalAffiliateClicks = filteredData.affiliate.length;
    const totalBioClicks = filteredData.bio.length;
    const totalCombined = totalAffiliateClicks + totalBioClicks;
    const totalViews = filteredData.views.length;
    const conversionRate =
        totalViews > 0
            ? ((totalCombined / totalViews) * 100).toFixed(1)
            : "0.0";

    const daysInPeriod = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 60;
    const dailyAverage = (totalCombined / daysInPeriod).toFixed(1);

    // Linha do tempo diária para o gráfico SVG
    const timelineData = useMemo(() => {
        const days = period === "30d" ? 30 : 7;
        const affiliateDates = filteredData.affiliate.map((c) => c.created_at);
        const bioDates = filteredData.bio.map((c) => c.created_at);
        const viewDates = filteredData.views.map((v) => v.created_at);
        return groupDailyTimeline(affiliateDates, bioDates, days, viewDates);
    }, [filteredData, period]);

    // Distribuição por loja parceira
    const storeStats = useMemo(() => {
        const map = new Map<string, number>();
        for (const click of filteredData.affiliate) {
            const store = click.store_name || "Loja Geral";
            map.set(store, (map.get(store) || 0) + 1);
        }

        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        return sorted.map(([name, count]) => ({
            name,
            count,
            percentage: totalAffiliateClicks > 0 ? (count / totalAffiliateClicks) * 100 : 0,
        }));
    }, [filteredData.affiliate, totalAffiliateClicks]);

    // Origens de tráfego (Referrers)
    const trafficSources = useMemo(() => {
        const map = new Map<string, { label: string; count: number; brandColor: string }>();

        const allClicks = [
            ...filteredData.affiliate.map((c) => c.referrer),
            ...filteredData.bio.map((c) => c.referrer),
        ];

        for (const ref of allClicks) {
            const parsed = parseTrafficSource(ref);
            const current = map.get(parsed.id);
            if (current) {
                current.count += 1;
            } else {
                map.set(parsed.id, {
                    label: parsed.label,
                    count: 1,
                    brandColor: parsed.brandColor,
                });
            }
        }

        const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count);
        return sorted.map((s) => ({
            ...s,
            percentage: totalCombined > 0 ? (s.count / totalCombined) * 100 : 0,
        }));
    }, [filteredData, totalCombined]);

    // Ranking de produtos
    const productsRanking = useMemo(() => {
        const countMap = new Map<string, number>();
        for (const click of filteredData.affiliate) {
            countMap.set(click.product_id, (countMap.get(click.product_id) || 0) + 1);
        }

        const productLookup = new Map(products.map((p) => [p.id, p]));
        return Array.from(countMap.entries())
            .map(([id, count]) => {
                const prod = productLookup.get(id);
                return {
                    id,
                    name: prod?.name || "Produto Indisponível",
                    store: prod?.store_name || "Loja Parceira",
                    imageUrl: prod?.image_url,
                    count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredData.affiliate, products]);

    // Ranking de cortes de vídeo
    const videosRanking = useMemo(() => {
        const countMap = new Map<string, number>();
        for (const click of filteredData.affiliate) {
            if (click.video_id) {
                countMap.set(click.video_id, (countMap.get(click.video_id) || 0) + 1);
            }
        }

        const videoLookup = new Map(videos.map((v) => [v.id, v]));
        return Array.from(countMap.entries())
            .map(([id, count]) => {
                const vid = videoLookup.get(id);
                return {
                    id,
                    title: vid?.title || "Corte Indisponível",
                    platform: vid?.platform || "video",
                    thumbnail: vid?.thumbnail_url,
                    count,
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [filteredData.affiliate, videos]);

    // Ranking de bio links
    const bioLinksRanking = useMemo(() => {
        const countMap = new Map<string, number>();
        for (const click of filteredData.bio) {
            countMap.set(click.bio_link_id, (countMap.get(click.bio_link_id) || 0) + 1);
        }

        const linkLookup = new Map(bioLinks.map((l) => [l.id, l]));
        return Array.from(countMap.entries())
            .map(([id, count]) => {
                const item = linkLookup.get(id);
                return {
                    id,
                    title: item?.title || "Link Desconhecido",
                    url: item?.url || "",
                    icon: item?.icon,
                    badge: item?.badge_text,
                    count,
                };
            })
            .sort((a, b) => b.count - a.count);
    }, [filteredData.bio, bioLinks]);

    // Ranking de páginas mais acessadas da vitrine pública
    const pagesRanking = useMemo(() => {
        const map = new Map<string, number>();
        for (const view of filteredData.views) {
            map.set(view.path, (map.get(view.path) || 0) + 1);
        }

        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        return sorted
            .map(([path, count]) => ({
                path: path === "/" ? "Vitrine Principal (/)" : path,
                count,
                percentage: totalViews > 0 ? (count / totalViews) * 100 : 0,
            }))
            .slice(0, 5);
    }, [filteredData.views, totalViews]);

    // Helpers para desenho do gráfico SVG com escala no eixo Y
    const maxVal = Math.max(
        ...timelineData.map((d) => d.totalClicks),
        5, // escala mínima de 5 para não achatar
    );

    const svgWidth = 600;
    const svgHeight = 175;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 22;
    const paddingBottom = 26;
    const innerW = svgWidth - paddingLeft - paddingRight;
    const innerH = svgHeight - paddingTop - paddingBottom;

    const points = timelineData.map((d, index) => {
        const x =
            paddingLeft +
            (timelineData.length > 1
                ? (index / (timelineData.length - 1)) * innerW
                : innerW / 2);
        const yAffiliate = paddingTop + innerH - (d.affiliateClicks / maxVal) * innerH;
        const yBio = paddingTop + innerH - (d.bioLinkClicks / maxVal) * innerH;
        const yTotal = paddingTop + innerH - (d.totalClicks / maxVal) * innerH;
        return { x, yAffiliate, yBio, yTotal, ...d };
    });

    const affiliateLinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yAffiliate}`).join(" ");
    const bioLinePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.yBio}`).join(" ");

    return (
        <div className="space-y-6">
            {/* Barra de Filtro de Período */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <Calendar className="h-4 w-4" />
                    <span>Intervalo de Análise:</span>
                </div>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    {(
                        [
                            { id: "today", label: "Hoje" },
                            { id: "7d", label: "Últimos 7 dias" },
                            { id: "30d", label: "Últimos 30 dias" },
                            { id: "all", label: "Período Completo" },
                        ] as const
                    ).map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setPeriod(btn.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                period === btn.id
                                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100"
                                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cartões de Indicadores-Chave (KPIs) Enriquecidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Visitas da Vitrine
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                            <Eye className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {totalViews.toLocaleString("pt-BR")}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Acessos públicos
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Produtos Afiliados
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                            <ShoppingBag className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {totalAffiliateClicks.toLocaleString("pt-BR")}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Cliques em ofertas
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Bio Links e Lives
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                            <Link2 className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {totalBioClicks.toLocaleString("pt-BR")}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Canais e comunidades
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Total de Conversões
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            <MousePointerClick className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {totalCombined.toLocaleString("pt-BR")}
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {dailyAverage} cliques/dia de média
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Taxa de Conversão
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                            <TrendingUp className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {conversionRate}%
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        Cliques sobre visitas
                    </p>
                </div>
            </div>

            {/* Gráfico 1: Evolução Temporal de Cliques (SVG Puro com Escala no Eixo Y) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Evolução Temporal de Cliques
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Volume diário de cliques em produtos afiliados e bio links.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Produtos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                            <span className="text-zinc-600 dark:text-zinc-400 font-medium">Bio Links</span>
                        </div>
                    </div>
                </div>

                {/* Área Vetorial do Gráfico */}
                <div className="mt-4 w-full overflow-x-auto">
                    <svg
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        className="w-full h-48 min-w-[500px]"
                        preserveAspectRatio="none"
                    >
                        {/* Indicador de Unidade no Topo do Eixo Y */}
                        <text
                            x={paddingLeft - 8}
                            y={paddingTop - 7}
                            textAnchor="end"
                            className="text-[9px] font-semibold uppercase tracking-wider fill-zinc-400 dark:fill-zinc-500 select-none"
                        >
                            Cliques
                        </text>

                        {/* Linha Vertical Guia do Eixo Y */}
                        <line
                            x1={paddingLeft}
                            y1={paddingTop}
                            x2={paddingLeft}
                            y2={paddingTop + innerH}
                            stroke="currentColor"
                            className="text-zinc-200 dark:text-zinc-800"
                            strokeWidth="1"
                        />

                        {/* Linhas de Grade Horizontais e Rótulos do Eixo Y */}
                        {[0, 0.5, 1].map((ratio) => {
                            const y = paddingTop + ratio * innerH;
                            const val = Math.round(maxVal * (1 - ratio));
                            return (
                                <g key={ratio}>
                                    <text
                                        x={paddingLeft - 8}
                                        y={y + 3.5}
                                        textAnchor="end"
                                        className="text-[10px] fill-zinc-400 dark:fill-zinc-500 font-mono font-medium select-none"
                                    >
                                        {val}
                                    </text>
                                    <line
                                        x1={paddingLeft}
                                        y1={y}
                                        x2={svgWidth - paddingRight}
                                        y2={y}
                                        stroke="currentColor"
                                        className="text-zinc-100 dark:text-zinc-800"
                                        strokeDasharray="4 4"
                                        strokeWidth="1"
                                    />
                                </g>
                            );
                        })}

                        {/* Linha de Produtos */}
                        {points.length > 1 && (
                            <path
                                d={affiliateLinePath}
                                fill="none"
                                stroke="#10B981"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Linha de Bio Links */}
                        {points.length > 1 && (
                            <path
                                d={bioLinePath}
                                fill="none"
                                stroke="#6366F1"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Pontos Interativos com Tooltip Nativo SVG */}
                        {points.map((p, idx) => (
                            <g key={idx}>
                                <title>{`${p.label}: ${p.totalClicks} cliques (${p.affiliateClicks} em produtos, ${p.bioLinkClicks} em bio links)`}</title>
                                {p.affiliateClicks > 0 && (
                                    <circle
                                        cx={p.x}
                                        cy={p.yAffiliate}
                                        r="3.5"
                                        fill="#10B981"
                                        className="transition-transform hover:scale-150"
                                    />
                                )}
                                {p.bioLinkClicks > 0 && (
                                    <circle
                                        cx={p.x}
                                        cy={p.yBio}
                                        r="3.5"
                                        fill="#6366F1"
                                        className="transition-transform hover:scale-150"
                                    />
                                )}
                                <text
                                    x={p.x}
                                    y={svgHeight - 6}
                                    textAnchor="middle"
                                    className="text-[10px] fill-zinc-400 font-sans select-none"
                                >
                                    {p.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>

            {/* Linha com Páginas Mais Acessadas, Lojas e Origens de Tráfego */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking de Páginas Mais Acessadas */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <div>
                            <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Páginas Mais Acessadas
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                Rotas mais visualizadas da vitrine pública.
                            </p>
                        </div>
                        <Eye className="h-4 w-4 text-zinc-400 shrink-0" />
                    </div>

                    <div className="mt-4 space-y-3">
                        {pagesRanking.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhuma visita registrada no período selecionado.
                            </p>
                        ) : (
                            pagesRanking.map((page) => (
                                <div key={page.path} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">
                                            {page.path}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 font-mono shrink-0">
                                            {page.count} ({page.percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                            style={{ width: `${Math.max(page.percentage, 2)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Distribuição por Loja Parceira */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Cliques por Loja Parceira
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Proporção de conversão por plataforma de e-commerce.
                    </p>

                    <div className="mt-4 space-y-3">
                        {storeStats.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhum clique registrado no período selecionado.
                            </p>
                        ) : (
                            storeStats.map((store) => (
                                <div key={store.name} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                            {store.name}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                                            {store.count} ({store.percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${Math.max(store.percentage, 2)}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Origem do Tráfego (Referrers) */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Origem do Tráfego (Redes Sociais)
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Canais de onde os visitantes acessaram a sua vitrine.
                    </p>

                    <div className="mt-4 space-y-3">
                        {trafficSources.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhum tráfego registrado no período selecionado.
                            </p>
                        ) : (
                            trafficSources.map((source) => (
                                <div key={source.label} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="h-2.5 w-2.5 rounded-full"
                                                style={{ backgroundColor: source.brandColor }}
                                            />
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {source.label}
                                            </span>
                                        </div>
                                        <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                                            {source.count} ({source.percentage.toFixed(0)}%)
                                        </span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                backgroundColor: source.brandColor,
                                                width: `${Math.max(source.percentage, 2)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Linha com Rankings: Cortes, Produtos e Bio Links */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ranking de Cortes */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Cortes Mais Clicados
                        </h3>
                        <Video className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {videosRanking.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhum clique em cortes no período.
                            </p>
                        ) : (
                            videosRanking.map((video, idx) => (
                                <div key={video.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                            {idx + 1}
                                        </span>
                                        <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                            {video.title}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {video.count} cliques
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ranking de Produtos */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Produtos Populares
                        </h3>
                        <ShoppingBag className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {productsRanking.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhum clique em produtos no período.
                            </p>
                        ) : (
                            productsRanking.map((prod, idx) => (
                                <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                            {idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                {prod.name}
                                            </span>
                                            <span className="block text-[10px] text-zinc-400">
                                                {prod.store}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        {prod.count} cliques
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Ranking de Bio Links */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Engajamento por Bio Link
                        </h3>
                        <Link2 className="h-4 w-4 text-zinc-400" />
                    </div>

                    <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
                        {bioLinksRanking.length === 0 ? (
                            <p className="py-6 text-center text-xs text-zinc-400">
                                Nenhum clique em bio links no período.
                            </p>
                        ) : (
                            bioLinksRanking.map((link, idx) => (
                                <div key={link.id} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[11px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                            {idx + 1}
                                        </span>
                                        <div className="flex items-center gap-2 min-w-0">
                                            <BioLinkIcon name={link.icon} className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                                            <span className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                                {link.title}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {link.count} cliques
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
