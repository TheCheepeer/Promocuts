import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    VIDEO_PLATFORMS,
    getVideoStrategy,
    detectVideoStrategy,
    TikTokStrategy,
    InstagramReelsStrategy,
    YouTubeShortsStrategy,
    BilibiliStrategy,
    PinterestStrategy,
    TwitchClipsStrategy,
    VimeoStrategy,
    sanitizeVideoUrlInput,
} from "../src/lib/embeds/strategies.js";
import {
    parseVideoUrl,
    isValidVideoUrl,
    getEmbedUrl,
    getEmbedIframeConfig,
} from "../src/lib/embeds/parser.js";

describe("Padrão Strategy de Reprodutores de Vídeo - Registro e Catálogo", () => {
    it("deve conter todas as 7 plataformas suportadas no catálogo VIDEO_PLATFORMS", () => {
        const platformIds = VIDEO_PLATFORMS.map((p) => p.id);
        assert.deepEqual(platformIds, [
            "tiktok",
            "reels",
            "shorts",
            "bilibili",
            "pinterest",
            "twitch",
            "vimeo",
        ]);
    });

    it("deve recuperar as estratégias por ID com getVideoStrategy de forma insensível a maiúsculas", () => {
        assert.equal(getVideoStrategy("tiktok")?.name, "TikTok");
        assert.equal(getVideoStrategy("TIKTOK")?.name, "TikTok");
        assert.equal(getVideoStrategy("reels")?.name, "Instagram Reels");
        assert.equal(getVideoStrategy("shorts")?.name, "YouTube Shorts");
        assert.equal(getVideoStrategy("bilibili")?.name, "Bilibili");
        assert.equal(getVideoStrategy("pinterest")?.name, "Pinterest");
        assert.equal(getVideoStrategy("twitch")?.name, "Twitch Clips");
        assert.equal(getVideoStrategy("vimeo")?.name, "Vimeo");
    });

    it("deve retornar null para identificadores não registrados", () => {
        assert.equal(getVideoStrategy("desconhecido"), null);
        assert.equal(getVideoStrategy(""), null);
    });
});

describe("Padrão Strategy - TikTok", () => {
    it("deve detectar e extrair ID de URL padrão do TikTok", () => {
        const url = "https://www.tiktok.com/@criador/video/7123456789012345678";
        assert.equal(TikTokStrategy.matchesUrl(url), true);
        assert.equal(TikTokStrategy.extractVideoId(url), "7123456789012345678");
        assert.equal(
            TikTokStrategy.getEmbedUrl("7123456789012345678"),
            "https://www.tiktok.com/embed/v2/7123456789012345678",
        );
    });

    it("deve extrair ID de links móveis e curtos do TikTok", () => {
        assert.equal(
            TikTokStrategy.extractVideoId("https://m.tiktok.com/v/7123456789012345678.html"),
            "7123456789012345678",
        );
        assert.equal(
            TikTokStrategy.extractVideoId("https://vm.tiktok.com/ZMeXYZ123/"),
            "ZMeXYZ123",
        );
        assert.equal(
            TikTokStrategy.extractVideoId("https://www.tiktok.com/t/ZTRwXYZ12/"),
            "ZTRwXYZ12",
        );
    });
});

describe("Padrão Strategy - Instagram Reels", () => {
    it("deve detectar e extrair ID de URLs de Reels e Posts", () => {
        const reelUrl = "https://www.instagram.com/reel/C7xyz123/";
        assert.equal(InstagramReelsStrategy.matchesUrl(reelUrl), true);
        assert.equal(InstagramReelsStrategy.extractVideoId(reelUrl), "C7xyz123");
        assert.equal(
            InstagramReelsStrategy.getEmbedUrl("C7xyz123"),
            "https://www.instagram.com/reel/C7xyz123/embed",
        );

        assert.equal(
            InstagramReelsStrategy.extractVideoId("https://instagram.com/p/C7xyz123/"),
            "C7xyz123",
        );
        assert.equal(
            InstagramReelsStrategy.extractVideoId("https://instagram.com/share/reel/C7xyz123/"),
            "C7xyz123",
        );
    });
});

describe("Padrão Strategy - YouTube Shorts & Vídeos", () => {
    it("deve detectar Shorts, links de watch e links encurtados youtu.be", () => {
        const shortsUrl = "https://youtube.com/shorts/dQw4w9WgXcQ";
        assert.equal(YouTubeShortsStrategy.matchesUrl(shortsUrl), true);
        assert.equal(YouTubeShortsStrategy.extractVideoId(shortsUrl), "dQw4w9WgXcQ");

        assert.equal(
            YouTubeShortsStrategy.extractVideoId("https://youtu.be/dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        );
        assert.equal(
            YouTubeShortsStrategy.extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
            "dQw4w9WgXcQ",
        );
    });

    it("deve gerar embed com youtube-nocookie e miniatura oficial garantida", () => {
        const embedUrl = YouTubeShortsStrategy.getEmbedUrl("dQw4w9WgXcQ");
        assert.match(embedUrl, /https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
        assert.equal(
            YouTubeShortsStrategy.getThumbnailUrl?.("dQw4w9WgXcQ"),
            "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        );
    });
});

describe("Padrão Strategy - Bilibili (YouTube Chinês)", () => {
    it("deve detectar e extrair BV ID a partir de URLs do Bilibili", () => {
        const biliUrl = "https://www.bilibili.com/video/BV1xx411c7m9/";
        assert.equal(BilibiliStrategy.matchesUrl(biliUrl), true);
        assert.equal(BilibiliStrategy.extractVideoId(biliUrl), "BV1xx411c7m9");
    });

    it("deve extrair BV ID a partir de parâmetro de busca bvid", () => {
        const paramUrl = "https://www.bilibili.com/video?bvid=BV1xx411c7m9";
        assert.equal(BilibiliStrategy.extractVideoId(paramUrl), "BV1xx411c7m9");
    });

    it("deve extrair ID numérico no formato AV antigo", () => {
        const avUrl = "https://www.bilibili.com/video/av12345678/";
        assert.equal(BilibiliStrategy.extractVideoId(avUrl), "av12345678");
        assert.equal(
            BilibiliStrategy.getEmbedUrl("av12345678"),
            "https://player.bilibili.com/player.html?aid=12345678&page=1&danmaku=0&high_quality=1",
        );
    });

    it("deve gerar URL de embed oficial com danmaku=0 e high_quality=1", () => {
        const embedUrl = BilibiliStrategy.getEmbedUrl("BV1xx411c7m9");
        assert.equal(
            embedUrl,
            "https://player.bilibili.com/player.html?bvid=BV1xx411c7m9&page=1&danmaku=0&high_quality=1",
        );

        const config = BilibiliStrategy.getIframeConfig("BV1xx411c7m9");
        assert.equal(config.src, embedUrl);
        assert.match(config.allow, /fullscreen/);
    });
});

describe("Padrão Strategy - Pinterest", () => {
    it("deve detectar e extrair ID de URLs de pins e idea pins", () => {
        const pinUrl = "https://www.pinterest.com/pin/123456789012345678/";
        assert.equal(PinterestStrategy.matchesUrl(pinUrl), true);
        assert.equal(
            PinterestStrategy.extractVideoId(pinUrl),
            "123456789012345678",
        );
    });

    it("deve gerar URL oficial de embed do Pinterest", () => {
        const embedUrl = PinterestStrategy.getEmbedUrl("123456789012345678");
        assert.equal(
            embedUrl,
            "https://assets.pinterest.com/ext/embed.html?id=123456789012345678",
        );
    });
});

describe("Padrão Strategy - Twitch Clips", () => {
    it("deve detectar URLs de clips.twitch.tv e twitch.tv/canal/clip/", () => {
        const clipUrl = "https://clips.twitch.tv/GloriousSavageClips-Slug";
        assert.equal(TwitchClipsStrategy.matchesUrl(clipUrl), true);
        assert.equal(
            TwitchClipsStrategy.extractVideoId(clipUrl),
            "GloriousSavageClips-Slug",
        );

        const channelClip = "https://www.twitch.tv/streamer/clip/AnotherCoolClip";
        assert.equal(
            TwitchClipsStrategy.extractVideoId(channelClip),
            "AnotherCoolClip",
        );
    });

    it("deve gerar embed da Twitch com parentDomain dinâmico", () => {
        const embedUrl = TwitchClipsStrategy.getEmbedUrl("ClipSlug", {
            parentDomain: "promocuts.com",
        });
        assert.equal(
            embedUrl,
            "https://clips.twitch.tv/embed?clip=ClipSlug&parent=promocuts.com&autoplay=false",
        );
    });
});

describe("Padrão Strategy - Vimeo", () => {
    it("deve detectar e extrair ID numérico de vídeos do Vimeo", () => {
        const vimeoUrl = "https://vimeo.com/76979871";
        assert.equal(VimeoStrategy.matchesUrl(vimeoUrl), true);
        assert.equal(VimeoStrategy.extractVideoId(vimeoUrl), "76979871");
    });

    it("deve gerar embed com suporte nativo a formato portrait/vertical", () => {
        const embedUrl = VimeoStrategy.getEmbedUrl("76979871");
        assert.equal(
            embedUrl,
            "https://player.vimeo.com/video/76979871?portrait=1&badge=0&autopause=0&playsinline=1",
        );
    });
});

describe("Autodetecção Unificada via detectVideoStrategy e parseVideoUrl", () => {
    it("deve autodetectar URLs válidas para todas as 7 plataformas", () => {
        const testCases = [
            {
                url: "https://www.tiktok.com/@user/video/7123456789012345678",
                platform: "tiktok",
                id: "7123456789012345678",
            },
            {
                url: "https://www.instagram.com/reel/C7xyz123/",
                platform: "reels",
                id: "C7xyz123",
            },
            {
                url: "https://youtube.com/shorts/dQw4w9WgXcQ",
                platform: "shorts",
                id: "dQw4w9WgXcQ",
            },
            {
                url: "https://www.bilibili.com/video/BV1xx411c7m9",
                platform: "bilibili",
                id: "BV1xx411c7m9",
            },
            {
                url: "https://www.pinterest.com/pin/999888777666555/",
                platform: "pinterest",
                id: "999888777666555",
            },
            {
                url: "https://clips.twitch.tv/TopTierClip",
                platform: "twitch",
                id: "TopTierClip",
            },
            {
                url: "https://vimeo.com/987654321",
                platform: "vimeo",
                id: "987654321",
            },
        ];

        for (const tc of testCases) {
            const detected = detectVideoStrategy(tc.url);
            assert.ok(detected, `URL deve ser detectada: ${tc.url}`);
            assert.equal(detected.strategy.id, tc.platform);
            assert.equal(detected.videoId, tc.id);

            const parsed = parseVideoUrl(tc.url);
            assert.ok(parsed, `parseVideoUrl deve funcionar para ${tc.url}`);
            assert.equal(parsed.platform, tc.platform);
            assert.equal(parsed.platformVideoId, tc.id);
            assert.equal(isValidVideoUrl(tc.url), true);
        }
    });

    it("deve rejeitar URLs com esquemas perigosos ou plataformas inválidas", () => {
        assert.equal(parseVideoUrl("javascript:alert(1)"), null);
        assert.equal(parseVideoUrl("data:text/html,malicious"), null);
        assert.equal(parseVideoUrl("https://example.com/video.mp4"), null);
        assert.equal(isValidVideoUrl(""), false);
    });

    it("deve disparar getEmbedIframeConfig com sucesso para qualquer plataforma registrada", () => {
        for (const strat of VIDEO_PLATFORMS) {
            const config = getEmbedIframeConfig(strat.id, "TEST_ID", "Título de Teste");
            assert.ok(config.src.length > 0);
            assert.equal(config.title, "Título de Teste");
            assert.ok(config.sandbox.includes("allow-scripts"));
        }
    });
});

