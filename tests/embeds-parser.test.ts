import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    parseVideoUrl,
    isValidVideoUrl,
    extractTikTokId,
    extractInstagramReelsId,
    extractYouTubeShortsId,
    getEmbedUrl,
    getEmbedIframeConfig,
} from "../src/lib/embeds/parser.js";

describe("Motor de Embeds - TikTok", () => {
    it("deve extrair ID e metadados de URL padrao do TikTok", () => {
        const url = "https://www.tiktok.com/@criador/video/7123456789012345678";
        const result = parseVideoUrl(url);

        assert.ok(result);
        assert.equal(result.platform, "tiktok");
        assert.equal(result.platformVideoId, "7123456789012345678");
        assert.equal(
            result.embedUrl,
            "https://www.tiktok.com/embed/v2/7123456789012345678",
        );
        assert.equal(result.thumbnailUrl, null);
    });

    it("deve extrair ID de URL com parametros de rastreamento", () => {
        const url =
            "https://www.tiktok.com/@user/video/7123456789012345678?is_from_webapp=1&sender_device=pc";
        assert.equal(extractTikTokId(url), "7123456789012345678");
    });

    it("deve extrair ID de URL mobile m.tiktok.com", () => {
        const url = "https://m.tiktok.com/v/7123456789012345678.html";
        assert.equal(extractTikTokId(url), "7123456789012345678");
    });

    it("deve extrair ID de links encurtados vm.tiktok.com e vt.tiktok.com", () => {
        assert.equal(
            extractTikTokId("https://vm.tiktok.com/ZMeXYZ123/"),
            "ZMeXYZ123",
        );
        assert.equal(
            extractTikTokId("https://vt.tiktok.com/ZSabc456/"),
            "ZSabc456",
        );
        assert.equal(
            extractTikTokId("https://www.tiktok.com/t/ZTRwXYZ12/"),
            "ZTRwXYZ12",
        );
    });

    it("deve extrair ID de URL de embed direto v2", () => {
        const url = "https://www.tiktok.com/embed/v2/7123456789012345678";
        assert.equal(extractTikTokId(url), "7123456789012345678");
    });
});

describe("Motor de Embeds - Instagram Reels", () => {
    it("deve extrair ID e metadados de URL padrao do Reels", () => {
        const url = "https://www.instagram.com/reel/C7xyz123/";
        const result = parseVideoUrl(url);

        assert.ok(result);
        assert.equal(result.platform, "reels");
        assert.equal(result.platformVideoId, "C7xyz123");
        assert.equal(
            result.embedUrl,
            "https://www.instagram.com/reel/C7xyz123/embed",
        );
        assert.equal(result.thumbnailUrl, null);
    });

    it("deve suportar URLs com reels no plural e sem barra final", () => {
        assert.equal(
            extractInstagramReelsId("https://instagram.com/reels/C7xyz123"),
            "C7xyz123",
        );
    });

    it("deve extrair ID de posts /p/ e links de compartilhamento /share/reel/", () => {
        assert.equal(
            extractInstagramReelsId("https://www.instagram.com/p/C7xyz123/"),
            "C7xyz123",
        );
        assert.equal(
            extractInstagramReelsId(
                "https://instagram.com/share/reel/C7xyz123/",
            ),
            "C7xyz123",
        );
    });

    it("deve ignorar parametros adicionais de query como igsh", () => {
        const url =
            "https://www.instagram.com/reel/C7xyz123/?igsh=MTZ4b2c1MjNnYmpxaw==";
        assert.equal(extractInstagramReelsId(url), "C7xyz123");
    });
});

describe("Motor de Embeds - YouTube Shorts", () => {
    it("deve extrair ID e gerar embed privacy-enhanced para Shorts", () => {
        const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
        const result = parseVideoUrl(url);

        assert.ok(result);
        assert.equal(result.platform, "shorts");
        assert.equal(result.platformVideoId, "dQw4w9WgXcQ");
        assert.equal(
            result.embedUrl,
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1",
        );
        assert.equal(
            result.thumbnailUrl,
            "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        );
    });

    it("deve extrair ID de Shorts com query params e m.youtube.com", () => {
        const url = "https://m.youtube.com/shorts/dQw4w9WgXcQ?feature=share";
        assert.equal(extractYouTubeShortsId(url), "dQw4w9WgXcQ");
    });

    it("deve aceitar links no formato watch?v=", () => {
        const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        assert.equal(extractYouTubeShortsId(url), "dQw4w9WgXcQ");

        const urlWithParams =
            "https://www.youtube.com/watch?feature=shared&v=dQw4w9WgXcQ";
        assert.equal(extractYouTubeShortsId(urlWithParams), "dQw4w9WgXcQ");
    });

    it("deve aceitar links encurtados youtu.be", () => {
        const url = "https://youtu.be/dQw4w9WgXcQ?t=10";
        assert.equal(extractYouTubeShortsId(url), "dQw4w9WgXcQ");
    });

    it("deve aceitar links diretos de embed", () => {
        const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
        assert.equal(extractYouTubeShortsId(url), "dQw4w9WgXcQ");
    });
});

describe("Motor de Embeds - Seguranca e Casos de Borda", () => {
    it("deve rejeitar URLs com esquemas maliciosos de protocolo", () => {
        assert.equal(parseVideoUrl("javascript:alert(1)"), null);
        assert.equal(parseVideoUrl("data:text/html;base64,PHNjcmlwdD4="), null);
        assert.equal(parseVideoUrl("vbscript:msgbox(1)"), null);
        assert.equal(parseVideoUrl("file:///etc/passwd"), null);
    });

    it("deve rejeitar tentativas de injecao de tags ou XSS no corpo da URL", () => {
        assert.equal(
            parseVideoUrl(
                "https://www.youtube.com/shorts/<script>alert(1)</script>",
            ),
            null,
        );
        assert.equal(
            parseVideoUrl(
                'https://www.instagram.com/reel/abc"onmouseover="alert(1)/',
            ),
            null,
        );
        assert.equal(
            parseVideoUrl("https://www.tiktok.com/@user/video/123'>alert(1)"),
            null,
        );
    });

    it("deve rejeitar tentativas de path traversal", () => {
        assert.equal(
            parseVideoUrl("https://www.youtube.com/shorts/../../secret"),
            null,
        );
    });

    it("deve rejeitar dominios nao suportados", () => {
        assert.equal(parseVideoUrl("https://dailymotion.com/video/x123456"), null);
        assert.equal(
            parseVideoUrl("https://twitter.com/user/status/12345678"),
            null,
        );
        assert.equal(parseVideoUrl("https://example.com/video/12345"), null);
    });

    it("deve rejeitar entradas vazias ou corrompidas", () => {
        assert.equal(parseVideoUrl(""), null);
        assert.equal(parseVideoUrl("   "), null);
        assert.equal(parseVideoUrl("not-a-valid-url"), null);
        // @ts-expect-error teste com tipo invalido
        assert.equal(parseVideoUrl(null), null);
        // @ts-expect-error teste com tipo invalido
        assert.equal(parseVideoUrl(undefined), null);
    });

    it("isValidVideoUrl deve responder corretamente para validos e invalidos", () => {
        assert.equal(
            isValidVideoUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
            true,
        );
        assert.equal(
            isValidVideoUrl("https://www.instagram.com/reel/C7xyz123/"),
            true,
        );
        assert.equal(
            isValidVideoUrl(
                "https://www.tiktok.com/@user/video/7123456789012345678",
            ),
            true,
        );
        assert.equal(isValidVideoUrl("https://example.com/invalid"), false);
    });
});

describe("Motor de Embeds - Configuracao de Iframe", () => {
    it("deve gerar configuracao correta para o TikTok", () => {
        const config = getEmbedIframeConfig("tiktok", "7123456789012345678");
        assert.equal(
            config.src,
            "https://www.tiktok.com/embed/v2/7123456789012345678",
        );
        assert.ok(config.sandbox.includes("allow-scripts"));
        assert.ok(config.allow.includes("accelerometer"));
    });

    it("deve gerar configuracao correta para o Instagram Reels", () => {
        const config = getEmbedIframeConfig("reels", "C7xyz123");
        assert.equal(
            config.src,
            "https://www.instagram.com/reel/C7xyz123/embed",
        );
        assert.ok(config.sandbox.includes("allow-scripts"));
        assert.ok(config.allow.includes("autoplay"));
    });

    it("deve gerar configuracao correta para o YouTube Shorts", () => {
        const config = getEmbedIframeConfig(
            "shorts",
            "dQw4w9WgXcQ",
            "Shorts Personalizado",
        );
        assert.equal(
            config.src,
            "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1",
        );
        assert.equal(config.title, "Shorts Personalizado");
        assert.ok(config.sandbox.includes("allow-scripts"));
    });

    it("deve lancar erro caso videoId seja omitido em getEmbedUrl", () => {
        assert.throws(() => getEmbedUrl("shorts", ""), /obrigatorio/);
    });
});
