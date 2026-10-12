import React from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettings } from "@/lib/settings";
import { getCachedData, setCachedData } from "@/lib/cache/redis";
import { getBioSocialLinks } from "@/lib/social/queries";
import { BioLinksView } from "@/components/public/bio-links-view";
import type { BioLink } from "@/types/database";

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings();
    const title = `Links & Bio | ${settings.site_name}`;
    const description =
        settings.site_tagline ||
        settings.site_description ||
        `Canais oficiais, comunidades e links de ${settings.site_name}.`;

    const ogImage =
        settings.logo_icon_url_light ||
        settings.logo_url_light ||
        undefined;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            images: ogImage ? [{ url: ogImage }] : undefined,
        },
        twitter: {
            card: "summary",
            title,
            description,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export default async function LinksPage() {
    const [settings, socialLinks] = await Promise.all([
        getSiteSettings(),
        getBioSocialLinks(),
    ]);

    // Consulta prioritária ao cache em memória (Upstash Redis é opcional)
    let bioLinks = await getCachedData<BioLink[]>("promocuts:bio_links:all");

    if (!bioLinks) {
        const supabase = await createClient();
        const { data } = await supabase
            .from("bio_links")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true });

        bioLinks = (data as BioLink[]) || [];

        // Armazena no Redis se estiver configurado
        await setCachedData("promocuts:bio_links:all", bioLinks, 300);
    }

    return (
        <BioLinksView
            settings={settings}
            bioLinks={bioLinks}
            socialLinks={socialLinks}
        />
    );
}

