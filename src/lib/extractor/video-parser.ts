import { parseVideoUrl } from "@/lib/embeds/parser";
import { isSafeExternalUrl, extractOpenGraphMetadata } from "@/lib/extractor/og-parser";
import { logger } from "@/lib/logger";
import type { VideoPlatform } from "@/types/database";

export interface ExtractedVideoMetadata {
    title: string | null;
    thumbnailUrl: string | null;
    authorName: string | null;
    platform: VideoPlatform;
    platformVideoId: string;
}

/**
 * Extrai metadados públicos (título, miniatura e autor) de um vídeo do TikTok, YouTube Shorts ou Instagram Reels.
 * Implementa validação estrita contra SSRF, timeouts seguros e fallbacks resilientes.
 */
export async function extractVideoMetadata(
    rawUrl: string,
): Promise<ExtractedVideoMetadata> {
    if (!rawUrl || typeof rawUrl !== "string") {
        throw new Error("URL de vídeo não fornecida ou inválida.");
    }

    const trimmedUrl = rawUrl.trim();
    if (!isSafeExternalUrl(trimmedUrl)) {
        throw new Error(
            "A URL informada é inválida ou direciona para um endereço de rede restrito por segurança.",
        );
    }

    const parsed = parseVideoUrl(trimmedUrl);
    if (!parsed) {
        throw new Error(
            "URL não reconhecida. Insira um link válido do TikTok, Instagram Reels ou YouTube Shorts.",
        );
    }

    let title: string | null = null;
    let thumbnailUrl: string | null = parsed.thumbnailUrl || null;
    let authorName: string | null = null;

    // 1. YouTube Shorts (e YouTube) via oEmbed oficial
    if (parsed.platform === "shorts") {
        const canonicalUrl = `https://www.youtube.com/watch?v=${parsed.platformVideoId}`;
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(oembedUrl, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PromoCuts/1.0",
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (res.ok) {
                const data = (await res.json()) as {
                    title?: string;
                    thumbnail_url?: string;
                    author_name?: string;
                };

                if (data.title && typeof data.title === "string") {
                    title = data.title.trim();
                }
                if (data.thumbnail_url && typeof data.thumbnail_url === "string") {
                    thumbnailUrl = data.thumbnail_url.trim();
                }
                if (data.author_name && typeof data.author_name === "string") {
                    authorName = data.author_name.trim();
                }
            }
        } catch (err) {
            logger.warn("Falha ao consultar oEmbed do YouTube", {
                videoId: parsed.platformVideoId,
                erro: err instanceof Error ? err.message : String(err),
            });
        }

        // Fallback garantido para miniatura do YouTube
        if (!thumbnailUrl) {
            thumbnailUrl = `https://img.youtube.com/vi/${parsed.platformVideoId}/hqdefault.jpg`;
        }
    }

    // 2. TikTok via oEmbed oficial com cabeçalhos simulados
    if (parsed.platform === "tiktok") {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.originalUrl)}`;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);

            const res = await fetch(oembedUrl, {
                method: "GET",
                headers: {
                    Accept: "application/json, text/javascript, */*; q=0.01",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
                    Referer: "https://www.tiktok.com/",
                },
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (res.ok) {
                const data = (await res.json()) as {
                    title?: string;
                    thumbnail_url?: string;
                    author_name?: string;
                };

                if (data.title && typeof data.title === "string") {
                    title = data.title.trim();
                }
                if (data.thumbnail_url && typeof data.thumbnail_url === "string") {
                    thumbnailUrl = data.thumbnail_url.trim();
                }
                if (data.author_name && typeof data.author_name === "string") {
                    authorName = data.author_name.trim();
                }
            }
        } catch (err) {
            logger.warn("Falha ao consultar oEmbed do TikTok", {
                videoId: parsed.platformVideoId,
                erro: err instanceof Error ? err.message : String(err),
            });
        }

        // Fallback: tenta extrair via Open Graph caso o oEmbed falhe
        if (!title || !thumbnailUrl) {
            try {
                const og = await extractOpenGraphMetadata(parsed.originalUrl);
                if (!title && og.title) {
                    title = og.title;
                }
                if (!thumbnailUrl && og.image) {
                    thumbnailUrl = og.image;
                }
            } catch {
                // Silencioso
            }
        }
    }

    // 3. Instagram Reels via Open Graph
    if (parsed.platform === "reels") {
        try {
            const og = await extractOpenGraphMetadata(parsed.originalUrl);
            if (og.title) {
                title = og.title;
            }
            if (og.image) {
                thumbnailUrl = og.image;
            }
        } catch (err) {
            logger.warn("Falha ao extrair metadados do Instagram Reels", {
                videoId: parsed.platformVideoId,
                erro: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return {
        title,
        thumbnailUrl,
        authorName,
        platform: parsed.platform,
        platformVideoId: parsed.platformVideoId,
    };
}

