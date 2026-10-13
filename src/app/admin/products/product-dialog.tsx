"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
    X,
    Loader2,
    Image as ImageIcon,
    Tag,
    Sparkles,
    Plus,
    Trash2,
    Store,
    ExternalLink,
} from "lucide-react";
import { createProductAction, updateProductAction } from "./actions";
import type { Product, Category, ProductLink } from "@/types/database";

interface ProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product?: (Product & { product_links?: ProductLink[] }) | null;
    categories: Category[];
}

interface StoreOfferItem {
    id?: string;
    store_name: string;
    affiliate_url: string;
    price: string;
    coupon_code: string;
}

const COMMON_STORES = [
    "Amazon",
    "Shopee",
    "Mercado Livre",
    "AliExpress",
    "Magalu",
    "Kabum",
] as const;

function formatPriceInput(val: number): string {
    return val.toFixed(2).replace(".", ",");
}

export function ProductDialog({
    isOpen,
    onClose,
    product,
    categories,
}: ProductDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

    // Campos do Produto Geral
    const [name, setName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [description, setDescription] = useState("");

    // Autopreenchimento Open Graph
    const [autoFillUrl, setAutoFillUrl] = useState("");
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [fetchingPriceIdx, setFetchingPriceIdx] = useState<number | null>(null);

    // Ofertas Multi-Loja
    const [stores, setStores] = useState<StoreOfferItem[]>([
        {
            store_name: "Amazon",
            affiliate_url: "",
            price: "",
            coupon_code: "",
        },
    ]);

    const isEditing = Boolean(product?.id);

    useEffect(() => {
        if (product) {
            setName(product.name || "");
            setCategoryId(product.category_id || "");
            setImageUrl(product.image_url || "");
            setDescription(product.description || "");
            setAutoFillUrl("");

            // Inicialização das ofertas multi-loja
            if (product.product_links && product.product_links.length > 0) {
                setStores(
                    product.product_links.map((link) => {
                        const effectivePrice =
                            link.discount_price != null
                                ? formatPriceInput(link.discount_price)
                                : link.regular_price != null
                                ? formatPriceInput(link.regular_price)
                                : "";

                        return {
                            id: link.id,
                            store_name: link.store_name,
                            affiliate_url: link.affiliate_url,
                            price: effectivePrice,
                            coupon_code: link.coupon_code || "",
                        };
                    }),
                );
            } else {
                const effectivePrice =
                    product.discount_price != null
                        ? formatPriceInput(product.discount_price)
                        : product.regular_price != null
                        ? formatPriceInput(product.regular_price)
                        : "";

                setStores([
                    {
                        store_name: product.store_name || "Amazon",
                        affiliate_url: product.affiliate_url || "",
                        price: effectivePrice,
                        coupon_code: product.coupon_code || "",
                    },
                ]);
            }
        } else {
            setName("");
            setCategoryId(categories[0]?.id || "");
            setImageUrl("");
            setDescription("");
            setAutoFillUrl("");
            setStores([
                {
                    store_name: "Amazon",
                    affiliate_url: "",
                    price: "",
                    coupon_code: "",
                },
            ]);
        }
        setErrorMessage(null);
        setSuccessFeedback(null);
    }, [product, isOpen, categories]);

    if (!isOpen) return null;

    // Ação de autopreenchimento com Open Graph
    const handleAutoFill = async () => {
        if (!autoFillUrl || !autoFillUrl.trim()) {
            setErrorMessage("Informe uma URL para autopreencher os dados.");
            return;
        }

        setIsAutoFilling(true);
        setErrorMessage(null);
        setSuccessFeedback(null);

        try {
            const res = await fetch("/api/admin/extract-og", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: autoFillUrl.trim() }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                setErrorMessage(
                    json.error ||
                        "Não foi possível extrair os metadados da URL.",
                );
                setIsAutoFilling(false);
                return;
            }

            const data = json.data;

            if (data.title) {
                setName(data.title);
            }

            if (data.image) {
                setImageUrl(data.image);
            }

            // Atualiza a primeira loja com a URL e o nome da loja detectados (sem alterar preços)
            setStores((prevStores) => {
                const next = [...prevStores];
                if (next.length > 0) {
                    const currentStore = next[0];
                    next[0] = {
                        ...currentStore,
                        affiliate_url: autoFillUrl.trim(),
                        store_name: data.store || currentStore.store_name,
                    };
                }
                return next;
            });

            if (data.title || data.image) {
                setSuccessFeedback(
                    "Dados e fotos do produto preenchidos com sucesso! Você pode puxar o preço no card da loja correspondente.",
                );
            } else {
                setErrorMessage(
                    "Loja identificada, mas o título e a imagem não puderam ser extraídos da página. Preencha os campos restantes manualmente.",
                );
            }
        } catch {
            setErrorMessage("Erro ao consultar serviço de extração de dados.");
        } finally {
            setIsAutoFilling(false);
        }
    };

    // Puxa o preço específico para a loja/link indicado
    const handleFetchStorePrice = async (idx: number) => {
        const store = stores[idx];
        if (!store || !store.affiliate_url || !store.affiliate_url.trim()) {
            setErrorMessage(
                "Informe o link de afiliado da loja para puxar o preço.",
            );
            return;
        }

        setFetchingPriceIdx(idx);
        setErrorMessage(null);
        setSuccessFeedback(null);

        try {
            const res = await fetch("/api/admin/extract-og", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: store.affiliate_url.trim() }),
            });

            const json = await res.json();
            if (!res.ok || !json.success) {
                setErrorMessage(
                    json.error ||
                        "Não foi possível obter o preço a partir do link desta loja.",
                );
                return;
            }

            const data = json.data;
            const extractedPrice = data.price ?? data.regularPrice;

            if (extractedPrice != null) {
                setStores((prev) => {
                    const next = [...prev];
                    if (next[idx]) {
                        next[idx] = {
                            ...next[idx],
                            price: formatPriceInput(extractedPrice),
                            store_name:
                                !next[idx].store_name ||
                                next[idx].store_name === "Amazon"
                                    ? data.store || next[idx].store_name
                                    : next[idx].store_name,
                        };
                    }
                    return next;
                });
                setSuccessFeedback(
                    `Preço atualizado com sucesso para a loja "${data.store || store.store_name}"!`,
                );
            } else {
                setErrorMessage(
                    "O preço não pôde ser identificado automaticamente neste link. Informe o valor manualmente.",
                );
            }
        } catch {
            setErrorMessage(
                "Erro ao consultar serviço de extração de dados da oferta.",
            );
        } finally {
            setFetchingPriceIdx(null);
        }
    };

    // Gerenciamento de linhas de lojas
    const handleAddStore = () => {
        setStores((prev) => [
            ...prev,
            {
                store_name: "Shopee",
                affiliate_url: "",
                price: "",
                coupon_code: "",
            },
        ]);
    };

    const handleRemoveStore = (index: number) => {
        if (stores.length <= 1) return;
        setStores((prev) => prev.filter((_, i) => i !== index));
    };

    const handleStoreChange = (
        index: number,
        field: keyof StoreOfferItem,
        value: string,
    ) => {
        setStores((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validação da lista de lojas
        for (let i = 0; i < stores.length; i++) {
            const item = stores[i];
            if (!item.store_name.trim()) {
                setErrorMessage(
                    `A loja parceira da oferta ${i + 1} é obrigatória.`,
                );
                return;
            }
            if (!item.affiliate_url.trim()) {
                setErrorMessage(
                    `O link de afiliado para a loja "${item.store_name}" é obrigatório.`,
                );
                return;
            }
        }

        const formData = new FormData();
        formData.set("name", name);
        formData.set("category_id", categoryId);
        formData.set("image_url", imageUrl);
        formData.set("description", description);
        formData.set("store_links", JSON.stringify(stores));

        // Campos mapeados a partir da loja principal (primeira da lista)
        if (stores.length > 0) {
            formData.set("store_name", stores[0].store_name);
            formData.set("affiliate_url", stores[0].affiliate_url);
            formData.set("price", stores[0].price);
            formData.set("discount_price", stores[0].price);
            formData.set("coupon_code", stores[0].coupon_code);
        }

        startTransition(async () => {
            const res =
                isEditing && product?.id
                    ? await updateProductAction(
                          product.id,
                          { success: false },
                          formData,
                      )
                    : await createProductAction({ success: false }, formData);

            if (res.success) {
                onClose();
            } else {
                setErrorMessage(res.error || "Erro ao salvar produto.");
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {isEditing
                                ? "Editar Produto e Ofertas"
                                : "Novo Produto Afiliado"}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Cadastre dados gerais e múltiplas lojas parceiras
                            para comparação.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar janela"
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {errorMessage && (
                    <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs border border-red-200 dark:border-red-900">
                        {errorMessage}
                    </div>
                )}

                {successFeedback && (
                    <div className="mt-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800">
                        {successFeedback}
                    </div>
                )}

                {/* Bloco de Autopreenchimento de Metadados Open Graph */}
                <div className="mt-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
                    <label
                        htmlFor="autofill-url"
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
                        <span>Autopreencher Dados por Link</span>
                    </label>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
                        Cole o link da página do produto para preencher título,
                        imagem e loja automaticamente.
                    </p>
                    <div className="flex gap-2">
                        <input
                            id="autofill-url"
                            type="url"
                            value={autoFillUrl}
                            onChange={(e) => setAutoFillUrl(e.target.value)}
                            placeholder="Cole a URL do produto ou link de parceiro..."
                            className="flex-1 font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={isAutoFilling || !autoFillUrl.trim()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-primary text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0 shadow-xs"
                        >
                            {isAutoFilling ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            <span>Autopreencher</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Informações Gerais do Produto */}
                    <div className="space-y-3">
                        <div>
                            <label
                                htmlFor="prod-name"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Nome do Produto *
                            </label>
                            <input
                                id="prod-name"
                                type="text"
                                required
                                maxLength={255}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Fone Bluetooth com Cancelamento de Ruído"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label
                                    htmlFor="prod-cat"
                                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                >
                                    Categoria Temática
                                </label>
                                <select
                                    id="prod-cat"
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                >
                                    <option value="">Sem categoria</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="prod-image-url"
                                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                                >
                                    URL da Imagem do Produto *
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        id="prod-image-url"
                                        type="url"
                                        required
                                        value={imageUrl}
                                        onChange={(e) =>
                                            setImageUrl(e.target.value)
                                        }
                                        placeholder="https://.../imagem.jpg"
                                        className="flex-1 font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                    />
                                    {imageUrl ? (
                                        <div className="h-9 w-9 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imageUrl}
                                                alt="Prévia"
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.display = "none";
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-9 w-9 shrink-0 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                                            <ImageIcon className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="prod-desc"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Descrição
                            </label>
                            <textarea
                                id="prod-desc"
                                rows={2}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Destaques do produto ou motivo da recomendação..."
                                className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>
                    </div>

                    {/* Seção de Lojas Parceiras e Ofertas Multi-Loja */}
                    <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                                    <Store className="h-4 w-4 text-brand-primary" />
                                    <span>
                                        Lojas Parceiras e Ofertas (
                                        {stores.length})
                                    </span>
                                </h3>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    A primeira loja é exibida como destaque
                                    principal na vitrine.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleAddStore}
                                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Adicionar Loja</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {stores.map((store, idx) => (
                                <div
                                    key={idx}
                                    className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-800/40 relative space-y-3"
                                >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                                                {idx === 0
                                                    ? "Loja Principal"
                                                    : `Loja Adicional ${idx + 1}`}
                                            </span>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={
                                                        fetchingPriceIdx === idx ||
                                                        !store.affiliate_url.trim()
                                                    }
                                                    onClick={() =>
                                                        handleFetchStorePrice(idx)
                                                    }
                                                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                                                    title={
                                                        store.affiliate_url.trim()
                                                            ? "Puxar preço desta loja parceira"
                                                            : "Cole o link de afiliado para puxar o preço"
                                                    }
                                                >
                                                    {fetchingPriceIdx === idx ? (
                                                        <Loader2 className="h-3 w-3 animate-spin text-zinc-500" />
                                                    ) : (
                                                        <Sparkles className="h-3 w-3 text-amber-500" />
                                                    )}
                                                    <span>Puxar Preço</span>
                                                </button>

                                                {stores.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleRemoveStore(idx)
                                                        }
                                                        className="text-zinc-400 hover:text-red-500 p-1 rounded-md transition-colors"
                                                        title="Remover esta loja parceira"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Nome da Loja e Link de Afiliado */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Loja Parceira *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    maxLength={100}
                                                    value={store.store_name}
                                                    onChange={(e) =>
                                                        handleStoreChange(
                                                            idx,
                                                            "store_name",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ex: Nome da Loja"
                                                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                                />
                                                {/* Sugestões rápidas */}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {COMMON_STORES.slice(
                                                        0,
                                                        4,
                                                    ).map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() =>
                                                                handleStoreChange(
                                                                    idx,
                                                                    "store_name",
                                                                    s,
                                                                )
                                                            }
                                                            className="text-[9px] px-1 py-0.5 rounded bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Link de Afiliado /
                                                    Redirecionamento *
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="url"
                                                        required
                                                        value={
                                                            store.affiliate_url
                                                        }
                                                        onChange={(e) =>
                                                            handleStoreChange(
                                                                idx,
                                                                "affiliate_url",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Cole o link de afiliado ou parceiro..."
                                                        className="w-full font-mono text-xs px-2.5 py-1.5 pr-7 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                                    />
                                                    {store.affiliate_url && (
                                                        <a
                                                            href={
                                                                store.affiliate_url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                                            title="Testar link"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preço e Cupom */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                            <div>
                                                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Preço (R$)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={store.price}
                                                    onChange={(e) =>
                                                        handleStoreChange(
                                                            idx,
                                                            "price",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="149,90"
                                                    className="w-full font-mono text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                                    Cupom (Opcional)
                                                </label>
                                                <div className="relative">
                                                    <Tag className="absolute left-2.5 top-2 h-3 w-3 text-zinc-400" />
                                                    <input
                                                        type="text"
                                                        maxLength={100}
                                                        value={
                                                            store.coupon_code
                                                        }
                                                        onChange={(e) =>
                                                            handleStoreChange(
                                                                idx,
                                                                "coupon_code",
                                                                e.target.value.toUpperCase(),
                                                            )
                                                        }
                                                        placeholder="PROMO10"
                                                        className="w-full font-mono text-xs pl-7 pr-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* Botões de Ação */}
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
                                ? "Salvar Alterações"
                                : "Cadastrar Produto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
