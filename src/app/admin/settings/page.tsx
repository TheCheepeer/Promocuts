import React from "react";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { DEFAULT_SITE_SETTINGS } from "@/lib/settings";
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

    const settings: SiteSettings = rawSettings || DEFAULT_SITE_SETTINGS;

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
