"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink, Tag } from "lucide-react";
import { formatCurrency, formatDiscountBadge } from "@/lib/formatters";
import { trackAffiliateClick } from "@/lib/telemetry";
import type { Product } from "@/types/database";

interface ProductCardProps {
    product: Product;
    videoId?: string;
    compact?: boolean;
    className?: string;
}

export function ProductCard({
    product,
    videoId,
    compact = false,
    className = "",
}: ProductCardProps) {
    const [copied, setCopied] = useState(false);
    const [imgError, setImgError] = useState(false);

    const discountBadge = formatDiscountBadge(
        product.regular_price,
        product.discount_price,
    );

    const displayPrice =
        product.discount_price !== null && product.discount_price !== undefined
            ? product.discount_price
            : product.regular_price;

    const hasDiscount =
        product.regular_price &&
        product.discount_price &&
        product.discount_price < product.regular_price;

    const handleCopyCoupon = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!product.coupon_code) return;

        trackAffiliateClick(product.id, videoId);
        navigator.clipboard.writeText(product.coupon_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (compact) {
        return (
            <div
                className={`flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/95 p-2.5 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/95 ${className}`}
            >
                {/* Miniatura do Produto */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <img
                        src={
                            imgError || !product.image_url
                                ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ccc'><rect width='100' height='100'/></svg>"
                                : product.image_url
                        }
                        alt={product.name}
                        onError={() => setImgError(true)}
                        className="h-full w-full object-cover"
                    />
                </div>

                {/* Informacoes de Nome e Preco */}
                <div className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {product.store_name}
                    </span>
                    <h4 className="line-clamp-1 text-xs font-bold text-zinc-900 dark:text-zinc-50">
                        {product.name}
                    </h4>

                    <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-sm font-black text-brand-primary tabular-nums">
                            {formatCurrency(displayPrice)}
                        </span>
                        {hasDiscount && (
                            <span className="text-[11px] text-zinc-400 line-through dark:text-zinc-500 tabular-nums">
                                {formatCurrency(product.regular_price)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Botao de Compra Rapida */}
                <a
                    href={product.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    onClick={() => trackAffiliateClick(product.id, videoId)}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-primary px-3 py-2 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95"
                    title={`Ver ${product.name} na ${product.store_name}`}
                >
                    <span>Comprar</span>
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
            </div>
        );
    }

    return (
        <div
            className={`flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-xs transition-colors dark:border-zinc-800/80 dark:bg-zinc-900/90 ${className}`}
        >
            <div className="flex gap-3.5">
                {/* Miniatura do Produto */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                    <img
                        src={
                            imgError || !product.image_url
                                ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23ccc'><rect width='100' height='100'/></svg>"
                                : product.image_url
                        }
                        alt={product.name}
                        onError={() => setImgError(true)}
                        className="h-full w-full object-cover"
                    />
                    {discountBadge && (
                        <span className="absolute top-1 left-1 rounded-md bg-brand-primary px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                            {discountBadge}
                        </span>
                    )}
                </div>

                {/* Dados do Produto */}
                <div className="min-w-0 flex-1">
                    <span className="inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {product.store_name}
                    </span>

                    <h4 className="mt-1 line-clamp-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {product.name}
                    </h4>

                    {/* Precos formatados com tipografia tabular */}
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="font-mono text-base font-extrabold text-brand-primary tabular-nums">
                            {formatCurrency(displayPrice)}
                        </span>
                        {hasDiscount && (
                            <span className="font-mono text-xs text-zinc-400 line-through dark:text-zinc-500 tabular-nums">
                                {formatCurrency(product.regular_price)}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Cupom Promocional (quando disponivel) */}
            {product.coupon_code && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                        <Tag className="h-3.5 w-3.5 text-brand-primary" />
                        <span className="text-[11px] font-medium">Cupom:</span>
                        <code className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {product.coupon_code}
                        </code>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyCoupon}
                        className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3 text-brand-primary" />
                                <span className="text-brand-primary font-bold">
                                    Copiado
                                </span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" />
                                <span>Copiar</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Botao de Acao Primario */}
            <a
                href={product.affiliate_url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackAffiliateClick(product.id, videoId)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-primary py-2.5 text-xs font-bold text-white shadow-xs transition-opacity hover:opacity-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
                <span>Comprar com Desconto</span>
                <ExternalLink className="h-3.5 w-3.5" />
            </a>
        </div>
    );
}
