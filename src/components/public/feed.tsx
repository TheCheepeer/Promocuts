"use client";

import React from "react";
import { FeedMobile } from "./feed-mobile";
import { FeedDesktop } from "./feed-desktop";
import type { VideoWithRelations } from "./feed-mobile";

interface FeedProps {
    videos: VideoWithRelations[];
}

export function Feed({ videos }: FeedProps) {
    return (
        <div className="w-full">
            {/* Visao Mobile com Scroll-Snap Vertical */}
            <div className="block md:hidden">
                <FeedMobile videos={videos} />
            </div>

            {/* Visao Desktop com Grade de Cartoes 9:16 */}
            <div className="hidden md:block">
                <FeedDesktop videos={videos} />
            </div>
        </div>
    );
}
