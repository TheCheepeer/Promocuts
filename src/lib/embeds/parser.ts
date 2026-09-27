import type { VideoPlatform } from "@/types/database";

export interface ParsedVideoEmbed {
    platform: VideoPlatform;
    platformVideoId: string;
    embedUrl: string;
    originalUrl: string;
    thumbnailUrl: string | null;
}

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

const TIKTOK_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const INSTAGRAM_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Sanitiza a entrada basica de URL para analise defensiva.
 * Remove espacos e rejeita esquemas perigosos (javascript:, data:, vbscript:).
 */
function sanitizeUrlInput(rawUrl: string): string | null {
    if (!rawUrl || typeof rawUrl !== "string") {
        return null;
    }

    const trimmed = rawUrl.trim();
    if (!trimmed) {
        return null;
    }

    // Rejeita esquemas maliciosos
    const lower = trimmed.toLowerCase();
    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("file:")
    ) {
        return null;
    }

    // Rejeita tentativas de injecao de tags ou quebras
    if (/[<>"'\s]/.test(trimmed)) {
        return null;
    }

    // Se nao possui protocolo, prefixa com https:// para analise de URL valida
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }

    return trimmed;
}

/**
 * Extrai o identificador de video de uma URL do TikTok.
 * Suporta formatos padrao (@user/video/id), mobile (m.tiktok.com/v/id) e links curtos (vm, vt, /t/).
 */
export function extractTikTokId(url: string): string | null {
    const sanitized = sanitizeUrlInput(url);
    if (!sanitized) {
        return null;
    }

    try {
        const parsed = new URL(sanitized);
        const hostname = parsed.hostname.toLowerCase();

        // Checagem de dominio compativel com TikTok
        const isTikTokHost =
            hostname === "tiktok.com" || hostname.endsWith(".tiktok.com");

        if (!isTikTokHost) {
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
        const mobileMatch = pathname.match(/\/v\/([a-zA-Z0-9_-]+)(?:\.html)?/);
        if (mobileMatch && TIKTOK_ID_REGEX.test(mobileMatch[1])) {
            return mobileMatch[1];
        }

        // Formato 3: vm.tiktok.com/ZM... ou vt.tiktok.com/ZS...
        if (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com") {
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
}

/**
 * Extrai o identificador de corte do Instagram Reels.
 * Suporta formatos diretos de /reel/, /reels/, posts de video /p/ e links de compartilhamento.
 */
export function extractInstagramReelsId(url: string): string | null {
    const sanitized = sanitizeUrlInput(url);
    if (!sanitized) {
        return null;
    }

    try {
        const parsed = new URL(sanitized);
        const hostname = parsed.hostname.toLowerCase();

        const isInstagramHost =
            hostname === "instagram.com" || hostname.endsWith(".instagram.com");

        if (!isInstagramHost) {
            return null;
        }

        const pathname = parsed.pathname;

        // Formato 1: instagram.com/reel/C7xyz123/ ou /reels/C7xyz123/
        const reelMatch = pathname.match(/\/(?:reel|reels)\/([a-zA-Z0-9_-]+)/);
        if (reelMatch && INSTAGRAM_ID_REGEX.test(reelMatch[1])) {
            return reelMatch[1];
        }

        // Formato 2: instagram.com/p/C7xyz123/
        const postMatch = pathname.match(/\/p\/([a-zA-Z0-9_-]+)/);
        if (postMatch && INSTAGRAM_ID_REGEX.test(postMatch[1])) {
            return postMatch[1];
        }

        // Formato 3: instagram.com/share/reel/C7xyz123/
        const shareMatch = pathname.match(/\/share\/reel\/([a-zA-Z0-9_-]+)/);
        if (shareMatch && INSTAGRAM_ID_REGEX.test(shareMatch[1])) {
            return shareMatch[1];
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Extrai o identificador de 11 caracteres de um YouTube Shorts ou video vertical.
 * Suporta youtube.com/shorts/, youtube.com/watch?v=, youtu.be/ e youtube.com/embed/.
 */
export function extractYouTubeShortsId(url: string): string | null {
    const sanitized = sanitizeUrlInput(url);
    if (!sanitized) {
        return null;
    }

    try {
        const parsed = new URL(sanitized);
        const hostname = parsed.hostname.toLowerCase();

        // 1. Dominio encurtado youtu.be
        if (hostname === "youtu.be") {
            const shortMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
            if (shortMatch && YOUTUBE_ID_REGEX.test(shortMatch[1])) {
                return shortMatch[1];
            }
            return null;
        }

        // 2. Dominios youtube.com / youtube-nocookie.com
        const isYouTubeHost =
            hostname === "youtube.com" ||
            hostname.endsWith(".youtube.com") ||
            hostname === "youtube-nocookie.com" ||
            hostname.endsWith(".youtube-nocookie.com");

        if (!isYouTubeHost) {
            return null;
        }

        const pathname = parsed.pathname;

        // Formato: /shorts/dQw4w9WgXcQ
        const shortsMatch = pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch && YOUTUBE_ID_REGEX.test(shortsMatch[1])) {
            return shortsMatch[1];
        }

        // Formato: /watch?v=dQw4w9WgXcQ
        if (pathname === "/watch") {
            const vParam = parsed.searchParams.get("v");
            if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
                return vParam;
            }
        }

        // Formato: /embed/dQw4w9WgXcQ
        const embedMatch = pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
        if (embedMatch && YOUTUBE_ID_REGEX.test(embedMatch[1])) {
            return embedMatch[1];
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Gera a URL oficial de incorporacao para a plataforma informada.
 * Utiliza configuracoes defensivas e sem cookies de terceiros.
 */
export function getEmbedUrl(platform: VideoPlatform, videoId: string): string {
    if (!videoId) {
        throw new Error(
            "Identificador de video obrigatorio para geracao de embed",
        );
    }

    switch (platform) {
        case "tiktok":
            return `https://www.tiktok.com/embed/v2/${encodeURIComponent(videoId)}`;
        case "reels":
            return `https://www.instagram.com/reel/${encodeURIComponent(videoId)}/embed`;
        case "shorts":
            return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`;
        default: {
            const exhaustiveCheck: never = platform;
            throw new Error(`Plataforma nao suportada: ${exhaustiveCheck}`);
        }
    }
}

/**
 * Retorna as propriedades de configuracao e politicas de sandbox para iframe.
 */
export function getEmbedIframeConfig(
    platform: VideoPlatform,
    videoId: string,
    title?: string,
): EmbedIframeConfig {
    const embedUrl = getEmbedUrl(platform, videoId);

    const defaultTitles: Record<VideoPlatform, string> = {
        tiktok: "TikTok video player",
        reels: "Instagram Reels player",
        shorts: "YouTube Shorts player",
    };

    const allowPolicies: Record<VideoPlatform, string> = {
        tiktok: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        reels: "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share",
        shorts: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    };

    return {
        src: embedUrl,
        title: title || defaultTitles[platform],
        allow: allowPolicies[platform],
        sandbox:
            "allow-scripts allow-same-origin allow-popups allow-presentation",
        referrerPolicy: "strict-origin-when-cross-origin",
    };
}

/**
 * Analisador principal de URLs de video.
 * Detecta a plataforma, valida o ID e retorna metadados completos de incorporacao.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideoEmbed | null {
    const sanitized = sanitizeUrlInput(rawUrl);
    if (!sanitized) {
        return null;
    }

    // 1. Avalia YouTube Shorts
    const shortsId = extractYouTubeShortsId(sanitized);
    if (shortsId) {
        return {
            platform: "shorts",
            platformVideoId: shortsId,
            embedUrl: getEmbedUrl("shorts", shortsId),
            originalUrl: sanitized,
            thumbnailUrl: `https://img.youtube.com/vi/${shortsId}/hqdefault.jpg`,
        };
    }

    // 2. Avalia Instagram Reels
    const reelsId = extractInstagramReelsId(sanitized);
    if (reelsId) {
        return {
            platform: "reels",
            platformVideoId: reelsId,
            embedUrl: getEmbedUrl("reels", reelsId),
            originalUrl: sanitized,
            thumbnailUrl: null,
        };
    }

    // 3. Avalia TikTok
    const tiktokId = extractTikTokId(sanitized);
    if (tiktokId) {
        return {
            platform: "tiktok",
            platformVideoId: tiktokId,
            embedUrl: getEmbedUrl("tiktok", tiktokId),
            originalUrl: sanitized,
            thumbnailUrl: null,
        };
    }

    return null;
}

/**
 * Valida rapidamente se uma URL e compativel com as plataformas suportadas.
 */
export function isValidVideoUrl(rawUrl: string): boolean {
    return parseVideoUrl(rawUrl) !== null;
}
