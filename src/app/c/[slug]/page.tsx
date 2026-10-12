import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public/header";
import { CreatorProfile } from "@/components/public/creator-profile";
import { Storefront } from "@/components/public/storefront";
import { getCachedData, setCachedData } from "@/lib/cache/redis";
import { rankVideosByFreshness } from "@/lib/feed/ranking";
import type { Category, BioLink } from "@/types/database";
import type { VideoWithRelations } from "@/components/public/feed-mobile";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const settings = await getSiteSettings();

    // 1. Tenta obter o nome da categoria diretamente do cache em memoria
    const cachedCategories = await getCachedData<Category[]>("promocuts:categories:all");
    const foundCategory = cachedCategories?.find((c) => c.slug === slug);

    if (foundCategory) {
        return {
            title: `${foundCategory.name}`,
            description: `Explore os melhores achadinhos e cortes de recomendação na categoria ${foundCategory.name}.`,
        };
    }

    // Fallback: consulta rapida ao Supabase
    const supabase = await createClient();
    const { data: rawCategoryMeta } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", slug)
        .maybeSingle();

    const categoryMeta = rawCategoryMeta as { name: string } | null;

    if (!categoryMeta) {
        return {
            title: `Categoria não encontrada | ${settings.site_name}`,
        };
    }

    return {
        title: `${categoryMeta.name}`,
        description: `Explore os melhores achadinhos e cortes de recomendação na categoria ${categoryMeta.name}.`,
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const settings = await getSiteSettings();

    // 1. Consulta paralela ultrarrapida ao cache em memoria do Upstash Redis
    const [cachedCategories, cachedVideos, cachedBioLinks] = await Promise.all([
        getCachedData<Category[]>("promocuts:categories:all"),
        getCachedData<VideoWithRelations[]>("promocuts:feed:all"),
        getCachedData<BioLink[]>("promocuts:bio_links:all"),
    ]);

    let categories = cachedCategories;
    let allVideos = cachedVideos;
    let bioLinks = cachedBioLinks;

    // 2. Fallback resiliente ao Supabase caso o cache nao esteja disponivel
    if (!categories || !allVideos || !bioLinks) {
        const supabase = await createClient();

        const [categoriesResult, videosResult, bioLinksResult] = await Promise.all([
            categories
                ? Promise.resolve({ data: categories })
                : supabase
                      .from("categories")
                      .select("*")
                      .order("display_order", { ascending: true })
                      .order("name", { ascending: true }),
            allVideos
                ? Promise.resolve({ data: allVideos })
                : supabase
                      .from("videos")
                      .select(
                          `
                        *,
                        category:categories(id, name, slug, icon),
                        video_products(
                            id,
                            product_id,
                            display_order,
                            product:products(
                                *,
                                product_links(*)
                            )
                        )
                    `,
                      )
                      .eq("is_published", true)
                      .order("created_at", { ascending: false }),
            bioLinks
                ? Promise.resolve({ data: bioLinks })
                : supabase
                      .from("bio_links")
                      .select("*")
                      .eq("is_active", true)
                      .order("display_order", { ascending: true })
                      .order("created_at", { ascending: true }),
        ]);

        if (!categories && categoriesResult.data) {
            categories = categoriesResult.data as Category[];
            await setCachedData("promocuts:categories:all", categories, 300);
        }

        if (!allVideos && videosResult.data) {
            allVideos = videosResult.data as unknown as VideoWithRelations[];
            await setCachedData("promocuts:feed:all", allVideos, 300);
        }

        if (!bioLinks && bioLinksResult.data) {
            bioLinks = bioLinksResult.data as BioLink[];
            await setCachedData("promocuts:bio_links:all", bioLinks, 300);
        }
    }

    categories = categories || [];
    allVideos = allVideos || [];
    bioLinks = bioLinks || [];

    // Ranqueamento dinâmico: recência temporal combinada com dispersão controlada
    const rankedVideos = rankVideosByFreshness(allVideos);

    // 3. Valida a existencia da categoria informada
    const currentCategory = categories.find((c) => c.slug === slug);
    if (!currentCategory) {
        notFound();
    }

    return (
        <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <PublicHeader settings={settings} />
            <CreatorProfile settings={settings} bioLinks={bioLinks} />
            <Storefront
                categories={categories}
                allVideos={rankedVideos}
                initialActiveSlug={slug}
            />

            {/* Rodape visivel exclusivamente em telas desktop */}
            <footer className="hidden border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 md:block">
                <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
                    <span>
                        {settings.footer_text ||
                            `${settings.site_name} — Todos os direitos reservados.`}
                    </span>
                    <a
                        href="https://github.com/TheCheepeer/Promocuts"
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
