import type { VideoPlatform } from "@/types/database";
import {
    VIDEO_PLATFORMS,
    getVideoStrategy,
    detectVideoStrategy,
    sanitizeVideoUrlInput,
    TikTokStrategy,
    InstagramReelsStrategy,
    YouTubeShortsStrategy,
    type EmbedIframeConfig,
    type VideoPlatformStrategy,
} from "@/lib/embeds/strategies";

export type { EmbedIframeConfig, VideoPlatformStrategy };
export { VIDEO_PLATFORMS, getVideoStrategy, detectVideoStrategy };

export interface ParsedVideoEmbed {
    platform: VideoPlatform;
    platformVideoId: string;
    embedUrl: string;
    originalUrl: string;
    thumbnailUrl: string | null;
}

/**
 * Sanitiza a entrada básica de URL para análise defensiva.
 * Mantida para retrocompatibilidade com utilitários legados.
 */
export function sanitizeUrlInput(rawUrl: string): string | null {
    return sanitizeVideoUrlInput(rawUrl);
}

/**
 * Extrai o identificador de vídeo de uma URL do TikTok.
 * Delega para a TikTokStrategy oficial.
 */
export function extractTikTokId(url: string): string | null {
    return TikTokStrategy.extractVideoId(url);
}

/**
 * Extrai o identificador de corte do Instagram Reels.
 * Delega para a InstagramReelsStrategy oficial.
 */
export function extractInstagramReelsId(url: string): string | null {
    return InstagramReelsStrategy.extractVideoId(url);
}

/**
 * Extrai o identificador de um YouTube Shorts ou vídeo do YouTube.
 * Delega para a YouTubeShortsStrategy oficial.
 */
export function extractYouTubeShortsId(url: string): string | null {
    return YouTubeShortsStrategy.extractVideoId(url);
}

/**
 * Gera a URL oficial de incorporação para a plataforma informada.
 * Utiliza o Padrão Strategy com resolução dinâmica.
 */
export function getEmbedUrl(
    platform: VideoPlatform,
    videoId: string,
    options?: { parentDomain?: string },
): string {
    if (!videoId) {
        throw new Error(
            "Identificador de video obrigatorio para geracao de embed",
        );
    }

    const strategy = getVideoStrategy(platform);
    if (!strategy) {
        throw new Error(`Plataforma não suportada: ${platform}`);
    }

    return strategy.getEmbedUrl(videoId, options);
}

/**
 * Retorna as propriedades de configuração e políticas de sandbox para iframe.
 * Derivadas dinamicamente a partir da estratégia de cada plataforma.
 */
export function getEmbedIframeConfig(
    platform: VideoPlatform,
    videoId: string,
    title?: string,
    options?: { parentDomain?: string },
): EmbedIframeConfig {
    const strategy = getVideoStrategy(platform);
    if (!strategy) {
        throw new Error(`Plataforma não suportada: ${platform}`);
    }

    return strategy.getIframeConfig(videoId, title, options);
}

/**
 * Analisador principal de URLs de vídeo.
 * Detecta a plataforma via Padrão Strategy, valida o ID e retorna metadados completos de incorporação.
 */
export function parseVideoUrl(rawUrl: string): ParsedVideoEmbed | null {
    const sanitized = sanitizeVideoUrlInput(rawUrl);
    if (!sanitized) {
        return null;
    }

    const detected = detectVideoStrategy(sanitized);
    if (!detected) {
        return null;
    }

    const { strategy, videoId } = detected;
    return {
        platform: strategy.id,
        platformVideoId: videoId,
        embedUrl: strategy.getEmbedUrl(videoId),
        originalUrl: sanitized,
        thumbnailUrl: strategy.getThumbnailUrl?.(videoId) || null,
    };
}

/**
 * Valida rapidamente se uma URL é compatível com as plataformas registradas.
 */
export function isValidVideoUrl(rawUrl: string): boolean {
    return parseVideoUrl(rawUrl) !== null;
}
