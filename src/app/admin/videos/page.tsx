import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { VideosTable, type VideoWithRelations } from "./videos-table";
import type { Category, Product } from "@/types/database";

export const metadata = {
    title: "Cortes de Video",
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
            .order("order_weight", { ascending: false })
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
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Curadoria de Videos
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Adicione cortes do TikTok, Reels e YouTube Shorts por
                    colagem de URL e vincule produtos recomendados.
                </p>
            </div>

            <VideosTable
                videos={videos}
                categories={categories}
                availableProducts={availableProducts}
            />
        </div>
    );
}
