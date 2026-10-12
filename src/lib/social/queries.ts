import { createClient } from "@/lib/supabase/server";
import { getCachedData, setCachedData } from "@/lib/cache/redis";
import type { BrandSocialLink } from "@/types/database";

/**
 * Consulta redes sociais ativas da marca destinadas a exibição na Vitrine (Header).
 */
export async function getStorefrontSocialLinks(): Promise<BrandSocialLink[]> {
    const cached = await getCachedData<BrandSocialLink[]>("promocuts:social:storefront");
    if (cached) {
        return cached;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("brand_social_links")
            .select("*")
            .eq("is_active", true)
            .eq("show_in_storefront", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error || !data) {
            return [];
        }

        const links = data as BrandSocialLink[];
        await setCachedData("promocuts:social:storefront", links, 300);
        return links;
    } catch {
        return [];
    }
}

/**
 * Consulta redes sociais ativas da marca destinadas a exibição no perfil de Bio Links.
 */
export async function getBioSocialLinks(): Promise<BrandSocialLink[]> {
    const cached = await getCachedData<BrandSocialLink[]>("promocuts:social:bio");
    if (cached) {
        return cached;
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("brand_social_links")
            .select("*")
            .eq("is_active", true)
            .eq("show_in_bio", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (error || !data) {
            return [];
        }

        const links = data as BrandSocialLink[];
        await setCachedData("promocuts:social:bio", links, 300);
        return links;
    } catch {
        return [];
    }
}
