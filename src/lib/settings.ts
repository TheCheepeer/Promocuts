import { createClient } from "@/lib/supabase/server";
import type { SiteSettings } from "@/types/database";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
    id: 1,
    site_name: "PromoCuts",
    site_tagline: "Cortes virais e recomendacoes de produtos afiliados",
    site_description:
        "Encontre os melhores achadinhos e promocoes em videos curtos das principais lojas parceiras.",
    primary_color_light: "#10B981",
    secondary_color_light: "#6366F1",
    primary_color_dark: "#10B981",
    secondary_color_dark: "#6366F1",
    logo_url_light: null,
    logo_url_dark: null,
    logo_icon_url_light: null,
    logo_icon_url_dark: null,
    favicon_url_light: null,
    favicon_url_dark: null,
    social_instagram: null,
    social_tiktok: null,
    social_youtube: null,
    footer_text: "PromoCuts — Todos os direitos reservados.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

/**
 * Consulta as configuracoes singleton da vitrine no banco de dados.
 * Retorna valores padrao estaveis caso a tabela esteja vazia ou haja indisponibilidade temporaria.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("site_settings")
            .select("*")
            .eq("id", 1)
            .maybeSingle();

        if (error || !data) {
            return DEFAULT_SITE_SETTINGS;
        }

        return data as SiteSettings;
    } catch {
        return DEFAULT_SITE_SETTINGS;
    }
}
