import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { ProductsTable, type ProductWithCategory } from "./products-table";
import type { Category } from "@/types/database";

export const metadata = {
    title: "Produtos Afiliados",
};

export default async function AdminProductsPage() {
    const { adminDb } = await requireAdminAuth();

    // Consulta produtos com categorias, ofertas multi-loja vinculadas e categorias ativas
    const [productsResult, categoriesResult] = await Promise.all([
        adminDb
            .from("products")
            .select("*, category:categories(name, slug), product_links(*)")
            .order("created_at", { ascending: false }),
        adminDb
            .from("categories")
            .select("*")
            .order("display_order", { ascending: true })
            .order("name", { ascending: true }),
    ]);

    const products = (productsResult.data ||
        []) as unknown as ProductWithCategory[];
    const categories = (categoriesResult.data || []) as Category[];

    return (
        <div className="space-y-6">
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Produtos Afiliados
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Gerencie os produtos recomendados nos cortes com ofertas
                    multi-loja, cupons e monitoramento de links.
                </p>
            </div>

            <ProductsTable products={products} categories={categories} />
        </div>
    );
}
