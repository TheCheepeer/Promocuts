import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { VideosTable, type VideoWithRelations } from "./videos-table";
import { VIDEO_PLATFORMS } from "@/lib/embeds/parser";
import { SocialIcon } from "@/components/public/social-icon";
import type { Category, Product } from "@/types/database";

export const metadata = {
    title: "Gestão de Vídeos",
};

export default async function AdminVideosPage() {
    const { adminDb } = await requireAdminAuth();

    // Consulta videos com categoria e produtos vinculados, alem das listas de apoio
    const [videosResult, categoriesResult, productsResult] = await Promise.all([
        adminDb
            .from("videos")
            .select(
                `
                *,
                category:categories(name, slug),
                video_products(
                    product_id,
                    display_order,
                    product:products(id, name, store_name, discount_price, regular_price, image_url)
                )
            `,
            )
            .order("created_at", { ascending: false }),
        adminDb
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true })
            .order("name", { ascending: true }),
        adminDb.from("products").select("*").order("name", { ascending: true }),
    ]);

    const videos = (videosResult.data || []) as unknown as VideoWithRelations[];
    const categories = (categoriesResult.data || []) as Category[];
    const availableProducts = (productsResult.data || []) as Product[];

    return (
        <div className="space-y-6">
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Gestão de Vídeos
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            Gerencie publicações de vídeo e vincule produtos recomendados aos cortes.
                        </p>
                    </div>

                    {/* Mini container elegante de plataformas suportadas */}
                    <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 shrink-0">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 pl-1 hidden lg:inline">
                            Plataformas suportadas:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {VIDEO_PLATFORMS.map((platform) => (
                                <div
                                    key={platform.id}
                                    title={platform.name}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                                >
                                    <SocialIcon
                                        platform={platform.id}
                                        className="h-3.5 w-3.5"
                                    />
                                    <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                                        {platform.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <VideosTable
                videos={videos}
                categories={categories}
                availableProducts={availableProducts}
            />
        </div>
    );
}
