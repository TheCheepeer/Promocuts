"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
    PlusCircle,
    Search,
    Edit2,
    Trash2,
    ShoppingBag,
    ExternalLink,
    Tag,
    Loader2,
    Image as ImageIcon,
} from "lucide-react";
import { ProductDialog } from "./product-dialog";
import { deleteProductAction } from "./actions";
import {
    formatCurrency,
    formatDiscountPercentage,
    formatDiscountBadge,
} from "@/lib/formatters";
import type { Product, Category } from "@/types/database";

export interface ProductWithCategory extends Product {
    category?: { name: string; slug: string } | null;
}

interface ProductsTableProps {
    products: ProductWithCategory[];
    categories: Category[];
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
    const [search, setSearch] = useState("");
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
    const [selectedStoreFilter, setSelectedStoreFilter] = useState("");

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        null,
    );

    const [isDeleting, startDeleteTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Lista de lojas presentes nos produtos para o filtro
    const availableStores = useMemo(() => {
        const storeSet = new Set<string>();
        products.forEach((p) => {
            if (p.store_name) storeSet.add(p.store_name);
        });
        return Array.from(storeSet).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase();
        return products.filter((prod) => {
            const matchesSearch =
                !query ||
                prod.name.toLowerCase().includes(query) ||
                (prod.coupon_code &&
                    prod.coupon_code.toLowerCase().includes(query)) ||
                prod.store_name.toLowerCase().includes(query);

            const matchesCategory =
                !selectedCategoryFilter ||
                prod.category_id === selectedCategoryFilter;

            const matchesStore =
                !selectedStoreFilter || prod.store_name === selectedStoreFilter;

            return matchesSearch && matchesCategory && matchesStore;
        });
    }, [products, search, selectedCategoryFilter, selectedStoreFilter]);

    const handleCreate = () => {
        setSelectedProduct(null);
        setDialogOpen(true);
    };

    const handleEdit = (prod: Product) => {
        setSelectedProduct(prod);
        setDialogOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (
            window.confirm(
                `Deseja realmente excluir o produto "${name}"? Ele sera desvinculado dos videos em que foi recomendado.`,
            )
        ) {
            setDeletingId(id);
            startDeleteTransition(async () => {
                await deleteProductAction(id);
                setDeletingId(null);
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Barra de Filtros e Novo Produto */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-1 flex-col sm:flex-row gap-2.5">
                    {/* Busca Textual */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nome, cupom ou loja..."
                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* Filtro por Categoria */}
                    <select
                        value={selectedCategoryFilter}
                        onChange={(e) =>
                            setSelectedCategoryFilter(e.target.value)
                        }
                        className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    >
                        <option value="">Todas as categorias</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>

                    {/* Filtro por Loja */}
                    {availableStores.length > 0 && (
                        <select
                            value={selectedStoreFilter}
                            onChange={(e) =>
                                setSelectedStoreFilter(e.target.value)
                            }
                            className="px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        >
                            <option value="">Todas as lojas</option>
                            {availableStores.map((store) => (
                                <option key={store} value={store}>
                                    {store}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                >
                    <PlusCircle className="h-4 w-4" />
                    Novo Produto
                </button>
            </div>

            {/* Tabela de Produtos */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                {filteredProducts.length === 0 ? (
                    <div className="p-8 text-center">
                        <ShoppingBag className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Nenhum produto afiliado cadastrado.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            {search ||
                            selectedCategoryFilter ||
                            selectedStoreFilter
                                ? "Nenhum produto atende aos filtros selecionados."
                                : "Adicione produtos parceiros com links afiliados para vincular aos cortes."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                                    <th className="py-3 px-4">Item</th>
                                    <th className="py-3 px-4">Loja</th>
                                    <th className="py-3 px-4">Categoria</th>
                                    <th className="py-3 px-4">Preco</th>
                                    <th className="py-3 px-4">Cupom</th>
                                    <th className="py-3 px-4 text-center">
                                        Link
                                    </th>
                                    <th className="py-3 px-4 text-right">
                                        Acoes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {filteredProducts.map((prod) => {
                                    const discountPct =
                                        prod.regular_price &&
                                        prod.discount_price
                                            ? formatDiscountPercentage(
                                                  prod.regular_price,
                                                  prod.discount_price,
                                              )
                                            : 0;

                                    return (
                                        <tr
                                            key={prod.id}
                                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                        {prod.image_url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={
                                                                    prod.image_url
                                                                }
                                                                alt={prod.name}
                                                                className="h-full w-full object-cover"
                                                                onError={(
                                                                    e,
                                                                ) => {
                                                                    (
                                                                        e.currentTarget as HTMLElement
                                                                    ).style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <ImageIcon className="h-4 w-4 text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs">
                                                        <p
                                                            className="font-medium text-zinc-900 dark:text-zinc-100 truncate"
                                                            title={prod.name}
                                                        >
                                                            {prod.name}
                                                        </p>
                                                        {prod.description && (
                                                            <p
                                                                className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate"
                                                                title={
                                                                    prod.description
                                                                }
                                                            >
                                                                {
                                                                    prod.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    {prod.store_name}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                {prod.category?.name ? (
                                                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                        {prod.category.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 text-[11px]">
                                                        Geral
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="flex flex-col font-mono">
                                                    {prod.discount_price !=
                                                    null ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                                {formatCurrency(
                                                                    prod.discount_price,
                                                                )}
                                                            </span>
                                                            {discountPct >
                                                                0 && (
                                                                <span className="text-[10px] font-bold px-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                    {formatDiscountBadge(
                                                                        prod.regular_price,
                                                                        prod.discount_price,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : prod.regular_price !=
                                                      null ? (
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                            {formatCurrency(
                                                                prod.regular_price,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-400 text-[11px]">
                                                            Sob consulta
                                                        </span>
                                                    )}

                                                    {prod.regular_price !=
                                                        null &&
                                                        prod.discount_price !=
                                                            null &&
                                                        prod.regular_price >
                                                            prod.discount_price && (
                                                            <span className="text-[10px] text-zinc-400 line-through">
                                                                {formatCurrency(
                                                                    prod.regular_price,
                                                                )}
                                                            </span>
                                                        )}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                {prod.coupon_code ? (
                                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900">
                                                        <Tag className="h-2.5 w-2.5" />
                                                        {prod.coupon_code}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-400 text-[11px]">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-center">
                                                <a
                                                    href={prod.affiliate_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer sponsored"
                                                    title="Abrir link de afiliado em nova aba"
                                                    aria-label="Abrir link de afiliado em nova aba"
                                                    className="inline-flex p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(prod)
                                                        }
                                                        title="Editar Produto"
                                                        aria-label={`Editar produto ${prod.name}`}
                                                        className="p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(
                                                                prod.id,
                                                                prod.name,
                                                            )
                                                        }
                                                        disabled={
                                                            isDeleting &&
                                                            deletingId ===
                                                                prod.id
                                                        }
                                                        title="Excluir Produto"
                                                        aria-label={`Excluir produto ${prod.name}`}
                                                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isDeleting &&
                                                        deletingId ===
                                                            prod.id ? (
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

            <ProductDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                product={selectedProduct}
                categories={categories}
            />
        </div>
    );
}
