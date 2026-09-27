import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { CategoriesTable, type CategoryWithCount } from "./categories-table";

export const metadata = {
    title: "Categorias",
};

export default async function AdminCategoriesPage() {
    const { adminDb } = await requireAdminAuth();

    // Consulta categorias com a contagem de videos vinculados
    const { data: rawCategories } = await adminDb
        .from("categories")
        .select("*, videos(count)")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

    interface RawCategoryItem {
        id: string;
        name: string;
        slug: string;
        icon: string | null;
        display_order: number;
        created_at: string;
        updated_at: string;
        videos?: { count: number }[];
    }

    const categories: CategoryWithCount[] = (
        (rawCategories || []) as unknown as RawCategoryItem[]
    ).map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        display_order: cat.display_order,
        created_at: cat.created_at,
        updated_at: cat.updated_at,
        videos_count: Array.isArray(cat.videos)
            ? (cat.videos[0]?.count ?? 0)
            : 0,
    }));

    return (
        <div className="space-y-6">
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Categorias
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Crie e organize as categorias tematicas exibidas na barra de
                    pilulas da vitrine.
                </p>
            </div>

            <CategoriesTable categories={categories} />
        </div>
    );
}
