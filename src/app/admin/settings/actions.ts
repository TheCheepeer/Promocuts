"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { logger } from "@/lib/logger";

export interface SettingsActionState {
    success: boolean;
    error?: string;
    message?: string;
}

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const ASSET_FORMAT_REGEX =
    /^(https?:\/\/|\/).*\.(png|svg)(\?.*)?$|^data:image\/(png|svg\+xml);/i;

function validateColor(
    val: FormDataEntryValue | null,
    fieldName: string,
    fallback: string,
): string {
    if (!val || typeof val !== "string" || val.trim() === "") {
        return fallback;
    }
    const clean = val.trim();
    if (!HEX_COLOR_REGEX.test(clean)) {
        throw new Error(
            `A cor informada para "${fieldName}" (${clean}) e invalida. Utilize o formato hexadecimal estrito (ex: #10B981).`,
        );
    }
    return clean.toUpperCase();
}

function validateAsset(
    val: FormDataEntryValue | null,
    fieldName: string,
): string | null {
    if (!val || typeof val !== "string" || val.trim() === "") {
        return null;
    }
    const clean = val.trim();
    if (!ASSET_FORMAT_REGEX.test(clean)) {
        throw new Error(
            `O arquivo informado para "${fieldName}" deve ser estritamente no formato PNG (.png) ou SVG (.svg).`,
        );
    }
    return clean;
}

/**
 * Server Action para atualizar as configuracoes globais de marca e cores (White-Label).
 */
export async function updateSiteSettingsAction(
    _prevState: SettingsActionState,
    formData: FormData,
): Promise<SettingsActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawSiteName = formData.get("site_name");
        const rawSiteTagline = formData.get("site_tagline");
        const rawSiteDescription = formData.get("site_description");
        const rawFooterText = formData.get("footer_text");

        const siteName =
            typeof rawSiteName === "string" && rawSiteName.trim() !== ""
                ? rawSiteName.trim()
                : "PromoCuts";

        if (siteName.length > 100) {
            return {
                success: false,
                error: "O nome da vitrine deve conter ate 100 caracteres.",
            };
        }

        const siteTagline =
            typeof rawSiteTagline === "string" && rawSiteTagline.trim() !== ""
                ? rawSiteTagline.trim()
                : null;

        const siteDescription =
            typeof rawSiteDescription === "string" &&
            rawSiteDescription.trim() !== ""
                ? rawSiteDescription.trim()
                : null;

        const footerText =
            typeof rawFooterText === "string" && rawFooterText.trim() !== ""
                ? rawFooterText.trim()
                : "PromoCuts — Todos os direitos reservados.";

        // Cores Dual-Theme com validacao estrita
        const primaryColorLight = validateColor(
            formData.get("primary_color_light"),
            "Cor Primaria (Modo Claro)",
            "#10B981",
        );
        const secondaryColorLight = validateColor(
            formData.get("secondary_color_light"),
            "Cor Secundaria (Modo Claro)",
            "#6366F1",
        );
        const primaryColorDark = validateColor(
            formData.get("primary_color_dark"),
            "Cor Primaria (Modo Escuro)",
            "#10B981",
        );
        const secondaryColorDark = validateColor(
            formData.get("secondary_color_dark"),
            "Cor Secundaria (Modo Escuro)",
            "#6366F1",
        );

        // Ativos Visuais (PNG ou SVG)
        const logoUrlLight = validateAsset(
            formData.get("logo_url_light"),
            "Logo Principal (Modo Claro)",
        );
        const logoUrlDark = validateAsset(
            formData.get("logo_url_dark"),
            "Logo Principal (Modo Escuro)",
        );
        const logoIconUrlLight = validateAsset(
            formData.get("logo_icon_url_light"),
            "Icone Mobile (Modo Claro)",
        );
        const logoIconUrlDark = validateAsset(
            formData.get("logo_icon_url_dark"),
            "Icone Mobile (Modo Escuro)",
        );
        const faviconUrlLight = validateAsset(
            formData.get("favicon_url_light"),
            "Favicon da Aba (Modo Claro)",
        );
        const faviconUrlDark = validateAsset(
            formData.get("favicon_url_dark"),
            "Favicon da Aba (Modo Escuro)",
        );

        // Redes Sociais
        const rawInstagram = formData.get("social_instagram");
        const rawTiktok = formData.get("social_tiktok");
        const rawYoutube = formData.get("social_youtube");

        const socialInstagram =
            typeof rawInstagram === "string" && rawInstagram.trim() !== ""
                ? rawInstagram.trim()
                : null;
        const socialTiktok =
            typeof rawTiktok === "string" && rawTiktok.trim() !== ""
                ? rawTiktok.trim()
                : null;
        const socialYoutube =
            typeof rawYoutube === "string" && rawYoutube.trim() !== ""
                ? rawYoutube.trim()
                : null;

        // Atualizacao singleton na linha id = 1
        const { error: updateError } = await adminDb
            .from("site_settings")
            .upsert({
                id: 1,
                site_name: siteName,
                site_tagline: siteTagline,
                site_description: siteDescription,
                footer_text: footerText,
                primary_color_light: primaryColorLight,
                secondary_color_light: secondaryColorLight,
                primary_color_dark: primaryColorDark,
                secondary_color_dark: secondaryColorDark,
                logo_url_light: logoUrlLight,
                logo_url_dark: logoUrlDark,
                logo_icon_url_light: logoIconUrlLight,
                logo_icon_url_dark: logoIconUrlDark,
                favicon_url_light: faviconUrlLight,
                favicon_url_dark: faviconUrlDark,
                social_instagram: socialInstagram,
                social_tiktok: socialTiktok,
                social_youtube: socialYoutube,
            });

        if (updateError) {
            logger.error("Erro ao gravar configuracoes no banco", {
                erro: updateError.message,
            });
            return {
                success: false,
                error: "Falha ao gravar as configuracoes de marca.",
            };
        }

        // Revalidacao instantanea do cache do layout publico e da tela administrativa
        revalidatePath("/", "layout");
        revalidatePath("/admin/settings");

        return {
            success: true,
            message:
                "Configuracoes de identidade visual e cores atualizadas com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao na atualizacao de site_settings", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Erro inesperado ao salvar configuracoes.",
        };
    }
}
