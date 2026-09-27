"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { IconPicker } from "./icon-picker";
import { createCategoryAction, updateCategoryAction } from "./actions";
import { slugify } from "@/lib/formatters";
import type { Category } from "@/types/database";

interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
}

export function CategoryDialog({
    isOpen,
    onClose,
    category,
}: CategoryDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [icon, setIcon] = useState("");
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

    const isEditing = Boolean(category?.id);

    useEffect(() => {
        if (category) {
            setName(category.name || "");
            setSlug(category.slug || "");
            setIcon(category.icon || "");
            setDisplayOrder(category.display_order ?? 0);
            setIsSlugManuallyEdited(true);
        } else {
            setName("");
            setSlug("");
            setIcon("");
            setDisplayOrder(0);
            setIsSlugManuallyEdited(false);
        }
        setErrorMessage(null);
    }, [category, isOpen]);

    if (!isOpen) return null;

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        if (!isSlugManuallyEdited) {
            setSlug(slugify(newName));
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsSlugManuallyEdited(true);
        setSlug(slugify(e.target.value));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("slug", slug);
        formData.set("icon", icon);
        formData.set("display_order", String(displayOrder));

        startTransition(async () => {
            const res =
                isEditing && category?.id
                    ? await updateCategoryAction(
                          category.id,
                          { success: false },
                          formData,
                      )
                    : await createCategoryAction({ success: false }, formData);

            if (res.success) {
                onClose();
            } else {
                setErrorMessage(res.error || "Ocorreu um erro ao salvar.");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {isEditing ? "Editar Categoria" : "Nova Categoria"}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {isEditing
                                ? "Atualize as configuracoes e ordem de exibicao."
                                : "Cadastre uma nova categoria para classificar os cortes."}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar janela"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs border border-red-200 dark:border-red-900">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div>
                        <label
                            htmlFor="cat-name"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Nome da Categoria *
                        </label>
                        <input
                            id="cat-name"
                            type="text"
                            required
                            maxLength={100}
                            value={name}
                            onChange={handleNameChange}
                            placeholder="Ex: Tecnologia, Moda Masculina, Cozinha"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="cat-slug"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Slug na URL (/c/[slug]) *
                        </label>
                        <input
                            id="cat-slug"
                            type="text"
                            required
                            maxLength={100}
                            value={slug}
                            onChange={handleSlugChange}
                            placeholder="ex: tecnologia, moda-masculina"
                            className="w-full font-mono px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                            Identificador amigavel para filtros e
                            compartilhamento.
                        </p>
                    </div>

                    {/* Seletor de Icone */}
                    <IconPicker value={icon} onChange={setIcon} />

                    <div>
                        <label
                            htmlFor="cat-order"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Ordem de Exibicao
                        </label>
                        <input
                            id="cat-order"
                            type="number"
                            min={0}
                            value={displayOrder}
                            onChange={(e) =>
                                setDisplayOrder(
                                    parseInt(e.target.value, 10) || 0,
                                )
                            }
                            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                            Valores menores aparecem primeiro na barra de
                            pilulas (ex: 0, 1, 2...).
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            {isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            {isEditing
                                ? "Salvar Alteracoes"
                                : "Criar Categoria"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
