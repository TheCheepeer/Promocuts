"use client";

import React, { useState, useEffect, useTransition } from "react";
import { X, Loader2, Image as ImageIcon, Tag, Percent } from "lucide-react";
import { createProductAction, updateProductAction } from "./actions";
import {
    formatDiscountPercentage,
    formatDiscountBadge,
} from "@/lib/formatters";
import type { Product, Category } from "@/types/database";

interface ProductDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null;
    categories: Category[];
}

const COMMON_STORES = [
    "Amazon",
    "Shopee",
    "Mercado Livre",
    "AliExpress",
    "Magalu",
    "Kabum",
] as const;

export function ProductDialog({
    isOpen,
    onClose,
    product,
    categories,
}: ProductDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [storeName, setStoreName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [affiliateUrl, setAffiliateUrl] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [regularPrice, setRegularPrice] = useState("");
    const [discountPrice, setDiscountPrice] = useState("");
    const [couponCode, setCouponCode] = useState("");
    const [description, setDescription] = useState("");

    const isEditing = Boolean(product?.id);

    useEffect(() => {
        if (product) {
            setName(product.name || "");
            setStoreName(product.store_name || "");
            setCategoryId(product.category_id || "");
            setAffiliateUrl(product.affiliate_url || "");
            setImageUrl(product.image_url || "");
            setRegularPrice(
                product.regular_price != null
                    ? String(product.regular_price)
                    : "",
            );
            setDiscountPrice(
                product.discount_price != null
                    ? String(product.discount_price)
                    : "",
            );
            setCouponCode(product.coupon_code || "");
            setDescription(product.description || "");
        } else {
            setName("");
            setStoreName("Amazon");
            setCategoryId(categories[0]?.id || "");
            setAffiliateUrl("");
            setImageUrl("");
            setRegularPrice("");
            setDiscountPrice("");
            setCouponCode("");
            setDescription("");
        }
        setErrorMessage(null);
    }, [product, isOpen, categories]);

    if (!isOpen) return null;

    // Calculo dinamico de desconto para feedback em tempo real
    const regNum = parseFloat(regularPrice.replace(",", "."));
    const discNum = parseFloat(discountPrice.replace(",", "."));
    const discountPct =
        !isNaN(regNum) && !isNaN(discNum)
            ? formatDiscountPercentage(regNum, discNum)
            : 0;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage(null);

        const formData = new FormData();
        formData.set("name", name);
        formData.set("store_name", storeName);
        formData.set("category_id", categoryId);
        formData.set("affiliate_url", affiliateUrl);
        formData.set("image_url", imageUrl);
        formData.set("regular_price", regularPrice);
        formData.set("discount_price", discountPrice);
        formData.set("coupon_code", couponCode);
        formData.set("description", description);

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
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {isEditing
                                ? "Editar Produto Afiliado"
                                : "Novo Produto Afiliado"}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Cadastre o link de recomendacao e precos
                            promocionais.
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
                    {/* Nome do Produto */}
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
                            placeholder="Ex: Fone Bluetooth com Cancelamento de Ruido"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* Categoria e Loja Parceira */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="prod-cat"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Categoria Tematica
                            </label>
                            <select
                                id="prod-cat"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
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
                                htmlFor="prod-store"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Loja Parceira *
                            </label>
                            <input
                                id="prod-store"
                                type="text"
                                required
                                maxLength={100}
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="Ex: Amazon, Shopee..."
                                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                            {/* Sugestoes Rapidas */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                {COMMON_STORES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStoreName(s)}
                                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* URL de Afiliado */}
                    <div>
                        <label
                            htmlFor="prod-affiliate-url"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Link de Afiliado / Redirecionamento *
                        </label>
                        <input
                            id="prod-affiliate-url"
                            type="url"
                            required
                            value={affiliateUrl}
                            onChange={(e) => setAffiliateUrl(e.target.value)}
                            placeholder="https://amzn.to/... ou https://shope.ee/..."
                            className="w-full font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">
                            Link com o seu codigo de comissao de parceiro.
                        </p>
                    </div>

                    {/* URL da Imagem com Preview */}
                    <div>
                        <label
                            htmlFor="prod-image-url"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            URL da Imagem do Produto *
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                id="prod-image-url"
                                type="url"
                                required
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://m.media-amazon.com/images/..."
                                className="flex-1 font-mono text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />

                            {imageUrl ? (
                                <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt="Preview do produto"
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (
                                                e.currentTarget as HTMLElement
                                            ).style.display = "none";
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="h-10 w-10 shrink-0 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-zinc-400">
                                    <ImageIcon className="h-4 w-4" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Precos: Regular e Promocional */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800">
                        <div>
                            <label
                                htmlFor="prod-reg-price"
                                className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                            >
                                Preco Original (R$)
                            </label>
                            <input
                                id="prod-reg-price"
                                type="text"
                                value={regularPrice}
                                onChange={(e) =>
                                    setRegularPrice(e.target.value)
                                }
                                placeholder="Ex: 199,90"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label
                                    htmlFor="prod-disc-price"
                                    className="block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Preco Promocional (R$)
                                </label>
                                {discountPct > 0 && (
                                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        <Percent className="h-2.5 w-2.5" />
                                        {formatDiscountBadge(regNum, discNum)}
                                    </span>
                                )}
                            </div>
                            <input
                                id="prod-disc-price"
                                type="text"
                                value={discountPrice}
                                onChange={(e) =>
                                    setDiscountPrice(e.target.value)
                                }
                                placeholder="Ex: 149,90"
                                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>
                    </div>

                    {/* Cupom de Desconto */}
                    <div>
                        <label
                            htmlFor="prod-coupon"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Cupom Promocional (Opcional)
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                            <input
                                id="prod-coupon"
                                type="text"
                                maxLength={100}
                                value={couponCode}
                                onChange={(e) =>
                                    setCouponCode(e.target.value.toUpperCase())
                                }
                                placeholder="PROMO10, 20OFF..."
                                className="w-full font-mono text-xs pl-9 pr-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                        </div>
                    </div>

                    {/* Descricao Curta */}
                    <div>
                        <label
                            htmlFor="prod-desc"
                            className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Diferenciais / Descricao Curta
                        </label>
                        <textarea
                            id="prod-desc"
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Destaques do produto ou motivo da indicacao..."
                            className="w-full text-xs px-3 py-2 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                    </div>

                    {/* Botoes de Acao */}
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
                                : "Cadastrar Produto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
