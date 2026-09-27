import React from "react";
import Link from "next/link";
import {
    Video,
    ShoppingBag,
    FolderTree,
    MousePointerClick,
    PlusCircle,
    ArrowUpRight,
    Sparkles,
    Eye,
} from "lucide-react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { formatCompactNumber } from "@/lib/formatters";

export const metadata = {
    title: "Visao Geral",
};

export default async function AdminDashboardPage() {
    const { adminDb } = await requireAdminAuth();

    // Consulta em paralelo das metricas principais
    const [
        videosResult,
        productsResult,
        categoriesResult,
        clicksResult,
        recentVideosResult,
    ] = await Promise.all([
        adminDb.from("videos").select("id, is_published", { count: "exact" }),
        adminDb.from("products").select("id", { count: "exact", head: true }),
        adminDb.from("categories").select("id", { count: "exact", head: true }),
        adminDb
            .from("affiliate_clicks")
            .select("id", { count: "exact", head: true }),
        adminDb
            .from("videos")
            .select(
                "id, title, platform, views_count, is_published, is_featured, created_at, thumbnail_url",
            )
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    const totalVideos = videosResult.count || 0;
    const publishedVideos =
        videosResult.data?.filter((v) => v.is_published).length || 0;
    const draftVideos = totalVideos - publishedVideos;
    const totalProducts = productsResult.count || 0;
    const totalCategories = categoriesResult.count || 0;
    const totalClicks = clicksResult.count || 0;
    const recentVideos = recentVideosResult.data || [];

    const stats = [
        {
            title: "Cortes de Video",
            value: totalVideos,
            subtitle: `${publishedVideos} publicados, ${draftVideos} rascunhos`,
            icon: Video,
            href: "/admin/videos",
        },
        {
            title: "Produtos Recomendados",
            value: totalProducts,
            subtitle: "Itens com links afiliados",
            icon: ShoppingBag,
            href: "/admin/products",
        },
        {
            title: "Categorias Tematicas",
            value: totalCategories,
            subtitle: "Filtros da vitrine",
            icon: FolderTree,
            href: "/admin/categories",
        },
        {
            title: "Cliques de Afiliados",
            value: totalClicks,
            subtitle: "Total de cliques registrados",
            icon: MousePointerClick,
            href: "/admin/products",
        },
    ];

    const platformLabels: Record<string, { name: string; color: string }> = {
        tiktok: {
            name: "TikTok",
            color: "bg-black text-white dark:bg-zinc-800",
        },
        reels: { name: "Instagram", color: "bg-pink-600 text-white" },
        shorts: { name: "Shorts", color: "bg-red-600 text-white" },
    };

    return (
        <div className="space-y-8">
            {/* Cabecalho da Pagina */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Visao Geral
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Metricas principais e controle centralizado do catalogo
                        da vitrine.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/videos"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Cadastrar Video
                    </Link>
                </div>
            </div>

            {/* Grade de Metricas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Link
                            key={stat.title}
                            href={stat.href}
                            className="group block rounded-xl border border-zinc-200 bg-white p-5 shadow-xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    {stat.title}
                                </span>
                                <div className="p-2 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                                    <Icon className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <span className="text-3xl font-bold font-mono tracking-tight text-zinc-900 dark:text-zinc-50">
                                    {formatCompactNumber(stat.value)}
                                </span>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                    {stat.subtitle}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Acoes Rapidas */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Acoes Rapidas
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Atalhos diretos para gerenciar os modulos da plataforma.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <Link
                        href="/admin/videos"
                        className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                                <Video className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                Gerenciar Videos
                            </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>

                    <Link
                        href="/admin/products"
                        className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                <ShoppingBag className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                Catalogo de Produtos
                            </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>

                    <Link
                        href="/admin/categories"
                        className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                                <FolderTree className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                Categorias Tematicas
                            </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>

                    <Link
                        href="/admin/settings"
                        className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                                <Sparkles className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                                Identidade e Cores
                            </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                </div>
            </div>

            {/* Ultimos Videos Adicionados */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Ultimos Videos Cadastrados
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Cortes mais recentes incluidos no catalogo da
                            vitrine.
                        </p>
                    </div>

                    <Link
                        href="/admin/videos"
                        className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                        Ver todos
                    </Link>
                </div>

                {recentVideos.length === 0 ? (
                    <div className="p-8 text-center">
                        <Video className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Nenhum corte de video cadastrado ate o momento.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            Adicione o primeiro video colando uma URL do TikTok,
                            Reels ou Shorts.
                        </p>
                        <Link
                            href="/admin/videos"
                            className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Cadastrar Primeiro Video
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentVideos.map((video) => {
                            const platformInfo = platformLabels[
                                video.platform
                            ] || {
                                name: video.platform,
                                color: "bg-zinc-700 text-white",
                            };

                            return (
                                <div
                                    key={video.id}
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${platformInfo.color}`}
                                        >
                                            {platformInfo.name}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                {video.title}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="h-3 w-3" />
                                                    {formatCompactNumber(
                                                        video.views_count,
                                                    )}{" "}
                                                    views
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {new Date(
                                                        video.created_at,
                                                    ).toLocaleDateString(
                                                        "pt-BR",
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {video.is_featured && (
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900">
                                                Destaque
                                            </span>
                                        )}
                                        <span
                                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                                video.is_published
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                                    : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                            }`}
                                        >
                                            {video.is_published
                                                ? "Publicado"
                                                : "Rascunho"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
