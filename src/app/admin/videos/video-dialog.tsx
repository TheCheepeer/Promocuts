"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    ArrowUp,
    ArrowDown,
    Image as ImageIcon,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import { parseVideoUrl } from "@/lib/embeds/parser";
import { slugify } from "@/lib/formatters";
import { createVideoAction, updateVideoAction } from "./actions";
import { AssetInput } from "@/components/ui/asset-input";
import type { Video, Category, Product } from "@/types/database";

interface LinkedProductItem {
    productId: string;
    name: string;
    storeName: string;
    displayOrder: number;
}

interface VideoDialogProps {
    isOpen: boolean;
    onClose: () => void;
    video?:
        | (Video & {
              video_products?: {
                  product_id: string;
                  display_order: number;
                  product?: Product;
              }[];
          })
        | null;
    categories: Category[];
    availableProducts: Product[];
}

export function VideoDialog({
    isOpen,
    onClose,
    video,
    categories,
    availableProducts,
}: VideoDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [originalUrl, setOriginalUrl] = useState("");
    const [detectedPlatform, setDetectedPlatform] = useState<string | null>(
        null,
    );
    const [platformVideoId, setPlatformVideoId] = useState<string | null>(null);
    const [urlError, setUrlError] = useState(false);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [isPublished, setIsPublished] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);
    const [orderWeight, setOrderWeight] = useState(0);

    const [linkedProducts, setLinkedProducts] = useState<LinkedProductItem[]>(
        [],
    );
    const [selectedAddProductId, setSelectedAddProductId] = useState("");
    const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractSuccess, setExtractSuccess] = useState<string | null>(null);

    const isEditing = Boolean(video?.id);

    useEffect(() => {
        if (video) {
            setOriginalUrl(video.original_url || "");
            setDetectedPlatform(video.platform || null);
            setPlatformVideoId(video.platform_video_id || null);
            setUrlError(false);

            setTitle(video.title || "");
            setSlug(video.slug || "");
            setCategoryId(video.category_id || "");
            setDescription(video.description || "");
            setThumbnailUrl(video.thumbnail_url || "");
            setIsPublished(video.is_published ?? true);
            setIsFeatured(video.is_featured ?? false);
            setOrderWeight(video.order_weight ?? 0);
            setIsSlugManuallyEdited(true);

            // Popula os produtos vinculados
            if (video.video_products) {
                const mapped: LinkedProductItem[] = video.video_products.map(
                    (vp) => ({
                        productId: vp.product_id,
                        name: vp.product?.name || "Produto",
                        storeName: vp.product?.store_name || "",
                        displayOrder: vp.display_order,
                    }),
                );
                mapped.sort((a, b) => a.displayOrder - b.displayOrder);
                setLinkedProducts(mapped);
            } else {
                setLinkedProducts([]);
            }
        } else {
            setOriginalUrl("");
            setDetectedPlatform(null);
            setPlatformVideoId(null);
            setUrlError(false);

            setTitle("");
            setSlug("");
            setCategoryId(categories[0]?.id || "");
            setDescription("");
            setThumbnailUrl("");
            setIsPublished(true);
            setIsFeatured(false);
            setOrderWeight(0);
            setLinkedProducts([]);
            setIsSlugManuallyEdited(false);
        }
        setErrorMessage(null);
        setExtractSuccess(null);
        setSelectedAddProductId("");
    }, [video, isOpen, categories]);

    if (!isOpen) return null;

    // Analisa a URL original ao digitar ou colar
    const handleUrlChange = (val: string) => {
        setOriginalUrl(val);
        setExtractSuccess(null);
        if (!val.trim()) {
            setDetectedPlatform(null);
            setPlatformVideoId(null);
            setUrlError(false);
            return;
        }

        const parsed = parseVideoUrl(val.trim());
        if (parsed) {
            setDetectedPlatform(parsed.platform);
            setPlatformVideoId(parsed.platformVideoId);
            setUrlError(false);
        } else {
            setDetectedPlatform(null);
            setPlatformVideoId(null);
            setUrlError(true);
        }
    };

    // Busca automaticamente o título e a miniatura na plataforma
    const handleExtractMetadata = async (urlToExtract?: string) => {
        const target = (urlToExtract || originalUrl).trim();
        if (!target) {
            setErrorMessage("Informe a URL do vídeo antes de buscar os dados.");
            return;
        }

        setIsExtracting(true);
        setErrorMessage(null);
        setExtractSuccess(null);

        try {
            const res = await fetch("/api/admin/extract-video", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: target }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                setErrorMessage(
                    json.error ||
                        "Não foi possível extrair os metadados do vídeo.",
                );
                return;
            }

            const data = json.data;
            let updatedCount = 0;

            if (data.title) {
                setTitle(data.title);
                if (!isSlugManuallyEdited || !slug) {
                    setSlug(slugify(data.title));
                }
                updatedCount++;
            }

            if (data.thumbnailUrl) {
                setThumbnailUrl(data.thumbnailUrl);
                updatedCount++;
            }

            if (updatedCount > 0) {
                setExtractSuccess(
                    "Dados capturados com sucesso! Você pode editá-los livremente nos campos abaixo.",
                );
            } else {
                setExtractSuccess(
                    "Plataforma detectada, mas nenhum dado foi retornado pela origem.",
                );
            }
        } catch {
            setErrorMessage("Falha de conexão ao buscar dados do vídeo.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleTitleChange = (val: string) => {
        setTitle(val);
        if (!isSlugManuallyEdited) {
            setSlug(slugify(val));
        }
    };

    const handleAddProduct = () => {
        if (!selectedAddProductId) return;
        const exists = linkedProducts.some(
            (p) => p.productId === selectedAddProductId,
        );
        if (exists) return;

        const prod = availableProducts.find(
            (p) => p.id === selectedAddProductId,
        );
        if (!prod) return;

        const nextOrder = linkedProducts.length;
        setLinkedProducts([
            ...linkedProducts,
            {
                productId: prod.id,
                name: prod.name,
                storeName: prod.store_name,
                displayOrder: nextOrder,
            },
        ]);
        setSelectedAddProductId("");
    };

    const handleRemoveProduct = (productId: string) => {
        const filtered = linkedProducts
            .filter((p) => p.productId !== productId)
            .map((p, idx) => ({ ...p, displayOrder: idx }));
        setLinkedProducts(filtered);
    };

    const handleMoveProduct = (index: number, direction: "up" | "down") => {
        const newArr = [...linkedProducts];
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newArr.length) return;

        const temp = newArr[index];
        newArr[index] = newArr[targetIndex];
        newArr[targetIndex] = temp;

        const reordered = newArr.map((item, idx) => ({
            ...item,
            displayOrder: idx,
        }));
        setLinkedProducts(reordered);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!detectedPlatform || !platformVideoId) {
            setErrorMessage(
                "Informe uma URL valida do TikTok, Instagram Reels ou YouTube Shorts.",
            );
            return;
        }

        const formData = new FormData();
        formData.set("original_url", originalUrl);
        formData.set("title", title);
        formData.set("slug", slug);
        formData.set("category_id", categoryId);
        formData.set("description", description);
        formData.set("thumbnail_url", thumbnailUrl);
        formData.set("is_published", isPublished ? "true" : "false");
        formData.set("is_featured", isFeatured ? "true" : "false");
        formData.set("order_weight", String(orderWeight));

        const productsPayload = linkedProducts.map((lp, idx) => ({
            productId: lp.productId,
            displayOrder: idx,
        }));

        startTransition(async () => {
            const res =
                isEditing && video?.id
                    ? await updateVideoAction(
                          video.id,
                          { success: false },
                          formData,
                          productsPayload,
                      )
                    : await createVideoAction(
                          { success: false },
                          formData,
                          productsPayload,
                      );

            if (res.success) {
                onClose();
            } else {
                setErrorMessage(res.error || "Erro ao salvar video.");
            }
        });
    };

    const platformLabels: Record<string, { name: string; color: string }> = {
        tiktok: { name: "TikTok", color: "bg-black text-white" },
        reels: { name: "Instagram Reels", color: "bg-pink-600 text-white" },
        shorts: { name: "YouTube Shorts", color: "bg-red-600 text-white" },
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {isEditing
                                ? "Editar Corte de Video"
                                : "Cadastrar Corte de Video"}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Insira a URL publica do video e associe os produtos
                            recomendados.
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
                    {/* Campo de URL com Deteccao Automatica */}
                    <div>
                        <label
                            htmlFor="vid-url"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            URL Original do Video *
                        </label>
                        <input
                            id="vid-url"
                            type="url"
                            required
                            value={originalUrl}
                            onChange={(e) => handleUrlChange(e.target.value)}
                            placeholder="https://www.tiktok.com/@... ou https://www.instagram.com/reel/... ou https://youtube.com/shorts/..."
                            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />

                        {/* Feedback Visual da Deteccao de Plataforma e Botao de Captura */}
                        {detectedPlatform &&
                            platformLabels[detectedPlatform] && (
                                <div className="mt-2 space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span>
                                                Plataforma detectada:{" "}
                                                <strong className="font-semibold">
                                                    {
                                                        platformLabels[
                                                            detectedPlatform
                                                        ].name
                                                    }
                                                </strong>{" "}
                                                (ID:{" "}
                                                <span className="font-mono">
                                                    {platformVideoId}
                                                </span>
                                                )
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleExtractMetadata()
                                            }
                                            disabled={isExtracting}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {isExtracting ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    <span>
                                                        Buscando dados...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="h-3.5 w-3.5" />
                                                    <span>
                                                        Capturar Título e Miniatura
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {extractSuccess && (
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                                            <span>{extractSuccess}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                        {urlError && (
                            <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                <span>
                                    URL nao reconhecida. Cole um link valido de
                                    post do TikTok, Instagram Reels ou YouTube
                                    Shorts.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Titulo e Slug */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="vid-title"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Titulo do Corte *
                            </label>
                            <input
                                id="vid-title"
                                type="text"
                                required
                                maxLength={255}
                                value={title}
                                onChange={(e) =>
                                    handleTitleChange(e.target.value)
                                }
                                placeholder="Ex: Melhores Gadgets de 2026 para Casa"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="vid-slug"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Slug (/v/[slug]) *
                            </label>
                            <input
                                id="vid-slug"
                                type="text"
                                required
                                maxLength={255}
                                value={slug}
                                onChange={(e) => {
                                    setIsSlugManuallyEdited(true);
                                    setSlug(slugify(e.target.value));
                                }}
                                className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>
                    </div>

                    {/* Categoria e Peso de Ordenacao */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="vid-category"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Categoria Tematica
                            </label>
                            <select
                                id="vid-category"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            >
                                <option value="">Sem categoria definida</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="vid-order"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Peso de Ordenacao Manual
                            </label>
                            <input
                                id="vid-order"
                                type="number"
                                value={orderWeight}
                                onChange={(e) =>
                                    setOrderWeight(
                                        parseInt(e.target.value, 10) || 0,
                                    )
                                }
                                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                                Maior peso = aparece mais perto do topo do feed.
                            </p>
                        </div>
                    </div>

                    {/* Miniatura Alternativa com Suporte a Upload Direto */}
                    <AssetInput
                        name="vid-thumb"
                        label="Miniatura do Vídeo (Opcional)"
                        description="Capturada da plataforma ou envie uma imagem personalizada"
                        value={thumbnailUrl}
                        onChange={setThumbnailUrl}
                        placeholder="https://... ou faça upload de um arquivo"
                        aspectRatio="video"
                        uploadTitle="Fazer upload de miniatura (PNG, JPG, WebP)"
                    />

                    {/* Descricao */}
                    <div>
                        <label
                            htmlFor="vid-desc"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Descricao ou Resumo do Corte
                        </label>
                        <textarea
                            id="vid-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Pontos abordados no corte, especificacoes..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* Controles de Publicacao e Destaque */}
                    <div className="flex flex-wrap items-center gap-6 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPublished}
                                onChange={(e) =>
                                    setIsPublished(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-700"
                            />
                            <span>Publicado (visivel na vitrine publica)</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) =>
                                    setIsFeatured(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-700"
                            />
                            <span>Destaque prioritario no feed</span>
                        </label>
                    </div>

                    {/* Secao de Produtos Recomendados Vinculados */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                                    Produtos Recomendados neste Corte
                                </h3>
                                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                    Adicione e ordene os produtos afiliados
                                    associados a este video.
                                </p>
                            </div>
                        </div>

                        {/* Adicionar Produto */}
                        <div className="flex items-center gap-2 mb-3">
                            <select
                                value={selectedAddProductId}
                                onChange={(e) =>
                                    setSelectedAddProductId(e.target.value)
                                }
                                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            >
                                <option value="">
                                    Selecione um produto do catalogo...
                                </option>
                                {availableProducts
                                    .filter(
                                        (ap) =>
                                            !linkedProducts.some(
                                                (lp) => lp.productId === ap.id,
                                            ),
                                    )
                                    .map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.store_name})
                                        </option>
                                    ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleAddProduct}
                                disabled={!selectedAddProductId}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 disabled:opacity-40 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar
                            </button>
                        </div>

                        {/* Lista de Produtos Vinculados */}
                        {linkedProducts.length === 0 ? (
                            <div className="p-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-400">
                                Nenhum produto vinculado a este corte ainda.
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {linkedProducts.map((item, idx) => (
                                    <div
                                        key={item.productId}
                                        className="flex items-center justify-between p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-mono text-[10px] w-5 text-center text-zinc-400">
                                                #{idx + 1}
                                            </span>
                                            <ShoppingBag className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                                {item.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 shrink-0">
                                                ({item.storeName})
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleMoveProduct(idx, "up")
                                                }
                                                disabled={idx === 0}
                                                aria-label="Subir posicao"
                                                className="p-1 rounded text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                                            >
                                                <ArrowUp className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleMoveProduct(
                                                        idx,
                                                        "down",
                                                    )
                                                }
                                                disabled={
                                                    idx ===
                                                    linkedProducts.length - 1
                                                }
                                                aria-label="Descer posicao"
                                                className="p-1 rounded text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                                            >
                                                <ArrowDown className="h-3 w-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveProduct(
                                                        item.productId,
                                                    )
                                                }
                                                aria-label="Remover produto vinculado"
                                                className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Acoes do Modal */}
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
                            disabled={isPending || !detectedPlatform}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                            {isPending && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            )}
                            {isEditing
                                ? "Salvar Alteracoes"
                                : "Cadastrar Corte"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
