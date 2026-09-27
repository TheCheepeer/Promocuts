import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SITE_SETTINGS } from "../src/lib/settings.js";
import {
    formatCurrency,
    formatDiscountBadge,
    formatDiscountPercentage,
} from "../src/lib/formatters.js";
import { getEmbedIframeConfig } from "../src/lib/embeds/parser.js";

describe("Vitrine Publica - Configuracoes Padrao e Branding", () => {
    it("deve fornecer configuracoes singleton seguras por padrao", () => {
        assert.equal(DEFAULT_SITE_SETTINGS.id, 1);
        assert.equal(DEFAULT_SITE_SETTINGS.site_name, "PromoCuts");
        assert.ok(DEFAULT_SITE_SETTINGS.site_tagline);
        assert.ok(DEFAULT_SITE_SETTINGS.site_description);
        assert.match(
            DEFAULT_SITE_SETTINGS.primary_color_light,
            /^#[0-9A-Fa-f]{6}$/,
        );
        assert.match(
            DEFAULT_SITE_SETTINGS.secondary_color_light,
            /^#[0-9A-Fa-f]{6}$/,
        );
        assert.match(
            DEFAULT_SITE_SETTINGS.primary_color_dark,
            /^#[0-9A-Fa-f]{6}$/,
        );
        assert.match(
            DEFAULT_SITE_SETTINGS.secondary_color_dark,
            /^#[0-9A-Fa-f]{6}$/,
        );
    });

    it("deve validar integridade dos textos de direitos autorais", () => {
        assert.ok(DEFAULT_SITE_SETTINGS.footer_text);
        assert.ok(DEFAULT_SITE_SETTINGS.footer_text.includes("PromoCuts"));
    });
});

describe("Vitrine Publica - Exibicao de Precos e Cupons", () => {
    it("deve calcular desconto e formatar cracha para o card de produto", () => {
        const badge = formatDiscountBadge(100, 70);
        assert.equal(badge, "-30%");

        const pct = formatDiscountPercentage(100, 70);
        assert.equal(pct, 30);
    });

    it("nao deve exibir cracha de desconto quando preco promocional for maior ou igual ao regular", () => {
        assert.equal(formatDiscountBadge(100, 100), "");
        assert.equal(formatDiscountBadge(100, 120), "");
    });

    it("deve formatar valores monetarios nulos ou zerados com seguranca", () => {
        assert.equal(formatCurrency(null), "R$ 0,00");
        assert.equal(formatCurrency(0), "R$ 0,00");
        assert.equal(formatCurrency(89.9), "R$ 89,90");
    });
});

describe("Vitrine Publica - Embeds de VideoPlayer", () => {
    it("deve gerar configuracao segura de iframe para TikTok", () => {
        const config = getEmbedIframeConfig(
            "tiktok",
            "7123456789",
            "Corte TikTok",
        );
        assert.ok(config.src.includes("tiktok.com/embed/v2/7123456789"));
        assert.equal(config.title, "Corte TikTok");
        assert.ok(config.sandbox.includes("allow-scripts"));
    });

    it("deve gerar configuracao segura de iframe para Instagram Reels", () => {
        const config = getEmbedIframeConfig("reels", "C7xyz123", "Corte Reels");
        assert.ok(config.src.includes("instagram.com/reel/C7xyz123/embed"));
        assert.equal(config.title, "Corte Reels");
    });

    it("deve gerar configuracao sem cookies de terceiros para YouTube Shorts", () => {
        const config = getEmbedIframeConfig(
            "shorts",
            "dQw4w9WgXcQ",
            "Corte Shorts",
        );
        assert.ok(
            config.src.includes(
                "youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1",
            ),
        );
        assert.equal(config.title, "Corte Shorts");
    });
});
