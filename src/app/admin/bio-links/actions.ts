"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { invalidateFeedCache } from "@/lib/cache/redis";
import { logger } from "@/lib/logger";
import { isValidUuid } from "@/lib/telemetry";
import type { BioLinkInsert, BioLinkUpdate } from "@/types/database";

export interface BioLinkActionState {
    success: boolean;
    error?: string;
    message?: string;
}

function validateUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

/**
 * Cria um novo bio link ou comunidade do criador.
 */
export async function createBioLinkAction(
    _prevState: BioLinkActionState,
    formData: FormData,
): Promise<BioLinkActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawTitle = formData.get("title");
        const rawUrl = formData.get("url");
        const rawIcon = formData.get("icon");
        const rawBadgeText = formData.get("badge_text");
        const rawIsActive = formData.get("is_active");
        const rawIsHighlighted = formData.get("is_highlighted");
        const rawDisplayOrder = formData.get("display_order");

        const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
        if (!title || title.length > 100) {
            return {
                success: false,
                error: "O título do link é obrigatório e deve conter até 100 caracteres.",
            };
        }

        const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
        if (!url || !validateUrl(url)) {
            return {
                success: false,
                error: "A URL de destino deve ser um endereço web válido iniciando com http:// ou https://.",
            };
        }

        const icon =
            typeof rawIcon === "string" && rawIcon.trim() !== ""
                ? rawIcon.trim().slice(0, 50)
                : null;

        const badgeText =
            typeof rawBadgeText === "string" && rawBadgeText.trim() !== ""
                ? rawBadgeText.trim().slice(0, 50)
                : null;

        const isActive = rawIsActive !== "false";
        const isHighlighted = rawIsHighlighted === "true" || rawIsHighlighted === "on";

        let displayOrder = 0;
        if (rawDisplayOrder) {
            const parsedOrder = parseInt(String(rawDisplayOrder), 10);
            if (!Number.isNaN(parsedOrder)) {
                displayOrder = parsedOrder;
            }
        } else {
            // Busca a maior ordem existente e incrementa
            const { data: lastLink } = await adminDb
                .from("bio_links")
                .select("display_order")
                .order("display_order", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (lastLink && typeof lastLink.display_order === "number") {
                displayOrder = lastLink.display_order + 1;
            }
        }

        const insertData: BioLinkInsert = {
            title,
            url,
            icon,
            badge_text: badgeText,
            is_active: isActive,
            is_highlighted: isHighlighted,
            display_order: displayOrder,
        };

        const { error } = await adminDb.from("bio_links").insert(insertData);

        if (error) {
            logger.error("Erro ao cadastrar bio link no banco", {
                mensagem: error.message,
                codigo: error.code,
            });
            return {
                success: false,
                error: "Falha ao gravar os dados do link. Tente novamente.",
            };
        }

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/");
        revalidatePath("/admin/metrics");

        return {
            success: true,
            message: "Link de bio cadastrado com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção ao criar bio link", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Erro inesperado ao processar a requisição.",
        };
    }
}

/**
 * Atualiza um bio link existente.
 */
export async function updateBioLinkAction(
    id: string,
    _prevState: BioLinkActionState,
    formData: FormData,
): Promise<BioLinkActionState> {
    if (!isValidUuid(id)) {
        return {
            success: false,
            error: "Identificador de link inválido.",
        };
    }

    try {
        const { adminDb } = await requireAdminAuth();

        const rawTitle = formData.get("title");
        const rawUrl = formData.get("url");
        const rawIcon = formData.get("icon");
        const rawBadgeText = formData.get("badge_text");
        const rawIsActive = formData.get("is_active");
        const rawIsHighlighted = formData.get("is_highlighted");
        const rawDisplayOrder = formData.get("display_order");

        const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
        if (!title || title.length > 100) {
            return {
                success: false,
                error: "O título do link é obrigatório e deve conter até 100 caracteres.",
            };
        }

        const url = typeof rawUrl === "string" ? rawUrl.trim() : "";
        if (!url || !validateUrl(url)) {
            return {
                success: false,
                error: "A URL de destino deve ser um endereço web válido iniciando com http:// ou https://.",
            };
        }

        const icon =
            typeof rawIcon === "string" && rawIcon.trim() !== ""
                ? rawIcon.trim().slice(0, 50)
                : null;

        const badgeText =
            typeof rawBadgeText === "string" && rawBadgeText.trim() !== ""
                ? rawBadgeText.trim().slice(0, 50)
                : null;

        const isActive = rawIsActive !== "false";
        const isHighlighted = rawIsHighlighted === "true" || rawIsHighlighted === "on";

        const updateData: BioLinkUpdate = {
            title,
            url,
            icon,
            badge_text: badgeText,
            is_active: isActive,
            is_highlighted: isHighlighted,
        };

        if (rawDisplayOrder !== null && rawDisplayOrder !== undefined) {
            const parsedOrder = parseInt(String(rawDisplayOrder), 10);
            if (!Number.isNaN(parsedOrder)) {
                updateData.display_order = parsedOrder;
            }
        }

        const { error } = await adminDb
            .from("bio_links")
            .update(updateData)
            .eq("id", id);

        if (error) {
            logger.error("Erro ao atualizar bio link no banco", {
                mensagem: error.message,
                id,
            });
            return {
                success: false,
                error: "Falha ao atualizar as informações do link.",
            };
        }

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/");
        revalidatePath("/admin/metrics");

        return {
            success: true,
            message: "Link de bio atualizado com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção ao atualizar bio link", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Erro inesperado ao processar a requisição.",
        };
    }
}

/**
 * Remove um bio link existente.
 */
export async function deleteBioLinkAction(id: string): Promise<BioLinkActionState> {
    if (!isValidUuid(id)) {
        return {
            success: false,
            error: "Identificador de link inválido.",
        };
    }

    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb.from("bio_links").delete().eq("id", id);

        if (error) {
            logger.error("Erro ao remover bio link do banco", {
                mensagem: error.message,
                id,
            });
            return {
                success: false,
                error: "Falha ao excluir o link.",
            };
        }

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/");
        revalidatePath("/admin/metrics");

        return {
            success: true,
            message: "Link de bio removido com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção ao remover bio link", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Erro inesperado ao excluir o link.",
        };
    }
}

/**
 * Alterna rapidamente a visibilidade ativa/inativa de um link.
 */
export async function toggleBioLinkActiveAction(
    id: string,
    isActive: boolean,
): Promise<BioLinkActionState> {
    if (!isValidUuid(id)) {
        return {
            success: false,
            error: "Identificador de link inválido.",
        };
    }

    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb
            .from("bio_links")
            .update({ is_active: isActive })
            .eq("id", id);

        if (error) {
            logger.error("Erro ao alternar status do bio link", {
                mensagem: error.message,
                id,
            });
            return {
                success: false,
                error: "Falha ao alterar a visibilidade do link.",
            };
        }

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/");

        return {
            success: true,
            message: isActive ? "Link ativado na vitrine." : "Link ocultado da vitrine.",
        };
    } catch (err) {
        logger.error("Exceção ao alternar visibilidade de bio link", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Erro inesperado ao alterar visibilidade.",
        };
    }
}

/**
 * Reordena uma lista sequencial de links por seus identificadores.
 */
export async function reorderBioLinksAction(
    orderedIds: string[],
): Promise<BioLinkActionState> {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return {
            success: false,
            error: "Lista de ordenação inválida.",
        };
    }

    for (const id of orderedIds) {
        if (!isValidUuid(id)) {
            return {
                success: false,
                error: "Lista contém identificadores inválidos.",
            };
        }
    }

    try {
        const { adminDb } = await requireAdminAuth();

        // Atualiza a ordem de cada link sequencialmente
        const updates = orderedIds.map((id, index) =>
            adminDb
                .from("bio_links")
                .update({ display_order: index })
                .eq("id", id),
        );

        await Promise.all(updates);

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/");

        return {
            success: true,
            message: "Ordenação dos links atualizada com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção ao reordenar bio links", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error: "Erro inesperado ao salvar a nova ordem.",
        };
    }
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function validateOptionalColor(
    val: FormDataEntryValue | null,
    fieldName: string,
): string | null {
    if (!val || typeof val !== "string" || val.trim() === "") {
        return null;
    }
    const clean = val.trim();
    if (!HEX_COLOR_REGEX.test(clean)) {
        throw new Error(
            `A cor informada para "${fieldName}" (${clean}) é inválida. Utilize o formato hexadecimal estrito (ex: #10B981).`,
        );
    }
    return clean.toUpperCase();
}

function validateOptionalUrl(
    val: FormDataEntryValue | null,
    fieldName: string,
): string | null {
    if (!val || typeof val !== "string" || val.trim() === "") {
        return null;
    }
    const clean = val.trim();
    if (!/^(https?:\/\/|\/|data:image\/)/i.test(clean)) {
        throw new Error(
            `O endereço informado para "${fieldName}" deve ser uma URL válida ou caminho de upload.`,
        );
    }
    return clean;
}

/**
 * Atualiza as configurações de personalização visual da página pública de Bio Links.
 */
export async function updateBioLinksDesignAction(
    _prevState: BioLinkActionState,
    formData: FormData,
): Promise<BioLinkActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawAvatarLight = formData.get("bio_avatar_url_light");
        const rawAvatarDark = formData.get("bio_avatar_url_dark");
        const rawStorefrontBanner = formData.get("bio_show_storefront_banner");
        const rawShowQrCode = formData.get("bio_show_qrcode");
        const rawTitle = formData.get("bio_title");
        const rawDescription = formData.get("bio_description");
        const rawPrimaryLight = formData.get("bio_primary_color_light");
        const rawPrimaryDark = formData.get("bio_primary_color_dark");

        const bioAvatarUrlLight = validateOptionalUrl(rawAvatarLight, "Foto de Perfil (Modo Claro)");
        const bioAvatarUrlDark = validateOptionalUrl(rawAvatarDark, "Foto de Perfil (Modo Escuro)");

        const bannerStyle =
            typeof rawStorefrontBanner === "string" &&
            ["banner", "compact", "hidden"].includes(rawStorefrontBanner)
                ? (rawStorefrontBanner as "banner" | "compact" | "hidden")
                : "banner";

        const bioShowQrCode = rawShowQrCode === "true" || rawShowQrCode === "on";

        const bioTitle =
            typeof rawTitle === "string" && rawTitle.trim() !== ""
                ? rawTitle.trim().slice(0, 100)
                : null;

        const bioDescription =
            typeof rawDescription === "string" && rawDescription.trim() !== ""
                ? rawDescription.trim().slice(0, 500)
                : null;

        const bioPrimaryColorLight = validateOptionalColor(
            rawPrimaryLight,
            "Cor Primária no Bio Links (Modo Claro)",
        );
        const bioPrimaryColorDark = validateOptionalColor(
            rawPrimaryDark,
            "Cor Primária no Bio Links (Modo Escuro)",
        );

        const { error } = await adminDb
            .from("site_settings")
            .update({
                bio_avatar_url_light: bioAvatarUrlLight,
                bio_avatar_url_dark: bioAvatarUrlDark,
                bio_show_storefront_banner: bannerStyle,
                bio_show_qrcode: bioShowQrCode,
                bio_title: bioTitle,
                bio_description: bioDescription,
                bio_primary_color_light: bioPrimaryColorLight,
                bio_primary_color_dark: bioPrimaryColorDark,
            })
            .eq("id", 1);

        if (error) {
            logger.error("Erro ao atualizar design do Bio Links no Supabase", { erro: error.message });
            return {
                success: false,
                error: `Erro ao salvar personalização: ${error.message}`,
            };
        }

        await invalidateFeedCache();
        revalidatePath("/admin/bio-links");
        revalidatePath("/links");
        revalidatePath("/bio");
        revalidatePath("/");

        return {
            success: true,
            message: "Personalização e design do Bio Links atualizados com sucesso.",
        };
    } catch (err) {
        logger.error("Exceção ao atualizar personalização de Bio Links", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao salvar a personalização visual.",
        };
    }
}

