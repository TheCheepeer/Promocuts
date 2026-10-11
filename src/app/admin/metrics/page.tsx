import React from "react";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import {
    MetricsDashboard,
    type SerializedAffiliateClick,
    type SerializedBioClick,
    type MetricProductInfo,
    type MetricVideoInfo,
    type MetricBioLinkInfo,
} from "./metrics-dashboard";

export const metadata = {
    title: "Métricas e Conversão",
};

export default async function AdminMetricsPage() {
    const { adminDb } = await requireAdminAuth();

    // Consultas agregadas e dados relacionais em paralelo
    const [
        affiliateClicksResult,
        bioClicksResult,
        productsResult,
        videosResult,
        bioLinksResult,
    ] = await Promise.all([
        adminDb
            .from("affiliate_clicks")
            .select("id, product_id, video_id, store_name, created_at, referrer")
            .order("created_at", { ascending: false })
            .limit(1000),
        adminDb
            .from("bio_link_clicks")
            .select("id, bio_link_id, created_at, referrer")
            .order("created_at", { ascending: false })
            .limit(1000),
        adminDb
            .from("products")
            .select("id, name, store_name, image_url"),
        adminDb
            .from("videos")
            .select("id, title, platform, thumbnail_url"),
        adminDb
            .from("bio_links")
            .select("id, title, url, icon, badge_text, clicks_count"),
    ]);

    const affiliateClicks = (affiliateClicksResult.data as SerializedAffiliateClick[]) || [];
    const bioClicks = (bioClicksResult.data as SerializedBioClick[]) || [];
    const products = (productsResult.data as MetricProductInfo[]) || [];
    const videos = (videosResult.data as MetricVideoInfo[]) || [];
    const bioLinks = (bioLinksResult.data as MetricBioLinkInfo[]) || [];

    return (
        <div className="space-y-6">
            {/* Cabeçalho da Página */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Métricas e Conversão
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Acompanhe o desempenho de cliques em produtos afiliados, canais de streamers, redes sociais e origens de tráfego.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/bio-links"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                        Gerenciar Bio Links
                    </Link>
                </div>
            </div>

            {/* Dashboard Visual Interativo */}
            <MetricsDashboard
                affiliateClicks={affiliateClicks}
                bioClicks={bioClicks}
                products={products}
                videos={videos}
                bioLinks={bioLinks}
            />
        </div>
    );
}
