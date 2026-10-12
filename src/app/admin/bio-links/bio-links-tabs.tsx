"use client";

import React, { useState } from "react";
import { Link2, Palette } from "lucide-react";
import { BioLinksTable } from "./bio-links-table";
import { BioLinksDesignForm } from "./bio-links-design-form";
import type { BioLink, SiteSettings } from "@/types/database";

interface BioLinksTabsProps {
    links: BioLink[];
    settings: SiteSettings;
}

export function BioLinksTabs({ links, settings }: BioLinksTabsProps) {
    const [activeTab, setActiveTab] = useState<"links" | "design">("links");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-6 border-b border-zinc-200 dark:border-zinc-800">
                <button
                    type="button"
                    onClick={() => setActiveTab("links")}
                    className={`inline-flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "links"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                    <Link2 className="w-4 h-4" />
                    <span>Links & Comunidades ({links.length})</span>
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("design")}
                    className={`inline-flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === "design"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                >
                    <Palette className="w-4 h-4" />
                    <span>Personalização & Design</span>
                </button>
            </div>

            {activeTab === "links" ? (
                <BioLinksTable initialLinks={links} />
            ) : (
                <BioLinksDesignForm settings={settings} />
            )}
        </div>
    );
}
