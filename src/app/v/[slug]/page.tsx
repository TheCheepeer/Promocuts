import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public/header";
import { VideoPlayer } from "@/components/public/video-player";
import { ProductCard } from "@/components/public/product-card";
import type { Product } from "@/types/database";
import type { VideoWithRelations } from "@/components/public/feed-mobile";

interface VideoPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: VideoPageProps): Promise<Metadata> {
    const { slug } = await params;
    const settings = await getSiteSettings();
    const supabase = await createClient();

    const { data: rawVideo } = await supabase
        .from("videos")
        .select("title, description, thumbnail_url, platform")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

    const video = rawVideo as {
        title: string;
        description: string | null;
        thumbnail_url: string | null;
        platform: string;
    } | null;

    if (!video) {
        return {
            title: `Corte nao encontrado | ${settings.site_name}`,
        };
    }

    return {
        title: video.title,
        description: video.description || video.title,
        openGraph: {
            title: `${video.title} | ${settings.site_name}`,
            description: video.description || video.title,
            siteName: settings.site_name,
            images: video.thumbnail_url ? [{ url: video.thumbnail_url }] : [],
        },
    };
}

export default async function VideoPage({ params }: VideoPageProps) {
    const { slug } = await params;
    const settings = await getSiteSettings();
    const supabase = await createClient();

    // Consulta o corte com categoria e produtos vinculados
    const { data: rawVideo } = await supabase
        .from("videos")
        .select(
            `
            *,
            category:categories(id, name, slug, icon),
            video_products(
                id,
                product_id,
                display_order,
                product:products(*)
            )
        `,
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

    if (!rawVideo) {
        notFound();
    }

    const video = rawVideo as unknown as VideoWithRelations;
    const products = (video.video_products || [])
        .map((vp) => vp.product)
        .filter((p): p is Product => Boolean(p));

    return (
        <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <PublicHeader settings={settings} />

            <main className="flex-1 py-6 sm:py-10">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    {/* Botao de Retorno ao Feed */}
                    <div className="mb-6">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Voltar para o Feed</span>
                        </Link>
                    </div>

                    {/* Conteudo Principal do Corte */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        {/* Coluna do Video (Reprodutor 9:16) */}
                        <div className="md:col-span-5 flex justify-center">
                            <VideoPlayer
                                platform={video.platform}
                                platformVideoId={video.platform_video_id}
                                title={video.title}
                                thumbnailUrl={video.thumbnail_url}
                                priority
                                isActive
                                className="w-full shadow-xl"
                            />
                        </div>

                        {/* Coluna de Informacoes e Produtos */}
                        <div className="md:col-span-7 space-y-6">
                            <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs dark:border-zinc-800/80 dark:bg-zinc-900/60">
                                <div className="flex items-center gap-2">
                                    {video.category && (
                                        <Link
                                            href={`/c/${video.category.slug}`}
                                            className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/20"
                                        >
                                            {video.category.name}
                                        </Link>
                                    )}
                                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                                        {video.platform}
                                    </span>
                                </div>

                                <h1 className="mt-3 text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                                    {video.title}
                                </h1>

                                {video.description && (
                                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                        {video.description}
                                    </p>
                                )}

                                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
                                    <a
                                        href={video.original_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 font-medium text-zinc-600 hover:text-brand-primary dark:text-zinc-400 dark:hover:text-brand-primary transition-colors"
                                    >
                                        <span>
                                            Assistir na plataforma de origem
                                        </span>
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>

                            {/* Secao de Produtos Recomendados */}
                            <div>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                                    Produtos em Destaque no Video (
                                    {products.length})
                                </h2>

                                {products.length > 0 ? (
                                    <div className="space-y-3">
                                        {products.map((product) => (
                                            <ProductCard
                                                key={product.id}
                                                product={product}
                                                videoId={video.id}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-900/40">
                                        Nenhum produto vinculado a este corte no
                                        momento.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400">
                <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
                    <span>
                        {settings.footer_text ||
                            `${settings.site_name} — Todos os direitos reservados.`}
                    </span>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        GitHub
                    </a>
                </div>
            </footer>
        </div>
    );
}
