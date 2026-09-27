import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { SettingsForm } from "./settings-form";
import type { SiteSettings } from "@/types/database";

export const metadata = {
    title: "Personalizacao e Marca",
};

export default async function AdminSettingsPage() {
    const { adminDb } = await requireAdminAuth();

    // Consulta os parametros singleton de configuracao de marca
    const { data: rawSettings } = await adminDb
        .from("site_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

    const settings: SiteSettings = rawSettings || {
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

    return (
        <div className="space-y-6">
            <div className="border-b border-zinc-200 pb-5 dark:border-zinc-800">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Personalizacao e Marca
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Configure a identidade visual da sua vitrine, paleta de
                    cores e logotipos.
                </p>
            </div>

            <SettingsForm settings={settings} />
        </div>
    );
}
