/**
 * ==============================================================================
 * PromoCuts — Padrão Strategy para Redes Sociais e Plataformas de Vídeo/Streaming
 * ==============================================================================
 * Centraliza metadados, formatação de URLs, autodetecção inteligente e regras
 * visuais para todas as plataformas sociais e canais da marca suportados.
 */

export type PlatformCategory =
    | "video"
    | "streaming"
    | "social"
    | "community"
    | "audio"
    | "monetization"
    | "other";

export interface SocialPlatformStrategy {
    id: string;
    name: string;
    category: PlatformCategory;
    brandColor: string;
    placeholder: string;
    urlPrefix: string;
    formatUrl: (input: string) => string;
    matchesUrl: (url: string) => boolean;
}

/**
 * Sanitizador universal que garante prefixo https:// e remove @ duplicado
 */
function createUrlFormatter(prefix: string) {
    return (input: string): string => {
        const trimmed = (input || "").trim();
        if (!trimmed) return "";
        if (/^https?:\/\//i.test(trimmed)) {
            return trimmed;
        }
        const cleanHandle = trimmed.replace(/^@/, "");
        return `${prefix}${cleanHandle}`;
    };
}

/**
 * Verificador baseado em expressões regulares nos hostnames
 */
function createDomainMatcher(domainPatterns: (string | RegExp)[]) {
    return (rawUrl: string): boolean => {
        if (!rawUrl) return false;
        try {
            const urlObj = rawUrl.startsWith("http")
                ? new URL(rawUrl)
                : new URL(`https://${rawUrl}`);
            const host = urlObj.hostname.toLowerCase();
            return domainPatterns.some((pattern) => {
                if (typeof pattern === "string") {
                    return host === pattern || host.endsWith(`.${pattern}`);
                }
                return pattern.test(host);
            });
        } catch {
            return domainPatterns.some((pattern) => {
                if (typeof pattern === "string") {
                    return rawUrl.toLowerCase().includes(pattern);
                }
                return pattern.test(rawUrl);
            });
        }
    };
}

export const SOCIAL_PLATFORMS: SocialPlatformStrategy[] = [
    // -------------------------------------------------------------------------
    // Vídeo e Transmissões (Cortes, Shorts e Lives)
    // -------------------------------------------------------------------------
    {
        id: "youtube",
        name: "YouTube",
        category: "video",
        brandColor: "#FF0000",
        placeholder: "https://youtube.com/@seu_canal",
        urlPrefix: "https://youtube.com/@",
        formatUrl: createUrlFormatter("https://youtube.com/@"),
        matchesUrl: (url: string) => {
            if (/music\.youtube\.com/i.test(url)) return false;
            return createDomainMatcher(["youtube.com", "youtu.be"])(url);
        },
    },
    {
        id: "tiktok",
        name: "TikTok",
        category: "video",
        brandColor: "#000000",
        placeholder: "https://tiktok.com/@seu_perfil",
        urlPrefix: "https://tiktok.com/@",
        formatUrl: createUrlFormatter("https://tiktok.com/@"),
        matchesUrl: createDomainMatcher(["tiktok.com"]),
    },
    {
        id: "twitch",
        name: "Twitch",
        category: "streaming",
        brandColor: "#9146FF",
        placeholder: "https://twitch.tv/seu_canal",
        urlPrefix: "https://twitch.tv/",
        formatUrl: createUrlFormatter("https://twitch.tv/"),
        matchesUrl: createDomainMatcher(["twitch.tv"]),
    },
    {
        id: "kick",
        name: "Kick",
        category: "streaming",
        brandColor: "#53FC18",
        placeholder: "https://kick.com/seu_canal",
        urlPrefix: "https://kick.com/",
        formatUrl: createUrlFormatter("https://kick.com/"),
        matchesUrl: createDomainMatcher(["kick.com"]),
    },

    // -------------------------------------------------------------------------
    // Redes Sociais Principais
    // -------------------------------------------------------------------------
    {
        id: "instagram",
        name: "Instagram",
        category: "social",
        brandColor: "#E1306C",
        placeholder: "https://instagram.com/seu_perfil",
        urlPrefix: "https://instagram.com/",
        formatUrl: createUrlFormatter("https://instagram.com/"),
        matchesUrl: createDomainMatcher(["instagram.com", "instagr.am"]),
    },
    {
        id: "reddit",
        name: "Reddit",
        category: "social",
        brandColor: "#FF4500",
        placeholder: "https://reddit.com/user/seu_usuario",
        urlPrefix: "https://reddit.com/user/",
        formatUrl: createUrlFormatter("https://reddit.com/user/"),
        matchesUrl: createDomainMatcher(["reddit.com"]),
    },
    {
        id: "x",
        name: "X (Twitter)",
        category: "social",
        brandColor: "#0F1419",
        placeholder: "https://x.com/seu_perfil",
        urlPrefix: "https://x.com/",
        formatUrl: createUrlFormatter("https://x.com/"),
        matchesUrl: createDomainMatcher(["x.com", "twitter.com"]),
    },
    {
        id: "threads",
        name: "Threads",
        category: "social",
        brandColor: "#000000",
        placeholder: "https://threads.net/@seu_perfil",
        urlPrefix: "https://threads.net/@",
        formatUrl: createUrlFormatter("https://threads.net/@"),
        matchesUrl: createDomainMatcher(["threads.net"]),
    },
    {
        id: "facebook",
        name: "Facebook",
        category: "social",
        brandColor: "#1877F2",
        placeholder: "https://facebook.com/sua_pagina",
        urlPrefix: "https://facebook.com/",
        formatUrl: createUrlFormatter("https://facebook.com/"),
        matchesUrl: createDomainMatcher(["facebook.com", "fb.com", "fb.me"]),
    },
    {
        id: "bluesky",
        name: "Bluesky",
        category: "social",
        brandColor: "#0085FF",
        placeholder: "https://bsky.app/profile/seu_perfil.bsky.social",
        urlPrefix: "https://bsky.app/profile/",
        formatUrl: createUrlFormatter("https://bsky.app/profile/"),
        matchesUrl: createDomainMatcher(["bsky.app"]),
    },
    {
        id: "pinterest",
        name: "Pinterest",
        category: "social",
        brandColor: "#BD081C",
        placeholder: "https://pinterest.com/seu_perfil",
        urlPrefix: "https://pinterest.com/",
        formatUrl: createUrlFormatter("https://pinterest.com/"),
        matchesUrl: createDomainMatcher(["pinterest.com", "pin.it"]),
    },
    {
        id: "linkedin",
        name: "LinkedIn",
        category: "social",
        brandColor: "#0A66C2",
        placeholder: "https://linkedin.com/in/seu_perfil",
        urlPrefix: "https://linkedin.com/in/",
        formatUrl: createUrlFormatter("https://linkedin.com/in/"),
        matchesUrl: createDomainMatcher(["linkedin.com"]),
    },
    {
        id: "kwai",
        name: "Kwai",
        category: "social",
        brandColor: "#FF5000",
        placeholder: "https://kwai.com/@seu_perfil",
        urlPrefix: "https://kwai.com/@",
        formatUrl: createUrlFormatter("https://kwai.com/@"),
        matchesUrl: createDomainMatcher(["kwai.com"]),
    },

    // -------------------------------------------------------------------------
    // Comunidades e Mensageria
    // -------------------------------------------------------------------------
    {
        id: "discord",
        name: "Discord",
        category: "community",
        brandColor: "#5865F2",
        placeholder: "https://discord.gg/seu_servidor",
        urlPrefix: "https://discord.gg/",
        formatUrl: createUrlFormatter("https://discord.gg/"),
        matchesUrl: createDomainMatcher(["discord.gg", "discord.com"]),
    },
    {
        id: "telegram",
        name: "Telegram",
        category: "community",
        brandColor: "#229ED9",
        placeholder: "https://t.me/seu_canal",
        urlPrefix: "https://t.me/",
        formatUrl: createUrlFormatter("https://t.me/"),
        matchesUrl: createDomainMatcher(["t.me", "telegram.me"]),
    },
    {
        id: "whatsapp",
        name: "WhatsApp",
        category: "community",
        brandColor: "#25D366",
        placeholder: "https://wa.me/5511999999999",
        urlPrefix: "https://wa.me/",
        formatUrl: createUrlFormatter("https://wa.me/"),
        matchesUrl: createDomainMatcher(["wa.me", "whatsapp.com"]),
    },

    // -------------------------------------------------------------------------
    // Música, Áudio & Podcasts
    // -------------------------------------------------------------------------
    {
        id: "youtube_music",
        name: "YouTube Music",
        category: "audio",
        brandColor: "#FF0000",
        placeholder: "https://music.youtube.com/playlist?list=...",
        urlPrefix: "https://music.youtube.com/",
        formatUrl: createUrlFormatter("https://music.youtube.com/"),
        matchesUrl: createDomainMatcher(["music.youtube.com"]),
    },
    {
        id: "spotify",
        name: "Spotify",
        category: "audio",
        brandColor: "#1DB954",
        placeholder: "https://open.spotify.com/artist/...",
        urlPrefix: "https://open.spotify.com/",
        formatUrl: createUrlFormatter("https://open.spotify.com/"),
        matchesUrl: createDomainMatcher(["spotify.com"]),
    },
    {
        id: "apple_music",
        name: "Apple Music",
        category: "audio",
        brandColor: "#FA243C",
        placeholder: "https://music.apple.com/...",
        urlPrefix: "https://music.apple.com/",
        formatUrl: createUrlFormatter("https://music.apple.com/"),
        matchesUrl: createDomainMatcher(["music.apple.com"]),
    },
    {
        id: "deezer",
        name: "Deezer",
        category: "audio",
        brandColor: "#A238FF",
        placeholder: "https://deezer.com/...",
        urlPrefix: "https://deezer.com/",
        formatUrl: createUrlFormatter("https://deezer.com/"),
        matchesUrl: createDomainMatcher(["deezer.com"]),
    },
    {
        id: "soundcloud",
        name: "SoundCloud",
        category: "audio",
        brandColor: "#FF5500",
        placeholder: "https://soundcloud.com/seu_perfil",
        urlPrefix: "https://soundcloud.com/",
        formatUrl: createUrlFormatter("https://soundcloud.com/"),
        matchesUrl: createDomainMatcher(["soundcloud.com"]),
    },

    // -------------------------------------------------------------------------
    // Jogos e Plataformas Gamer
    // -------------------------------------------------------------------------
    {
        id: "steam",
        name: "Steam",
        category: "streaming",
        brandColor: "#171A21",
        placeholder: "https://steamcommunity.com/id/seu_perfil",
        urlPrefix: "https://steamcommunity.com/id/",
        formatUrl: createUrlFormatter("https://steamcommunity.com/id/"),
        matchesUrl: createDomainMatcher(["steampowered.com", "steamcommunity.com"]),
    },

    // -------------------------------------------------------------------------
    // Apoio, Financiamento e Monetização
    // -------------------------------------------------------------------------
    {
        id: "pix",
        name: "PIX",
        category: "monetization",
        brandColor: "#32BCAD",
        placeholder: "https://livepix.gg/seu_canal ou chave",
        urlPrefix: "https://",
        formatUrl: (input: string) => {
            const trimmed = input.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://livepix.gg/${trimmed.replace(/^@/, "")}`;
        },
        matchesUrl: createDomainMatcher(["livepix.gg", "pix"]),
    },
    {
        id: "apoiase",
        name: "Apoia-se",
        category: "monetization",
        brandColor: "#FF2A54",
        placeholder: "https://apoia.se/sua_campanha",
        urlPrefix: "https://apoia.se/",
        formatUrl: createUrlFormatter("https://apoia.se/"),
        matchesUrl: createDomainMatcher(["apoia.se"]),
    },
    {
        id: "patreon",
        name: "Patreon",
        category: "monetization",
        brandColor: "#FF424D",
        placeholder: "https://patreon.com/seu_canal",
        urlPrefix: "https://patreon.com/",
        formatUrl: createUrlFormatter("https://patreon.com/"),
        matchesUrl: createDomainMatcher(["patreon.com"]),
    },
    {
        id: "snapchat",
        name: "Snapchat",
        category: "social",
        brandColor: "#FFFC00",
        placeholder: "https://snapchat.com/add/seu_perfil",
        urlPrefix: "https://snapchat.com/add/",
        formatUrl: createUrlFormatter("https://snapchat.com/add/"),
        matchesUrl: createDomainMatcher(["snapchat.com"]),
    },
    {
        id: "substack",
        name: "Substack",
        category: "community",
        brandColor: "#FF6719",
        placeholder: "https://seucanal.substack.com",
        urlPrefix: "https://",
        formatUrl: (input: string) => {
            const trimmed = input.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://${trimmed}.substack.com`;
        },
        matchesUrl: createDomainMatcher(["substack.com"]),
    },
    {
        id: "buymeacoffee",
        name: "Buy Me a Coffee",
        category: "monetization",
        brandColor: "#FFDD00",
        placeholder: "https://buymeacoffee.com/seu_perfil",
        urlPrefix: "https://buymeacoffee.com/",
        formatUrl: createUrlFormatter("https://buymeacoffee.com/"),
        matchesUrl: createDomainMatcher(["buymeacoffee.com"]),
    },
    {
        id: "amazon",
        name: "Loja Amazon",
        category: "monetization",
        brandColor: "#FF9900",
        placeholder: "https://amazon.com.br/shop/seu_perfil",
        urlPrefix: "https://amazon.com.br/shop/",
        formatUrl: (input: string) => {
            const trimmed = input.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://amazon.com.br/shop/${trimmed.replace(/^@/, "")}`;
        },
        matchesUrl: createDomainMatcher(["amazon.com", "amazon.com.br", "amzn.to"]),
    },
    {
        id: "kofi",
        name: "Ko-fi",
        category: "monetization",
        brandColor: "#FF5E5B",
        placeholder: "https://ko-fi.com/seu_canal",
        urlPrefix: "https://ko-fi.com/",
        formatUrl: createUrlFormatter("https://ko-fi.com/"),
        matchesUrl: createDomainMatcher(["ko-fi.com"]),
    },

    // -------------------------------------------------------------------------
    // Desenvolvimento, Criação e Web
    // -------------------------------------------------------------------------
    {
        id: "github",
        name: "GitHub",
        category: "other",
        brandColor: "#24292E",
        placeholder: "https://github.com/seu_usuario",
        urlPrefix: "https://github.com/",
        formatUrl: createUrlFormatter("https://github.com/"),
        matchesUrl: createDomainMatcher(["github.com"]),
    },
    {
        id: "link",
        name: "Website / Link Externo",
        category: "other",
        brandColor: "#4B5563",
        placeholder: "https://seusite.com.br",
        urlPrefix: "https://",
        formatUrl: (input: string) => {
            const trimmed = input.trim();
            if (/^https?:\/\//i.test(trimmed)) return trimmed;
            return `https://${trimmed}`;
        },
        matchesUrl: () => false,
    },
];

/**
 * Recupera a estratégia correspondente pelo ID da plataforma.
 */
export function getSocialPlatform(id: string | null | undefined): SocialPlatformStrategy {
    let cleanId = (id || "link").toLowerCase().trim();
    if (cleanId === "site") cleanId = "link";
    const found = SOCIAL_PLATFORMS.find((p) => p.id === cleanId);
    return (
        found ||
        SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1] // Fallback para link externo genérico
    );
}

/**
 * Autodetecta a plataforma ideal analisando a URL informada pelo usuário.
 */
export function detectPlatformFromUrl(rawUrl: string): SocialPlatformStrategy | undefined {
    if (!rawUrl || typeof rawUrl !== "string") return undefined;
    const trimmed = rawUrl.trim();
    if (!trimmed) return undefined;

    return SOCIAL_PLATFORMS.find((platform) => platform.matchesUrl(trimmed));
}

/**
 * Formata a URL digitada com base na estratégia da plataforma.
 */
export function formatSocialUrl(platformId: string, input: string): string {
    const platform = getSocialPlatform(platformId);
    return platform.formatUrl(input);
}
