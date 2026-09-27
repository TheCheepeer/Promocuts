"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
    PlusCircle,
    Search,
    Edit2,
    Trash2,
    FolderTree,
    Video,
    Loader2,
} from "lucide-react";
import { DynamicCategoryIcon } from "./icon-picker";
import { CategoryDialog } from "./category-dialog";
import { deleteCategoryAction } from "./actions";
import type { Category } from "@/types/database";

export interface CategoryWithCount extends Category {
    videos_count?: number;
}

interface CategoriesTableProps {
    categories: CategoryWithCount[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(
        null,
    );
    const [isDeleting, startDeleteTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const filteredCategories = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return categories;
        return categories.filter(
            (cat) =>
                cat.name.toLowerCase().includes(query) ||
                cat.slug.toLowerCase().includes(query),
        );
    }, [categories, search]);

    const handleCreate = () => {
        setSelectedCategory(null);
        setDialogOpen(true);
    };

    const handleEdit = (cat: Category) => {
        setSelectedCategory(cat);
        setDialogOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (
            window.confirm(
                `Deseja realmente excluir a categoria "${name}"? Os videos vinculados continuarao salvos com categoria nula.`,
            )
        ) {
            setDeletingId(id);
            startDeleteTransition(async () => {
                await deleteCategoryAction(id);
                setDeletingId(null);
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Barra de Acoes e Busca */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou slug..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer shadow-xs"
                >
                    <PlusCircle className="h-4 w-4" />
                    Nova Categoria
                </button>
            </div>

            {/* Tabela de Categorias */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
                {filteredCategories.length === 0 ? (
                    <div className="p-8 text-center">
                        <FolderTree className="h-8 w-8 mx-auto text-zinc-400 mb-2" />
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Nenhuma categoria encontrada.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            {search
                                ? "Nao encontramos resultados para o termo pesquisado."
                                : "Cadastre a primeira categoria para iniciar a classificacao da vitrine."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/75 dark:border-zinc-800 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
                                    <th className="py-3 px-4">Icone</th>
                                    <th className="py-3 px-4">Nome</th>
                                    <th className="py-3 px-4">
                                        Slug (/c/[slug])
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                        Ordem
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                        Videos
                                    </th>
                                    <th className="py-3 px-4 text-right">
                                        Acoes
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                                {filteredCategories.map((cat) => (
                                    <tr
                                        key={cat.id}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                                                <DynamicCategoryIcon
                                                    name={cat.icon}
                                                    className="h-4 w-4"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            {cat.name}
                                        </td>
                                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                                            {cat.slug}
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono">
                                            {cat.display_order}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                <Video className="h-3 w-3" />
                                                {cat.videos_count ?? 0}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(cat)
                                                    }
                                                    title="Editar Categoria"
                                                    aria-label={`Editar categoria ${cat.name}`}
                                                    className="p-1.5 rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            cat.id,
                                                            cat.name,
                                                        )
                                                    }
                                                    disabled={
                                                        isDeleting &&
                                                        deletingId === cat.id
                                                    }
                                                    title="Excluir Categoria"
                                                    aria-label={`Excluir categoria ${cat.name}`}
                                                    className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors cursor-pointer disabled:opacity-50"
                                                >
                                                    {isDeleting &&
                                                    deletingId === cat.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <CategoryDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                category={selectedCategory}
            />
        </div>
    );
}
