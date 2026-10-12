"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { deleteCachedData } from "@/lib/cache/redis";
import { formatSocialUrl } from "@/lib/social/strategies";
import type { BrandSocialLinkUpdate } from "@/types/database";

export type SocialActionState = {
    success: boolean;
    error?: string;
};

async function clearSocialCaches() {
    await Promise.allSettled([
        deleteCachedData("promocuts:social:storefront"),
        deleteCachedData("promocuts:social:bio"),
        deleteCachedData("promocuts:social:all"),
    ]);
}

/**
 * Cria uma nova rede social oficial da marca
 */
export async function createSocialLinkAction(
    _prevState: SocialActionState,
    formData: FormData,
): Promise<SocialActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const platform = formData.get("platform")?.toString().trim();
        const rawUrl = formData.get("url")?.toString().trim();
        const showInStorefront = formData.get("show_in_storefront") === "true";
        const showInBio = formData.get("show_in_bio") === "true";
        const isActive = formData.get("is_active") !== "false";

        if (!platform) {
            return { success: false, error: "A plataforma é obrigatória." };
        }

        if (!rawUrl) {
            return { success: false, error: "A URL ou perfil de destino é obrigatório." };
        }

        const formattedUrl = formatSocialUrl(platform, rawUrl);

        if (!/^https?:\/\//i.test(formattedUrl)) {
            return {
                success: false,
                error: "URL inválida. Deve começar com http:// ou https://.",
            };
        }

        // Obtém a ordem mais recente para alocar no final
        const { data: maxOrderData } = await adminDb
            .from("brand_social_links")
            .select("display_order")
            .order("display_order", { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextOrder = (maxOrderData?.display_order ?? -1) + 1;

        const { error } = await adminDb.from("brand_social_links").insert({
            platform,
            url: formattedUrl,
            show_in_storefront: showInStorefront,
            show_in_bio: showInBio,
            display_order: nextOrder,
            is_active: isActive,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        await clearSocialCaches();
        revalidatePath("/", "page");
        revalidatePath("/c/[slug]", "page");
        revalidatePath("/links", "page");
        revalidatePath("/bio", "page");
        revalidatePath("/admin/social", "page");

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido ao criar rede social.";
        return { success: false, error: message };
    }
}

/**
 * Atualiza os dados de uma rede social existente
 */
export async function updateSocialLinkAction(
    id: string,
    _prevState: SocialActionState,
    formData: FormData,
): Promise<SocialActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const platform = formData.get("platform")?.toString().trim();
        const rawUrl = formData.get("url")?.toString().trim();
        const showInStorefront = formData.get("show_in_storefront") === "true";
        const showInBio = formData.get("show_in_bio") === "true";
        const isActive = formData.get("is_active") !== "false";

        if (!platform) {
            return { success: false, error: "A plataforma é obrigatória." };
        }

        if (!rawUrl) {
            return { success: false, error: "A URL de destino é obrigatória." };
        }

        const formattedUrl = formatSocialUrl(platform, rawUrl);

        if (!/^https?:\/\//i.test(formattedUrl)) {
            return {
                success: false,
                error: "URL inválida. Deve começar com http:// ou https://.",
            };
        }

        const { error } = await adminDb
            .from("brand_social_links")
            .update({
                platform,
                url: formattedUrl,
                show_in_storefront: showInStorefront,
                show_in_bio: showInBio,
                is_active: isActive,
            })
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        await clearSocialCaches();
        revalidatePath("/", "page");
        revalidatePath("/c/[slug]", "page");
        revalidatePath("/links", "page");
        revalidatePath("/bio", "page");
        revalidatePath("/admin/social", "page");

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido ao atualizar rede social.";
        return { success: false, error: message };
    }
}

/**
 * Remove uma rede social
 */
export async function deleteSocialLinkAction(id: string): Promise<SocialActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const { error } = await adminDb
            .from("brand_social_links")
            .delete()
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        await clearSocialCaches();
        revalidatePath("/", "page");
        revalidatePath("/c/[slug]", "page");
        revalidatePath("/links", "page");
        revalidatePath("/bio", "page");
        revalidatePath("/admin/social", "page");

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro desconhecido ao remover rede social.";
        return { success: false, error: message };
    }
}

/**
 * Alterna rapidamente uma visibilidade específica (vitrine, bio ou ativo)
 */
export async function toggleSocialVisibilityAction(
    id: string,
    target: "storefront" | "bio" | "active",
    currentValue: boolean,
): Promise<SocialActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const updateData: BrandSocialLinkUpdate = {};
        if (target === "storefront") updateData.show_in_storefront = !currentValue;
        if (target === "bio") updateData.show_in_bio = !currentValue;
        if (target === "active") updateData.is_active = !currentValue;

        const { error } = await adminDb
            .from("brand_social_links")
            .update(updateData)
            .eq("id", id);

        if (error) {
            return { success: false, error: error.message };
        }

        await clearSocialCaches();
        revalidatePath("/", "page");
        revalidatePath("/c/[slug]", "page");
        revalidatePath("/links", "page");
        revalidatePath("/bio", "page");
        revalidatePath("/admin/social", "page");

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao alterar visibilidade.";
        return { success: false, error: message };
    }
}

/**
 * Reordena as redes sociais
 */
export async function reorderSocialLinksAction(
    orderedIds: string[],
): Promise<SocialActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const updates = orderedIds.map((id, index) =>
            adminDb
                .from("brand_social_links")
                .update({ display_order: index })
                .eq("id", id),
        );

        await Promise.all(updates);
        await clearSocialCaches();
        revalidatePath("/", "page");
        revalidatePath("/c/[slug]", "page");
        revalidatePath("/links", "page");
        revalidatePath("/bio", "page");
        revalidatePath("/admin/social", "page");

        return { success: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erro ao reordenar redes.";
        return { success: false, error: message };
    }
}
