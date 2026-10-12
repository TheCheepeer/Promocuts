import type { VideoPlatform } from "@/types/database";

export interface EmbedIframeConfig {
    src: string;
    title: string;
    allow: string;
    sandbox: string;
    referrerPolicy:
        | "strict-origin-when-cross-origin"
        | "no-referrer"
        | "origin";
}

export interface VideoPlatformStrategy {
    id: VideoPlatform;
    name: string;
    badgeColor: {
        bg: string;
        text: string;
        darkBg?: string;
    };
    placeholder: string;
    matchesUrl: (url: string) => boolean;
    extractVideoId: (url: string) => string | null;
    getEmbedUrl: (
        videoId: string,
        options?: { parentDomain?: string },
    ) => string;
    getIframeConfig: (
        videoId: string,
        title?: string,
        options?: { parentDomain?: string },
    ) => EmbedIframeConfig;
    getThumbnailUrl?: (videoId: string) => string | null;
    extractMetadata?: (
        rawUrl: string,
        videoId: string,
    ) => Promise<{
        title: string | null;
        thumbnailUrl: string | null;
        authorName: string | null;
    }>;
}

/**
 * Sanitiza a entrada básica de URL para análise defensiva.
 * Rejeita esquemas perigosos (javascript:, data:, vbscript:) e caracteres de injeção.
 */
export function sanitizeVideoUrlInput(rawUrl: string): string | null {
    if (!rawUrl || typeof rawUrl !== "string") {
        return null;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return null;
    }

    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("file:")
    ) {
        return null;
    }

    if (/[<>"'\s]/.test(trimmed)) {
        return null;
    }

    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return trimmed;
}

const TIKTOK_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const INSTAGRAM_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
const BILIBILI_BV_REGEX = /^(?:BV)?[a-zA-Z0-9]{10}$/i;
const PINTEREST_ID_REGEX = /^\d+$/;
const TWITCH_CLIP_REGEX = /^[a-zA-Z0-9_-]+$/;
const VIMEO_ID_REGEX = /^\d+$/;

/**
 * Estratégia oficial para cortes do TikTok.
 */
export const TikTokStrategy: VideoPlatformStrategy = {
    id: "tiktok",
    name: "TikTok",
    badgeColor: {
        bg: "bg-black",
        text: "text-white",
        darkBg: "dark:bg-zinc-800",
    },
    placeholder: "https://www.tiktok.com/@criador/video/1234567890123456789",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return host === "tiktok.com" || host.endsWith(".tiktok.com");
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();
            if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) {
                return null;
            }

            const pathname = parsed.pathname;

            // Formato 1: tiktok.com/@usuario/video/1234567890123456789
            const standardMatch = pathname.match(
                /\/@[^/]+\/video\/([a-zA-Z0-9_-]+)/,
            );
            if (standardMatch && TIKTOK_ID_REGEX.test(standardMatch[1])) {
                return standardMatch[1];
            }

            // Formato 2: m.tiktok.com/v/1234567890123456789.html
            const mobileMatch = pathname.match(
                /\/v\/([a-zA-Z0-9_-]+)(?:\.html)?/,
            );
            if (mobileMatch && TIKTOK_ID_REGEX.test(mobileMatch[1])) {
                return mobileMatch[1];
            }

            // Formato 3: vm.tiktok.com/ZM... ou vt.tiktok.com/ZS...
            if (host === "vm.tiktok.com" || host === "vt.tiktok.com") {
                const shortMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)\/?$/);
                if (shortMatch && TIKTOK_ID_REGEX.test(shortMatch[1])) {
                    return shortMatch[1];
                }
            }

            // Formato 4: tiktok.com/t/ZM...
            const tMatch = pathname.match(/\/t\/([a-zA-Z0-9_-]+)\/?/);
            if (tMatch && TIKTOK_ID_REGEX.test(tMatch[1])) {
                return tMatch[1];
            }

            // Formato 5: tiktok.com/embed/v2/1234567890123456789
            const embedMatch = pathname.match(/\/embed\/v2\/([a-zA-Z0-9_-]+)/);
            if (embedMatch && TIKTOK_ID_REGEX.test(embedMatch[1])) {
                return embedMatch[1];
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        return `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`;
    },
    getIframeConfig: (videoId: string, title?: string) => ({
        src: `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`,
        title: title || "TikTok video player",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    }),
};

/**
 * Estratégia oficial para Instagram Reels.
 */
export const InstagramReelsStrategy: VideoPlatformStrategy = {
    id: "reels",
    name: "Instagram Reels",
    badgeColor: {
        bg: "bg-pink-600",
        text: "text-white",
    },
    placeholder: "https://www.instagram.com/reel/C7xyz123/",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return host === "instagram.com" || host.endsWith(".instagram.com");
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();
            if (host !== "instagram.com" && !host.endsWith(".instagram.com")) {
                return null;
            }

            const pathname = parsed.pathname;

            // Formato 1: instagram.com/reel/C7xyz123/ ou /reels/C7xyz123/
            const reelMatch = pathname.match(
                /\/(?:reel|reels)\/([a-zA-Z0-9_-]+)/,
            );
            if (reelMatch && INSTAGRAM_ID_REGEX.test(reelMatch[1])) {
                return reelMatch[1];
            }

            // Formato 2: instagram.com/p/C7xyz123/
            const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
            if (postMatch && INSTAGRAM_ID_REGEX.test(postMatch[1])) {
                return postMatch[1];
            }

            // Formato 3: instagram.com/share/reel/C7xyz123/
            const shareMatch = pathname.match(
                /\/share\/reel\/([a-zA-Z0-9_-]+)/,
            );
            if (shareMatch && INSTAGRAM_ID_REGEX.test(shareMatch[1])) {
                return shareMatch[1];
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        return `https://www.instagram.com/reel/${encodeURIComponent(videoId)}/embed`;
    },
    getIframeConfig: (videoId: string, title?: string) => ({
        src: `https://www.instagram.com/reel/${encodeURIComponent(videoId)}/embed`,
        title: title || "Instagram Reels player",
        allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share",
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    }),
};

/**
 * Estratégia oficial para YouTube Shorts e vídeos verticais do YouTube.
 */
export const YouTubeShortsStrategy: VideoPlatformStrategy = {
    id: "shorts",
    name: "YouTube Shorts",
    badgeColor: {
        bg: "bg-red-600",
        text: "text-white",
    },
    placeholder: "https://youtube.com/shorts/dQw4w9WgXcQ",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return (
                host === "youtu.be" ||
                host === "youtube.com" ||
                host.endsWith(".youtube.com") ||
                host === "youtube-nocookie.com" ||
                host.endsWith(".youtube-nocookie.com")
            );
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();

            // 1. Domínio encurtado youtu.be
            if (host === "youtu.be") {
                const shortMatch = parsed.pathname.match(
                    /^\/([a-zA-Z0-9_-]{11})/,
                );
                if (shortMatch && YOUTUBE_ID_REGEX.test(shortMatch[1])) {
                    return shortMatch[1];
                }
                return null;
            }

            const isYouTubeHost =
                host === "youtube.com" ||
                host.endsWith(".youtube.com") ||
                host === "youtube-nocookie.com" ||
                host.endsWith(".youtube-nocookie.com");

            if (!isYouTubeHost) {
                return null;
            }

            const pathname = parsed.pathname;

            // Formato 1: /shorts/dQw4w9WgXcQ
            const shortsMatch = pathname.match(
                /\/shorts\/([a-zA-Z0-9_-]{11})/,
            );
            if (shortsMatch && YOUTUBE_ID_REGEX.test(shortsMatch[1])) {
                return shortsMatch[1];
            }

            // Formato 2: /watch?v=dQw4w9WgXcQ
            if (pathname === "/watch") {
                const vParam = parsed.searchParams.get("v");
                if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
                    return vParam;
                }
            }

            // Formato 3: /embed/dQw4w9WgXcQ
            const embedMatch = pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch && YOUTUBE_ID_REGEX.test(embedMatch[1])) {
                return embedMatch[1];
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`;
    },
    getIframeConfig: (videoId: string, title?: string) => ({
        src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`,
        title: title || "YouTube Shorts player",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    }),
    getThumbnailUrl: (videoId: string) => {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    },
};

/**
 * Estratégia oficial para Bilibili ("YouTube chinês").
 */
export const BilibiliStrategy: VideoPlatformStrategy = {
    id: "bilibili",
    name: "Bilibili",
    badgeColor: {
        bg: "bg-[#00AEEC]",
        text: "text-white",
    },
    placeholder: "https://www.bilibili.com/video/BV1xx411c7m9",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return (
                host === "bilibili.com" ||
                host.endsWith(".bilibili.com") ||
                host === "bilibili.tv" ||
                host.endsWith(".bilibili.tv") ||
                host === "b23.tv"
            );
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();
            const isBili =
                host === "bilibili.com" ||
                host.endsWith(".bilibili.com") ||
                host === "bilibili.tv" ||
                host.endsWith(".bilibili.tv") ||
                host === "b23.tv";

            if (!isBili) return null;

            const pathname = parsed.pathname;

            // Formato 1: /video/BV1xx411c7m9 ou /video/BV...
            const bvMatch = pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
            if (bvMatch) {
                return bvMatch[1];
            }

            // Formato 2: query parameter bvid=BV...
            const bvidParam = parsed.searchParams.get("bvid");
            if (bvidParam && BILIBILI_BV_REGEX.test(bvidParam)) {
                return bvidParam.startsWith("BV")
                    ? bvidParam
                    : `BV${bvidParam}`;
            }

            // Formato 3: /video/av12345678
            const avMatch = pathname.match(/\/video\/av(\d+)/i);
            if (avMatch) {
                return `av${avMatch[1]}`;
            }

            // Formato 4: query parameter aid=12345678
            const aidParam = parsed.searchParams.get("aid");
            if (aidParam && /^\d+$/.test(aidParam)) {
                return `av${aidParam}`;
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        const isBv = videoId.toUpperCase().startsWith("BV");
        const param = isBv
            ? `bvid=${encodeURIComponent(videoId)}`
            : `aid=${encodeURIComponent(videoId.replace(/^av/i, ""))}`;
        return `https://player.bilibili.com/player.html?${param}&page=1&danmaku=0&high_quality=1`;
    },
    getIframeConfig: (videoId: string, title?: string) => {
        const isBv = videoId.toUpperCase().startsWith("BV");
        const param = isBv
            ? `bvid=${encodeURIComponent(videoId)}`
            : `aid=${encodeURIComponent(videoId.replace(/^av/i, ""))}`;
        return {
            src: `https://player.bilibili.com/player.html?${param}&page=1&danmaku=0&high_quality=1`,
            title: title || "Bilibili video player",
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen",
            sandbox:
                "allow-scripts allow-same-origin allow-popups allow-presentation",
            referrerPolicy: "strict-origin-when-cross-origin",
        };
    },
};

/**
 * Estratégia oficial para Pinterest (Idea Pins e Vídeos Verticais).
 */
export const PinterestStrategy: VideoPlatformStrategy = {
    id: "pinterest",
    name: "Pinterest",
    badgeColor: {
        bg: "bg-red-700",
        text: "text-white",
    },
    placeholder: "https://www.pinterest.com/pin/123456789012345678/",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return (
                host === "pinterest.com" ||
                host.endsWith(".pinterest.com") ||
                host === "pin.it"
            );
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();
            const isPinterest =
                host === "pinterest.com" ||
                host.endsWith(".pinterest.com") ||
                host === "pin.it";

            if (!isPinterest) return null;

            const pathname = parsed.pathname;

            // Formato padrão: /pin/123456789012345678/
            const pinMatch = pathname.match(/\/pin\/(\d+)/);
            if (pinMatch && PINTEREST_ID_REGEX.test(pinMatch[1])) {
                return pinMatch[1];
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        return `https://assets.pinterest.com/ext/embed.html?id=${encodeURIComponent(videoId)}`;
    },
    getIframeConfig: (videoId: string, title?: string) => ({
        src: `https://assets.pinterest.com/ext/embed.html?id=${encodeURIComponent(videoId)}`,
        title: title || "Pinterest Pin player",
        allow: "autoplay; fullscreen",
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    }),
};

/**
 * Estratégia oficial para Twitch Clips.
 */
export const TwitchClipsStrategy: VideoPlatformStrategy = {
    id: "twitch",
    name: "Twitch Clips",
    badgeColor: {
        bg: "bg-purple-600",
        text: "text-white",
    },
    placeholder: "https://clips.twitch.tv/GloriousSavageClips-Slug",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return (
                host === "clips.twitch.tv" ||
                host === "twitch.tv" ||
                host.endsWith(".twitch.tv")
            );
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();

            // Formato 1: clips.twitch.tv/ClipSlug
            if (host === "clips.twitch.tv") {
                const clipMatch = parsed.pathname.match(
                    /^\/([a-zA-Z0-9_-]+)\/?$/,
                );
                if (clipMatch && TWITCH_CLIP_REGEX.test(clipMatch[1])) {
                    return clipMatch[1];
                }
            }

            // Formato 2: twitch.tv/canal/clip/ClipSlug ou twitch.tv/videos/clip/...
            if (host === "twitch.tv" || host.endsWith(".twitch.tv")) {
                const clipMatch = parsed.pathname.match(
                    /\/clip\/([a-zA-Z0-9_-]+)/,
                );
                if (clipMatch && TWITCH_CLIP_REGEX.test(clipMatch[1])) {
                    return clipMatch[1];
                }
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string, options?: { parentDomain?: string }) => {
        const parent =
            options?.parentDomain ||
            (typeof window !== "undefined"
                ? window.location.hostname
                : "localhost");
        return `https://clips.twitch.tv/embed?clip=${encodeURIComponent(videoId)}&parent=${encodeURIComponent(parent)}&autoplay=false`;
    },
    getIframeConfig: (
        videoId: string,
        title?: string,
        options?: { parentDomain?: string },
    ) => {
        const parent =
            options?.parentDomain ||
            (typeof window !== "undefined"
                ? window.location.hostname
                : "localhost");
        return {
            src: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(videoId)}&parent=${encodeURIComponent(parent)}&autoplay=false`,
            title: title || "Twitch Clip player",
            allow: "autoplay; fullscreen",
            sandbox:
                "allow-scripts allow-same-origin allow-popups allow-presentation",
            referrerPolicy: "strict-origin-when-cross-origin",
        };
    },
};

/**
 * Estratégia oficial para Vimeo.
 */
export const VimeoStrategy: VideoPlatformStrategy = {
    id: "vimeo",
    name: "Vimeo",
    badgeColor: {
        bg: "bg-[#1AB7EA]",
        text: "text-white",
    },
    placeholder: "https://vimeo.com/123456789",
    matchesUrl: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return false;
        try {
            const host = new URL(sanitized).hostname.toLowerCase();
            return host === "vimeo.com" || host.endsWith(".vimeo.com");
        } catch {
            return false;
        }
    },
    extractVideoId: (rawUrl: string) => {
        const sanitized = sanitizeVideoUrlInput(rawUrl);
        if (!sanitized) return null;

        try {
            const parsed = new URL(sanitized);
            const host = parsed.hostname.toLowerCase();
            if (host !== "vimeo.com" && !host.endsWith(".vimeo.com")) {
                return null;
            }

            const pathname = parsed.pathname;

            // Formato: vimeo.com/123456789 ou vimeo.com/channels/.../123456789
            const vimeoMatch = pathname.match(/(?:\/channels\/[^/]+)?\/(\d+)/);
            if (vimeoMatch && VIMEO_ID_REGEX.test(vimeoMatch[1])) {
                return vimeoMatch[1];
            }

            return null;
        } catch {
            return null;
        }
    },
    getEmbedUrl: (videoId: string) => {
        return `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?portrait=1&badge=0&autopause=0&playsinline=1`;
    },
    getIframeConfig: (videoId: string, title?: string) => ({
        src: `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?portrait=1&badge=0&autopause=0&playsinline=1`,
        title: title || "Vimeo video player",
        allow: "autoplay; fullscreen; picture-in-picture",
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    }),
};

/**
 * Catálogo ordenado de estratégias de plataformas de vídeo registradas.
 */
export const VIDEO_PLATFORMS: VideoPlatformStrategy[] = [
    TikTokStrategy,
    InstagramReelsStrategy,
    YouTubeShortsStrategy,
    BilibiliStrategy,
    PinterestStrategy,
    TwitchClipsStrategy,
    VimeoStrategy,
];

/**
 * Obtém a estratégia de plataforma pelo identificador.
 */
export function getVideoStrategy(
    platformId: string,
): VideoPlatformStrategy | null {
    if (!platformId) return null;
    const normalized = platformId.trim().toLowerCase();
    return (
        VIDEO_PLATFORMS.find(
            (strat) => strat.id.toLowerCase() === normalized,
        ) || null
    );
}

/**
 * Detecta a estratégia e o identificador de vídeo a partir de uma URL arbitrária.
 */
export function detectVideoStrategy(
    rawUrl: string,
): { strategy: VideoPlatformStrategy; videoId: string } | null {
    const sanitized = sanitizeVideoUrlInput(rawUrl);
    if (!sanitized) return null;

    for (const strategy of VIDEO_PLATFORMS) {
        if (strategy.matchesUrl(sanitized)) {
            const videoId = strategy.extractVideoId(sanitized);
            if (videoId) {
                return { strategy, videoId };
            }
        }
    }

    return null;
}

