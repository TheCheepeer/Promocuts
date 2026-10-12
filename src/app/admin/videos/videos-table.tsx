"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
    PlusCircle,
    Search,
    Edit2,
    Trash2,
    Video as VideoIcon,
    ExternalLink,
    ShoppingBag,
    Eye,
    Loader2,
} from "lucide-react";
import { VideoDialog } from "./video-dialog";
import {
    toggleVideoPublishedAction,
    deleteVideoAction,
} from "./actions";
import { formatCompactNumber } from "@/lib/formatters";
import type { Video, Category, Product } from "@/types/database";

export interface VideoWithRelations extends Video {
    category?: { name: string; slug: string } | null;
    video_products?: {
        product_id: string;
        display_order: number;
        product?: Product;
    }[];
}

interface VideosTableProps {
    videos: VideoWithRelations[];
    categories: Category[];
    availableProducts: Product[];
}

const PLATFORM_CONFIG: Record<string, { label: string; badgeClass: string }> = {
    tiktok: {
        label: "TikTok",
        badgeClass: "bg-black text-white dark:bg-zinc-800",
    },
    reels: {
        label: "Reels",
        badgeClass: "bg-pink-600 text-white",
    },
    shorts: {
        label: "Shorts",
        badgeClass: "bg-red-600 text-white",
    },
};

export function VideosTable({
    videos,
    categories,
    availableProducts,
}: VideosTableProps) {
    const [search, setSearch] = useState("");
    const [platformFilter, setPlatformFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [publishedFilter, setPublishedFilter] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] =
        useState<VideoWithRelations | null>(null);

    const [isPending, startTransition] = useTransition();
    const [activeActionId, setActiveActionId] = useState<string | null>(null);

    const filteredVideos = useMemo(() => {
        const query = search.trim().toLowerCase();
        return videos.filter((vid) => {
            const matchesSearch =
                !query ||
                vid.title.toLowerCase().includes(query) ||
                vid.slug.toLowerCase().includes(query);

            const matchesPlatform =
                !platformFilter || vid.platform === platformFilter;

            const matchesCategory =
                !categoryFilter || vid.category_id === categoryFilter;

            const matchesPublished =
                publishedFilter === ""
                    ? true
                    : publishedFilter === "published"
                      ? vid.is_published
                      : !vid.is_published;

            return (
                matchesSearch &&
                matchesPlatform &&
                matchesCategory &&
                matchesPublished
            );
        });
    }, [videos, search, platformFilter, categoryFilter, publishedFilter]);

    const handleCreate = () => {
        setSelectedVideo(null);
        setDialogOpen(true);
    };

    const handleEdit = (v: VideoWithRelations) => {
        setSelectedVideo(v);
        setDialogOpen(true);
    };

    const handleTogglePublished = (id: string, current: boolean) => {
        setActiveActionId(id);
        startTransition(async () => {
            await toggleVideoPublishedAction(id, !current);
            setActiveActionId(null);
        });
    };

    const handleDelete = (id: string, title: string) => {
        if (
            window.confirm(
                `Deseja realmente excluir o corte "${title}"? Esta acao desvinculara os produtos associados.`,
            )
        ) {
            setActiveActionId(id);
            startTransition(async () => {
                await deleteVideoAction(id);
                setActiveActionId(null);
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Filtros e Botao Novo Video */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex flex-1 flex-wrap gap-2.5">
                    {/* Busca Textual */}
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por titulo ou slug..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* Filtro Plataforma */}
                    <select
                        value={platformFilter}
                        onChange={(e) => setPlatformFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                        <option value="">Todas as plataformas</option>
                        <option value="tiktok">TikTok</option>
                        <option value="reels">Instagram Reels</option>
                        <option value="shorts">YouTube Shorts</option>
                    </select>

                    {/* Filtro Categoria */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                        <option value="">Todas as categorias</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Filtro Publicacao */}
                    <select
                        value={publishedFilter}
                        onChange={(e) => setPublishedFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                        <option value="">Todos os status</option>
                        <option value="published">Apenas Publicados</option>
                        <option value="draft">Apenas Rascunhos</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                >
                    <PlusCircle className="h-4 w-4" />
                    Novo Video
                </button>
            </div>

            {/* Tabela de Videos */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                {filteredVideos.length === 0 ? (
                    <div className="p-8 text-center">
                        <VideoIcon className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Nenhum corte de video encontrado.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            {search ||
                            platformFilter ||
                            categoryFilter ||
                            publishedFilter
                                ? "Nenhum video atende aos criterios de filtragem."
                                : "Adicione seu primeiro corte colando uma URL do TikTok, Reels ou Shorts."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                                    <th className="py-3 px-4">Plataforma</th>
                                    <th className="py-3 px-4">Video</th>
                                    <th className="py-3 px-4">Categoria</th>
                                    <th className="py-3 px-4 text-center">
                                        Status
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                        Views
                                    </th>
                                    <th className="py-3 px-4">Produtos</th>
                                    <th className="py-3 px-4 text-right">
                                        Acoes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {filteredVideos.map((vid) => {
                                    const plat = PLATFORM_CONFIG[
                                        vid.platform
                                    ] || {
                                        label: vid.platform,
                                        badgeClass: "bg-zinc-700 text-white",
                                    };

                                    const isRowLoading =
                                        isPending && activeActionId === vid.id;

                                    const productCount =
                                        vid.video_products?.length || 0;

                                    return (
                                        <tr
                                            key={vid.id}
                                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${plat.badgeClass}`}
                                                >
                                                    {plat.label}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {vid.thumbnail_url && (
                                                        <div className="h-10 w-8 shrink-0 rounded border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={
                                                                    vid.thumbnail_url
                                                                }
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-xs">
                                                        <p
                                                            className="font-medium text-zinc-900 dark:text-zinc-100 truncate"
                                                            title={vid.title}
                                                        >
                                                            {vid.title}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                                                            /v/{vid.slug}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                {vid.category?.name ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                        {vid.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 text-[11px]">
                                                        Geral
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleTogglePublished(
                                                            vid.id,
                                                            vid.is_published,
                                                        )
                                                    }
                                                    disabled={isRowLoading}
                                                    title={
                                                        vid.is_published
                                                            ? "Mover para rascunho"
                                                            : "Publicar video"
                                                    }
                                                    aria-label={
                                                        vid.is_published
                                                            ? "Mover para rascunho"
                                                            : "Publicar video"
                                                    }
                                                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
                                                        vid.is_published
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 hover:bg-emerald-100"
                                                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 hover:bg-zinc-200"
                                                    }`}
                                                >
                                                    {vid.is_published
                                                        ? "Publicado"
                                                        : "Rascunho"}
                                                </button>
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                                    <Eye className="h-3 w-3" />
                                                    {formatCompactNumber(
                                                        vid.views_count,
                                                    )}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                    <ShoppingBag className="h-3 w-3" />
                                                    {productCount}{" "}
                                                    {productCount === 1
                                                        ? "item"
                                                        : "itens"}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <a
                                                        href={`/v/${vid.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        title="Ver na vitrine publica"
                                                        aria-label={`Ver video ${vid.title} na vitrine`}
                                                        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                    </a>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(vid)
                                                        }
                                                        title="Editar Video"
                                                        aria-label={`Editar video ${vid.title}`}
                                                        className="p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                vid.id,
                                                                vid.title,
                                                            )
                                                        }
                                                        disabled={isRowLoading}
                                                        title="Excluir Video"
                                                        aria-label={`Excluir video ${vid.title}`}
                                                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isRowLoading ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <VideoDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                video={selectedVideo}
                categories={categories}
                availableProducts={availableProducts}
            />
        </div>
    );
}
