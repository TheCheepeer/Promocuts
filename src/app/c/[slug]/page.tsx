import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { PublicHeader } from "@/components/public/header";
import { CategoryPills } from "@/components/public/category-pills";
import { Feed } from "@/components/public/feed";
import type { Category } from "@/types/database";
import type { VideoWithRelations } from "@/components/public/feed-mobile";

interface CategoryPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({
    params,
}: CategoryPageProps): Promise<Metadata> {
    const { slug } = await params;
    const settings = await getSiteSettings();
    const supabase = await createClient();

    const { data: rawCategoryMeta } = await supabase
        .from("categories")
        .select("name")
        .eq("slug", slug)
        .maybeSingle();

    const categoryMeta = rawCategoryMeta as { name: string } | null;

    if (!categoryMeta) {
        return {
            title: `Categoria nao encontrada | ${settings.site_name}`,
        };
    }

    return {
        title: `${categoryMeta.name}`,
        description: `Explore os melhores achadinhos e cortes de recomendacao na categoria ${categoryMeta.name}.`,
    };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const { slug } = await params;
    const settings = await getSiteSettings();
    const supabase = await createClient();

    // 1. Busca a categoria pelo slug
    const { data: rawCategory } = await supabase
        .from("categories")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

    const category = rawCategory as Category | null;

    if (!category) {
        notFound();
    }

    // 2. Busca todas as categorias para popular a barra de selecao
    const { data: rawCategories } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

    const categories = (rawCategories || []) as Category[];

    // 3. Busca videos publicados para a categoria ativa
    const { data: rawVideos } = await supabase
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
        .eq("is_published", true)
        .eq("category_id", category.id)
        .order("order_weight", { ascending: false })
        .order("created_at", { ascending: false });

    const videos = (rawVideos || []) as unknown as VideoWithRelations[];

    return (
        <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <PublicHeader settings={settings} />
            <CategoryPills categories={categories} activeSlug={slug} />

            <main className="flex-1">
                <Feed videos={videos} />
            </main>

            {/* Rodape visivel exclusivamente em telas grandes */}
            <footer className="hidden border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:bg-zinc-950 dark:text-zinc-400 md:block">
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
