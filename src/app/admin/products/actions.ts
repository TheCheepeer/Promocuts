"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { invalidateFeedCache } from "@/lib/cache/redis";
import { logger } from "@/lib/logger";

export interface ProductActionState {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Valida se uma URL e defensiva e possui protocolo HTTP/HTTPS valido.
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
 * Server Action para criacao de produto afiliado.
 */
export async function createProductAction(
    _prevState: ProductActionState,
    formData: FormData,
): Promise<ProductActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawName = formData.get("name");
        const rawStoreName = formData.get("store_name");
        const rawCategoryId = formData.get("category_id");
        const rawAffiliateUrl = formData.get("affiliate_url");
        const rawImageUrl = formData.get("image_url");
        const rawRegularPrice = formData.get("regular_price");
        const rawDiscountPrice = formData.get("discount_price");
        const rawCouponCode = formData.get("coupon_code");
        const rawDescription = formData.get("description");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 255) {
            return {
                success: false,
                error: "O nome do produto e obrigatorio (ate 255 caracteres).",
            };
        }

        const storeName =
            typeof rawStoreName === "string" ? rawStoreName.trim() : "";
        if (!storeName || storeName.length > 100) {
            return {
                success: false,
                error: "O nome da loja parceira e obrigatorio (ate 100 caracteres).",
            };
        }

        const affiliateUrl =
            typeof rawAffiliateUrl === "string" ? rawAffiliateUrl.trim() : "";
        if (!isValidHttpUrl(affiliateUrl)) {
            return {
                success: false,
                error: "A URL de afiliado deve ser um link web valido iniciado por http:// ou https://.",
            };
        }

        const imageUrl =
            typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";
        if (!isValidHttpUrl(imageUrl)) {
            return {
                success: false,
                error: "A URL da imagem do produto deve ser um link web valido iniciado por http:// ou https://.",
            };
        }

        const categoryId =
            typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
                ? rawCategoryId.trim()
                : null;

        const parsePrice = (val: FormDataEntryValue | null): number | null => {
            if (!val || typeof val !== "string" || val.trim() === "")
                return null;
            const normalized = val.replace(/\./g, "").replace(",", ".").trim();
            const num = parseFloat(normalized);
            return isNaN(num) || num < 0 ? null : Math.round(num * 100) / 100;
        };

        const regularPrice = parsePrice(rawRegularPrice);
        const discountPrice = parsePrice(rawDiscountPrice);

        const couponCode =
            typeof rawCouponCode === "string" && rawCouponCode.trim() !== ""
                ? rawCouponCode.trim().toUpperCase()
                : null;

        const description =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim()
                : null;

        const { error: insertError } = await adminDb.from("products").insert({
            name,
            store_name: storeName,
            category_id: categoryId,
            affiliate_url: affiliateUrl,
            image_url: imageUrl,
            regular_price: regularPrice,
            discount_price: discountPrice,
            currency: "BRL",
            coupon_code: couponCode,
            description,
        });

        if (insertError) {
            logger.error("Erro ao inserir produto afiliado", {
                erro: insertError.message,
            });
            return {
                success: false,
                error: "Falha ao gravar o produto no banco de dados.",
            };
        }

        revalidatePath("/admin/products");
        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return {
            success: true,
            message: "Produto afiliado cadastrado com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao na criacao de produto", {
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
 * Server Action para atualizacao de produto existente.
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
        const rawStoreName = formData.get("store_name");
        const rawCategoryId = formData.get("category_id");
        const rawAffiliateUrl = formData.get("affiliate_url");
        const rawImageUrl = formData.get("image_url");
        const rawRegularPrice = formData.get("regular_price");
        const rawDiscountPrice = formData.get("discount_price");
        const rawCouponCode = formData.get("coupon_code");
        const rawDescription = formData.get("description");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 255) {
            return {
                success: false,
                error: "O nome do produto e obrigatorio (ate 255 caracteres).",
            };
        }

        const storeName =
            typeof rawStoreName === "string" ? rawStoreName.trim() : "";
        if (!storeName || storeName.length > 100) {
            return {
                success: false,
                error: "O nome da loja parceira e obrigatorio (ate 100 caracteres).",
            };
        }

        const affiliateUrl =
            typeof rawAffiliateUrl === "string" ? rawAffiliateUrl.trim() : "";
        if (!isValidHttpUrl(affiliateUrl)) {
            return { success: false, error: "URL de afiliado invalida." };
        }

        const imageUrl =
            typeof rawImageUrl === "string" ? rawImageUrl.trim() : "";
        if (!isValidHttpUrl(imageUrl)) {
            return { success: false, error: "URL da imagem invalida." };
        }

        const categoryId =
            typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
                ? rawCategoryId.trim()
                : null;

        const parsePrice = (val: FormDataEntryValue | null): number | null => {
            if (!val || typeof val !== "string" || val.trim() === "")
                return null;
            const normalized = val.replace(/\./g, "").replace(",", ".").trim();
            const num = parseFloat(normalized);
            return isNaN(num) || num < 0 ? null : Math.round(num * 100) / 100;
        };

        const regularPrice = parsePrice(rawRegularPrice);
        const discountPrice = parsePrice(rawDiscountPrice);

        const couponCode =
            typeof rawCouponCode === "string" && rawCouponCode.trim() !== ""
                ? rawCouponCode.trim().toUpperCase()
                : null;

        const description =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim()
                : null;

        const { error: updateError } = await adminDb
            .from("products")
            .update({
                name,
                store_name: storeName,
                category_id: categoryId,
                affiliate_url: affiliateUrl,
                image_url: imageUrl,
                regular_price: regularPrice,
                discount_price: discountPrice,
                coupon_code: couponCode,
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

        revalidatePath("/admin/products");
        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return { success: true, message: "Produto atualizado com sucesso." };
    } catch (err) {
        logger.error("Excecao na edicao de produto", {
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
 * Server Action para exclusao de produto.
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

        return { success: true, message: "Produto excluido com sucesso." };
    } catch (err) {
        logger.error("Excecao na exclusao de produto", {
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
