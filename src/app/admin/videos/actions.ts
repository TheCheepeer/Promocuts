"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { parseVideoUrl } from "@/lib/embeds/parser";
import { slugify } from "@/lib/formatters";
import { invalidateFeedCache } from "@/lib/cache/redis";
import { logger } from "@/lib/logger";

export interface VideoActionState {
    success: boolean;
    error?: string;
    message?: string;
}

export interface VideoProductInput {
    productId: string;
    displayOrder: number;
}

/**
 * Server Action para criacao de corte de video e vinculacao de produtos afiliados.
 */
export async function createVideoAction(
    _prevState: VideoActionState,
    formData: FormData,
    products: VideoProductInput[],
): Promise<VideoActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawUrl = formData.get("original_url");
        const rawTitle = formData.get("title");
        const rawSlug = formData.get("slug");
        const rawCategoryId = formData.get("category_id");
        const rawDescription = formData.get("description");
        const rawThumbnailUrl = formData.get("thumbnail_url");
        const rawIsPublished = formData.get("is_published");
        const rawIsFeatured = formData.get("is_featured");
        const rawOrderWeight = formData.get("order_weight");

        const originalUrl = typeof rawUrl === "string" ? rawUrl.trim() : "";
        if (!originalUrl) {
            return {
                success: false,
                error: "A URL original do video e obrigatoria.",
            };
        }

        // Executa o motor de parsing de embeds
        const embedConfig = parseVideoUrl(originalUrl);
        if (!embedConfig) {
            return {
                success: false,
                error: "URL não reconhecida. Informe um link válido de uma das plataformas de vídeo suportadas.",
            };
        }

        const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
        if (!title || title.length > 255) {
            return {
                success: false,
                error: "O titulo do video e obrigatorio (ate 255 caracteres).",
            };
        }

        let slug =
            typeof rawSlug === "string" && rawSlug.trim() !== ""
                ? slugify(rawSlug.trim())
                : slugify(title);

        if (!slug) {
            slug = `video-${Date.now()}`;
        }

        // Checa unicidade de slug
        const { data: existingSlug } = await adminDb
            .from("videos")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existingSlug) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }

        const categoryId =
            typeof rawCategoryId === "string" && rawCategoryId.trim() !== ""
                ? rawCategoryId.trim()
                : null;

        const description =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim()
                : null;

        const thumbnailUrl =
            typeof rawThumbnailUrl === "string" && rawThumbnailUrl.trim() !== ""
                ? rawThumbnailUrl.trim()
                : null;

        const isPublished =
            rawIsPublished === "true" || rawIsPublished === "on";
        const isFeatured = rawIsFeatured === "true" || rawIsFeatured === "on";
        const orderWeight =
            typeof rawOrderWeight === "string"
                ? parseInt(rawOrderWeight, 10) || 0
                : 0;

        // Insere o video
        const { data: insertedVideo, error: videoError } = await adminDb
            .from("videos")
            .insert({
                title,
                slug,
                description,
                platform: embedConfig.platform,
                original_url: originalUrl,
                platform_video_id: embedConfig.platformVideoId,
                thumbnail_url: thumbnailUrl,
                category_id: categoryId,
                is_published: isPublished,
                is_featured: isFeatured,
                order_weight: orderWeight,
            })
            .select("id")
            .single();

        if (videoError || !insertedVideo) {
            logger.error("Erro ao gravar video no banco", {
                erro: videoError?.message,
            });
            return {
                success: false,
                error: "Falha ao gravar o video no banco de dados.",
            };
        }

        // Vincula os produtos recomendados
        if (products && products.length > 0) {
            const videoProductsData = products.map((p, idx) => ({
                video_id: insertedVideo.id,
                product_id: p.productId,
                display_order: p.displayOrder ?? idx,
            }));

            const { error: relError } = await adminDb
                .from("video_products")
                .insert(videoProductsData);

            if (relError) {
                logger.error("Erro ao vincular produtos ao video", {
                    erro: relError.message,
                });
            }
        }

        revalidatePath("/admin/videos");
        revalidatePath("/");
        revalidatePath(`/v/${slug}`);
        if (categoryId) revalidatePath(`/c/${categoryId}`);
        await invalidateFeedCache();

        return {
            success: true,
            message: "Corte de video cadastrado com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao ao criar video", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao cadastrar corte de video.",
        };
    }
}

/**
 * Server Action para edicao de video e atualizacao dos produtos recomendados.
 */
export async function updateVideoAction(
    id: string,
    _prevState: VideoActionState,
    formData: FormData,
    products: VideoProductInput[],
): Promise<VideoActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        if (!id) {
            return { success: false, error: "Identificador do video ausente." };
        }

        const rawUrl = formData.get("original_url");
        const rawTitle = formData.get("title");
        const rawSlug = formData.get("slug");
        const rawCategoryId = formData.get("category_id");
        const rawDescription = formData.get("description");
        const rawThumbnailUrl = formData.get("thumbnail_url");
        const rawIsPublished = formData.get("is_published");
        const rawIsFeatured = formData.get("is_featured");
        const rawOrderWeight = formData.get("order_weight");

        const originalUrl = typeof rawUrl === "string" ? rawUrl.trim() : "";
        if (!originalUrl) {
            return { success: false, error: "A URL original e obrigatoria." };
        }

        const embedConfig = parseVideoUrl(originalUrl);
        if (!embedConfig) {
            return {
                success: false,
                error: "URL não reconhecida como uma das plataformas de vídeo suportadas.",
            };
        }

        const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
        if (!title || title.length > 255) {
            return {
                success: false,
                error: "O titulo e obrigatorio (ate 255 caracteres).",
            };
        }

        let slug =
            typeof rawSlug === "string" && rawSlug.trim() !== ""
                ? slugify(rawSlug.trim())
                : slugify(title);

        if (!slug) {
            slug = `video-${Date.now()}`;
        }

        // Checa unicidade excluindo o proprio video
        const { data: existingSlug } = await adminDb
            .from("videos")
            .select("id")
            .eq("slug", slug)
            .neq("id", id)
            .maybeSingle();

        if (existingSlug) {
            return {
                success: false,
                error: `Ja existe outro video com o slug "${slug}".`,
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

        const thumbnailUrl =
            typeof rawThumbnailUrl === "string" && rawThumbnailUrl.trim() !== ""
                ? rawThumbnailUrl.trim()
                : null;

        const isPublished =
            rawIsPublished === "true" || rawIsPublished === "on";
        const isFeatured = rawIsFeatured === "true" || rawIsFeatured === "on";
        const orderWeight =
            typeof rawOrderWeight === "string"
                ? parseInt(rawOrderWeight, 10) || 0
                : 0;

        const { error: updateError } = await adminDb
            .from("videos")
            .update({
                title,
                slug,
                description,
                platform: embedConfig.platform,
                original_url: originalUrl,
                platform_video_id: embedConfig.platformVideoId,
                thumbnail_url: thumbnailUrl,
                category_id: categoryId,
                is_published: isPublished,
                is_featured: isFeatured,
                order_weight: orderWeight,
            })
            .eq("id", id);

        if (updateError) {
            logger.error("Erro ao atualizar video", {
                erro: updateError.message,
            });
            return {
                success: false,
                error: "Falha ao salvar alteracoes do video.",
            };
        }

        // Atualiza a lista de associacoes: remove associacoes antigas e insere as novas
        await adminDb.from("video_products").delete().eq("video_id", id);

        if (products && products.length > 0) {
            const videoProductsData = products.map((p, idx) => ({
                video_id: id,
                product_id: p.productId,
                display_order: p.displayOrder ?? idx,
            }));

            await adminDb.from("video_products").insert(videoProductsData);
        }

        revalidatePath("/admin/videos");
        revalidatePath("/");
        revalidatePath(`/v/${slug}`);
        await invalidateFeedCache();

        return { success: true, message: "Video atualizado com sucesso." };
    } catch (err) {
        logger.error("Excecao na atualizacao de video", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao atualizar video.",
        };
    }
}

/**
 * Server Action para alternancia rapida do status de publicacao.
 */
export async function toggleVideoPublishedAction(
    id: string,
    isPublished: boolean,
): Promise<VideoActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb
            .from("videos")
            .update({ is_published: isPublished })
            .eq("id", id);

        if (error) {
            return {
                success: false,
                error: "Nao foi possivel alterar status de publicacao.",
            };
        }

        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return {
            success: true,
            message: isPublished
                ? "Video publicado."
                : "Video movido para rascunho.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Falha na operacao.",
        };
    }
}

/**
 * Server Action para alternancia rapida do status de destaque.
 */
export async function toggleVideoFeaturedAction(
    id: string,
    isFeatured: boolean,
): Promise<VideoActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb
            .from("videos")
            .update({ is_featured: isFeatured })
            .eq("id", id);

        if (error) {
            return {
                success: false,
                error: "Nao foi possivel alterar status de destaque.",
            };
        }

        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return {
            success: true,
            message: isFeatured
                ? "Video marcado como destaque."
                : "Destaque removido.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : "Falha na operacao.",
        };
    }
}

/**
 * Server Action para exclusao de corte de video.
 */
export async function deleteVideoAction(id: string): Promise<VideoActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb.from("videos").delete().eq("id", id);

        if (error) {
            return {
                success: false,
                error: "Falha ao excluir corte de video.",
            };
        }

        revalidatePath("/admin/videos");
        revalidatePath("/");
        await invalidateFeedCache();

        return { success: true, message: "Video excluido com sucesso." };
    } catch (err) {
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Falha ao processar exclusao.",
        };
    }
}
