"use client";

import React, { useState, useTransition } from "react";
import {
    Plus,
    ExternalLink,
    Store,
    Smartphone,
    Pencil,
    Trash2,
    ArrowUp,
    ArrowDown,
    Share2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { getSocialPlatform } from "@/lib/social/strategies";
import { SocialIcon } from "@/components/public/social-icon";
import { SocialLinkDialog } from "./social-link-dialog";
import {
    deleteSocialLinkAction,
    toggleSocialVisibilityAction,
    reorderSocialLinksAction,
} from "./actions";
import type { BrandSocialLink } from "@/types/database";

interface SocialLinksManagerProps {
    initialLinks: BrandSocialLink[];
}

export function SocialLinksManager({ initialLinks }: SocialLinksManagerProps) {
    const [links, setLinks] = useState<BrandSocialLink[]>(initialLinks);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<BrandSocialLink | null>(null);
    const [isPending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    // Sincroniza estado quando a propriedade do servidor atualizar
    React.useEffect(() => {
        setLinks(initialLinks);
    }, [initialLinks]);

    const handleCreate = () => {
        setEditingLink(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (link: BrandSocialLink) => {
        setEditingLink(link);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente remover o canal ${name}?`)) {
            return;
        }

        startTransition(async () => {
            const res = await deleteSocialLinkAction(id);
            if (res.success) {
                setLinks((prev) => prev.filter((l) => l.id !== id));
                setFeedback({
                    type: "success",
                    message: `Canal ${name} removido com sucesso.`,
                });
            } else {
                setFeedback({
                    type: "error",
                    message: res.error || "Erro ao remover rede social.",
                });
            }
        });
    };

    const handleToggle = (
        id: string,
        target: "storefront" | "bio" | "active",
        currentValue: boolean,
    ) => {
        // Atualização otimista
        setLinks((prev) =>
            prev.map((l) => {
                if (l.id !== id) return l;
                if (target === "storefront") return { ...l, show_in_storefront: !currentValue };
                if (target === "bio") return { ...l, show_in_bio: !currentValue };
                if (target === "active") return { ...l, is_active: !currentValue };
                return l;
            }),
        );

        startTransition(async () => {
            const res = await toggleSocialVisibilityAction(id, target, currentValue);
            if (!res.success) {
                // Reverte em caso de falha
                setLinks(initialLinks);
                setFeedback({
                    type: "error",
                    message: res.error || "Erro ao alterar visibilidade.",
                });
            }
        });
    };

    const handleMove = (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= links.length) return;

        const updated = [...links];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);

        // Atualiza localmente
        setLinks(updated);

        startTransition(async () => {
            const orderedIds = updated.map((l) => l.id);
            const res = await reorderSocialLinksAction(orderedIds);
            if (!res.success) {
                setLinks(initialLinks);
                setFeedback({
                    type: "error",
                    message: res.error || "Erro ao reordenar canais.",
                });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Feedback Visual */}
            {feedback && (
                <div
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-xs ${
                        feedback.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {feedback.type === "success" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                        )}
                        <span>{feedback.message}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setFeedback(null)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer text-xs"
                    >
                        Fechar
                    </button>
                </div>
            )}

            {/* Barra de Ações Superior */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
                <div>
                    <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Canais Oficiais Configurados
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Defina quais perfis aparecem na vitrine e nos bio links com controle independente.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCreate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xs cursor-pointer shrink-0"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Adicionar Rede Social</span>
                </button>
            </div>

            {/* Lista de Canais */}
            {links.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-3">
                        <Share2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Nenhuma rede social configurada
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                        Adicione canais de comunicação, perfis oficiais ou comunidades para dar visibilidade à sua marca.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Cadastrar Primeiro Canal</span>
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {links.map((link, index) => {
                        const strategy = getSocialPlatform(link.platform);
                        const isFirst = index === 0;
                        const isLast = index === links.length - 1;

                        return (
                            <div
                                key={link.id}
                                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                                    link.is_active
                                        ? "bg-white border-zinc-200/90 dark:bg-zinc-900 dark:border-zinc-800/90 shadow-xs"
                                        : "bg-zinc-50/70 border-zinc-200/60 dark:bg-zinc-950/40 dark:border-zinc-800/40 opacity-70"
                                }`}
                            >
                                {/* Bloco de Identificação */}
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                                        style={{ backgroundColor: strategy.brandColor }}
                                    >
                                        <SocialIcon platform={link.platform} className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                {strategy.name}
                                            </span>
                                            {!link.is_active && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                    Pausado
                                                </span>
                                            )}
                                        </div>

                                        <a
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono hover:text-brand-primary truncate max-w-md mt-0.5"
                                        >
                                            <span className="truncate">{link.url}</span>
                                            <ExternalLink className="h-3 w-3 shrink-0" />
                                        </a>
                                    </div>
                                </div>

                                {/* Controles Rápidos de Visibilidade */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800/80">
                                    {/* Alternador: Cabeçalho da Vitrine */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleToggle(link.id, "storefront", link.show_in_storefront)
                                        }
                                        title={
                                            link.show_in_storefront
                                                ? "Exibindo no topo da Vitrine (clique para ocultar)"
                                                : "Oculto da Vitrine (clique para exibir)"
                                        }
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                            link.show_in_storefront
                                                ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                                                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-60 line-through"
                                        }`}
                                    >
                                        <Store className="h-3.5 w-3.5" />
                                        <span>Vitrine</span>
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                                link.show_in_storefront
                                                    ? "bg-emerald-500 shadow-2xs"
                                                    : "bg-zinc-300 dark:bg-zinc-600"
                                            }`}
                                        />
                                    </button>

                                    {/* Alternador: Perfil de Bio Links */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleToggle(link.id, "bio", link.show_in_bio)
                                        }
                                        title={
                                            link.show_in_bio
                                                ? "Exibindo no perfil de Bio Links (clique para ocultar)"
                                                : "Oculto de Bio Links (clique para exibir)"
                                        }
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                            link.show_in_bio
                                                ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                                                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-60 line-through"
                                        }`}
                                    >
                                        <Smartphone className="h-3.5 w-3.5" />
                                        <span>Bio</span>
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                                link.show_in_bio
                                                    ? "bg-indigo-500 shadow-2xs"
                                                    : "bg-zinc-300 dark:bg-zinc-600"
                                            }`}
                                        />
                                    </button>

                                    {/* Botões de Ordenação */}
                                    <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                                        <button
                                            type="button"
                                            disabled={isFirst || isPending}
                                            onClick={() => handleMove(index, "up")}
                                            className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                            title="Mover para cima"
                                            aria-label="Mover para cima"
                                        >
                                            <ArrowUp className="h-3.5 w-3.5" />
                                        </button>
                                        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800" />
                                        <button
                                            type="button"
                                            disabled={isLast || isPending}
                                            onClick={() => handleMove(index, "down")}
                                            className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
                                            title="Mover para baixo"
                                            aria-label="Mover para baixo"
                                        >
                                            <ArrowDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Botão de Edição */}
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(link)}
                                        className="p-2 rounded-xl text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                        title="Editar canal"
                                        aria-label="Editar canal"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>

                                    {/* Botão de Exclusão */}
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(link.id, strategy.name)}
                                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
                                        title="Remover canal"
                                        aria-label="Remover canal"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Criação / Edição com montagem limpa e chave reativa */}
            {isDialogOpen && (
                <SocialLinkDialog
                    key={editingLink ? editingLink.id : "new-social-dialog"}
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false);
                        setEditingLink(null);
                    }}
                    linkToEdit={editingLink}
                />
            )}
        </div>
    );
}
