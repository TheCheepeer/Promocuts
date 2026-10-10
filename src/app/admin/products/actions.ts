"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { invalidateFeedCache } from "@/lib/cache/redis";
import { auditOfferLinks } from "@/lib/monitoring/link-checker";
import { logger } from "@/lib/logger";
import type { ProductLinkInsert } from "@/types/database";

export interface ProductActionState {
    success: boolean;
    error?: string;
    message?: string;
}

export interface InputStoreLink {
    id?: string;
    store_name: string;
    affiliate_url: string;
    regular_price?: number | string | null;
    discount_price?: number | string | null;
    coupon_code?: string | null;
}

/**
 * Valida se uma URL é defensiva e possui protocolo HTTP/HTTPS válido.
 */
function isValidHttpUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return false;
    }
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Normaliza valores monetários em string para número com duas casas decimais.
 */
function parsePrice(val: unknown): number | null {
    if (val === null || val === undefined) return null;
    if (typeof val === "number") return isNaN(val) || val < 0 ? null : Math.round(val * 100) / 100;
    if (typeof val !== "string" || val.trim() === "") return null;
    const normalized = val.replace(/\./g, "").replace(",", ".").trim();
    const num = parseFloat(normalized);
    return isNaN(num) || num < 0 ? null : Math.round(num * 100) / 100;
}

/**
 * Server Action para criação de produto afiliado com suporte multi-loja.
 */
export async function createProductAction(
    _prevState: ProductActionState,
    formData: FormData,
): Promise<ProductActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawName = formData.get("name");
        const rawCategoryId = formData.get("category_id");
        const rawImageUrl = formData.get("image_url");
        const rawDescription = formData.get("description");
        const rawStoreLinksJson = formData.get("store_links");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 255) {
            return {
                success: false,
                error: "O nome do produto é obrigatório (até 255 caracteres).",
            };
        }

        const imageUrl = typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";
        if (!isValidHttpUrl(imageUrl)) {
            return {
                success: false,
                error: "A URL da imagem do produto deve ser um link válido iniciado por http:// ou https://.",
            };
        }

        const categoryId =
            typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
                ? rawCategoryId.trim()
                : null;

        const description =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim()
                : null;

        // Processamento dos links multi-loja
        let parsedLinks: InputStoreLink[] = [];
        if (typeof rawStoreLinksJson === "string" && rawStoreLinksJson.trim() !== "") {
            try {
                parsedLinks = JSON.parse(rawStoreLinksJson);
            } catch {
                parsedLinks = [];
            }
        }

        // Se nenhum JSON for fornecido, faz fallback para os campos legados isolados
        if (parsedLinks.length === 0) {
            const rawStoreName = formData.get("store_name");
            const rawAffiliateUrl = formData.get("affiliate_url");
            const rawRegularPrice = formData.get("regular_price");
            const rawDiscountPrice = formData.get("discount_price");
            const rawCouponCode = formData.get("coupon_code");

            const storeName = typeof rawStoreName === "string" ? rawStoreName.trim() : "";
            const affiliateUrl = typeof rawAffiliateUrl === "string" ? rawAffiliateUrl.trim() : "";

            if (!storeName || !isValidHttpUrl(affiliateUrl)) {
                return {
                    success: false,
                    error: "É necessário informar ao menos uma loja parceira com link de afiliado válido.",
                };
            }

            parsedLinks.push({
                store_name: storeName,
                affiliate_url: affiliateUrl,
                regular_price: parsePrice(rawRegularPrice),
                discount_price: parsePrice(rawDiscountPrice),
                coupon_code:
                    typeof rawCouponCode === "string" && rawCouponCode.trim() !== ""
                        ? rawCouponCode.trim().toUpperCase()
                        : null,
            });
        }

        // Validação estrita de cada link da lista
        for (const link of parsedLinks) {
            if (!link.store_name || link.store_name.trim().length === 0) {
                return {
                    success: false,
                    error: "Todas as lojas parceiras devem possuir um nome válido.",
                };
            }
            if (!isValidHttpUrl(link.affiliate_url)) {
                return {
                    success: false,
                    error: `A URL de afiliado da loja ${link.store_name} é inválida.`,
                };
            }
        }

        // A primeira loja é gravada nos campos diretos de public.products como padrão
        const primaryLink = parsedLinks[0];
        const primaryRegularPrice = parsePrice(primaryLink.regular_price);
        const primaryDiscountPrice = parsePrice(primaryLink.discount_price);
        const primaryCouponCode =
            primaryLink.coupon_code && typeof primaryLink.coupon_code === "string"
                ? primaryLink.coupon_code.trim().toUpperCase()
                : null;

        // Inserção do produto principal
        const { data: insertedProduct, error: insertError } = await adminDb
            .from("products")
            .insert({
                name,
                store_name: primaryLink.store_name.trim(),
                category_id: categoryId,
                affiliate_url: primaryLink.affiliate_url.trim(),
                image_url: imageUrl,
                regular_price: primaryRegularPrice,
                discount_price: primaryDiscountPrice,
                currency: "BRL",
                coupon_code: primaryCouponCode,
                description,
            })
            .select("id")
            .single();

        if (insertError || !insertedProduct) {
            logger.error("Erro ao inserir produto afiliado", {
                erro: insertError?.message,
            });
            return {
                success: false,
                error: "Falha ao gravar o produto no banco de dados.",
            };
        }

        // Inserção dos links multi-loja na tabela public.product_links
        const linksToInsert: ProductLinkInsert[] = parsedLinks.map((l, idx) => ({
            product_id: insertedProduct.id,
            store_name: l.store_name.trim(),
            affiliate_url: l.affiliate_url.trim(),
            regular_price: parsePrice(l.regular_price),
            discount_price: parsePrice(l.discount_price),
            coupon_code:
                l.coupon_code && typeof l.coupon_code === "string"
                    ? l.coupon_code.trim().toUpperCase()
                    : null,
            display_order: idx,
            is_available: true,
        }));

        const { error: linksError } = await adminDb
            .from("product_links")
            .insert(linksToInsert);

        if (linksError) {
            logger.warn("Aviso ao inserir links multi-loja do produto", {
                erro: linksError.message,
            });
        }

        revalidatePath("/admin/products");
        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return {
            success: true,
            message: "Produto e ofertas cadastrados com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção na criação de produto", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao cadastrar produto.",
        };
    }
}

/**
 * Server Action para atualização de produto existente e suas lojas parceiras.
 */
export async function updateProductAction(
    id: string,
    _prevState: ProductActionState,
    formData: FormData,
): Promise<ProductActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        if (!id) {
            return {
                success: false,
                error: "Identificador de produto ausente.",
            };
        }

        const rawName = formData.get("name");
        const rawCategoryId = formData.get("category_id");
        const rawImageUrl = formData.get("image_url");
        const rawDescription = formData.get("description");
        const rawStoreLinksJson = formData.get("store_links");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 255) {
            return {
                success: false,
                error: "O nome do produto é obrigatório (até 255 caracteres).",
            };
        }

        const imageUrl = typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";
        if (!isValidHttpUrl(imageUrl)) {
            return { success: false, error: "URL da imagem inválida." };
        }

        const categoryId =
            typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
                ? rawCategoryId.trim()
                : null;

        const description =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim()
                : null;

        // Processamento dos links multi-loja
        let parsedLinks: InputStoreLink[] = [];
        if (typeof rawStoreLinksJson === "string" && rawStoreLinksJson.trim() !== "") {
            try {
                parsedLinks = JSON.parse(rawStoreLinksJson);
            } catch {
                parsedLinks = [];
            }
        }

        // Se nenhum link estiver no JSON, faz fallback para os campos legados
        if (parsedLinks.length === 0) {
            const rawStoreName = formData.get("store_name");
            const rawAffiliateUrl = formData.get("affiliate_url");
            const rawRegularPrice = formData.get("regular_price");
            const rawDiscountPrice = formData.get("discount_price");
            const rawCouponCode = formData.get("coupon_code");

            const storeName = typeof rawStoreName === "string" ? rawStoreName.trim() : "";
            const affiliateUrl = typeof rawAffiliateUrl === "string" ? rawAffiliateUrl.trim() : "";

            if (!storeName || !isValidHttpUrl(affiliateUrl)) {
                return {
                    success: false,
                    error: "É necessário informar ao menos uma loja parceira válida.",
                };
            }

            parsedLinks.push({
                store_name: storeName,
                affiliate_url: affiliateUrl,
                regular_price: parsePrice(rawRegularPrice),
                discount_price: parsePrice(rawDiscountPrice),
                coupon_code:
                    typeof rawCouponCode === "string" && rawCouponCode.trim() !== ""
                        ? rawCouponCode.trim().toUpperCase()
                        : null,
            });
        }

        // Validação estrita de cada link
        for (const link of parsedLinks) {
            if (!link.store_name || link.store_name.trim().length === 0) {
                return {
                    success: false,
                    error: "Todas as lojas parceiras devem possuir um nome válido.",
                };
            }
            if (!isValidHttpUrl(link.affiliate_url)) {
                return {
                    success: false,
                    error: `A URL de afiliado da loja ${link.store_name} é inválida.`,
                };
            }
        }

        const primaryLink = parsedLinks[0];
        const primaryRegularPrice = parsePrice(primaryLink.regular_price);
        const primaryDiscountPrice = parsePrice(primaryLink.discount_price);
        const primaryCouponCode =
            primaryLink.coupon_code && typeof primaryLink.coupon_code === "string"
                ? primaryLink.coupon_code.trim().toUpperCase()
                : null;

        // Atualização da tabela products
        const { error: updateError } = await adminDb
            .from("products")
            .update({
                name,
                store_name: primaryLink.store_name.trim(),
                category_id: categoryId,
                affiliate_url: primaryLink.affiliate_url.trim(),
                image_url: imageUrl,
                regular_price: primaryRegularPrice,
                discount_price: primaryDiscountPrice,
                coupon_code: primaryCouponCode,
                description,
            })
            .eq("id", id);

        if (updateError) {
            logger.error("Erro ao atualizar produto", {
                erro: updateError.message,
            });
            return {
                success: false,
                error: "Falha ao atualizar dados do produto.",
            };
        }

        // Sincronização dos links multi-loja: remove os anteriores e recria a lista atualizada
        await adminDb.from("product_links").delete().eq("product_id", id);

        const linksToInsert: ProductLinkInsert[] = parsedLinks.map((l, idx) => ({
            product_id: id,
            store_name: l.store_name.trim(),
            affiliate_url: l.affiliate_url.trim(),
            regular_price: parsePrice(l.regular_price),
            discount_price: parsePrice(l.discount_price),
            coupon_code:
                l.coupon_code && typeof l.coupon_code === "string"
                    ? l.coupon_code.trim().toUpperCase()
                    : null,
            display_order: idx,
            is_available: true,
        }));

        await adminDb.from("product_links").insert(linksToInsert);

        revalidatePath("/admin/products");
        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return { success: true, message: "Produto e ofertas atualizados com sucesso." };
    } catch (err) {
        logger.error("Exceção na edição de produto", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao atualizar produto.",
        };
    }
}

/**
 * Server Action para exclusão de produto.
 */
export async function deleteProductAction(
    id: string,
): Promise<ProductActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        if (!id) {
            return {
                success: false,
                error: "Identificador de produto ausente.",
            };
        }

        const { error: deleteError } = await adminDb
            .from("products")
            .delete()
            .eq("id", id);

        if (deleteError) {
            logger.error("Erro ao excluir produto", {
                erro: deleteError.message,
            });
            return { success: false, error: "Falha ao excluir produto." };
        }

        revalidatePath("/admin/products");
        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return { success: true, message: "Produto excluído com sucesso." };
    } catch (err) {
        logger.error("Exceção na exclusão de produto", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao excluir produto.",
        };
    }
}

/**
 * Server Action para disparo manual da auditoria de links de ofertas no painel.
 */
export async function checkOffersAction(): Promise<ProductActionState> {
    try {
        await requireAdminAuth();
        const summary = await auditOfferLinks(50);

        revalidatePath("/admin/products");

        return {
            success: true,
            message: `Verificação concluída: ${summary.checked} ofertas auditadas (${summary.issues} com alertas detectados).`,
        };
    } catch (err) {
        logger.error("Erro ao disparar verificação de ofertas", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Falha ao auditar links de ofertas.",
        };
    }
}
