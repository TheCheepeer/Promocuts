import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVideoUrl } from "../src/lib/embeds/parser";
import {
    formatDiscountPercentage,
    formatDiscountBadge,
    slugify,
    formatCurrency,
} from "../src/lib/formatters";

// Replicacao das expressoes regulares utilizadas nas Server Actions e constraints do banco
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const ASSET_FORMAT_REGEX =
    /^(https?:\/\/|\/).*\.(png|svg)(\?.*)?$|^data:image\/(png|svg\+xml);/i;

function isValidHttpUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return false;
    }
    try {
        const parsed = new URL(trimmed);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

describe("Painel Administrativo - Validacao de Cores Hexadecimais", () => {
    it("deve aceitar formatos hexadecimais validos de 6 digitos", () => {
        const validColors = [
            "#10B981",
            "#6366F1",
            "#000000",
            "#FFFFFF",
            "#1a2b3c",
            "#FFAA00",
        ];
        for (const color of validColors) {
            assert.strictEqual(
                HEX_COLOR_REGEX.test(color),
                true,
                `Cor ${color} deveria ser valida`,
            );
        }
    });

    it("deve rejeitar cores com formato invalido", () => {
        const invalidColors = [
            "#FFF", // 3 digitos nao atendem a constraint do banco
            "10B981", // sem cerquilha
            "#10B981AA", // 8 digitos (com canal alpha)
            "rgb(0,0,0)",
            "hsl(0,0%,0%)",
            "red",
            "",
            "javascript:alert(1)",
        ];
        for (const color of invalidColors) {
            assert.strictEqual(
                HEX_COLOR_REGEX.test(color),
                false,
                `Cor ${color} deveria ser rejeitada`,
            );
        }
    });
});

describe("Painel Administrativo - Validacao de Ativos Visuais (PNG ou SVG)", () => {
    it("deve aceitar URLs remotas com extensao PNG e SVG", () => {
        const validUrls = [
            "https://cdn.example.com/logo.png",
            "https://cdn.example.com/logo.svg",
            "https://cdn.example.com/icons/favicon.png?v=2",
            "http://static.empresa.com.br/assets/marca.svg?token=123",
            "/uploads/asset-123456.png",
            "/uploads/asset-789012.svg",
            "data:image/svg+xml;base64,PHN2Z...",
            "data:image/png;base64,iVBORw0KGgo...",
        ];
        for (const url of validUrls) {
            assert.strictEqual(
                ASSET_FORMAT_REGEX.test(url),
                true,
                `Ativo ${url} deveria ser valido`,
            );
        }
    });

    it("deve rejeitar formatos de imagem nao autorizados e URLs inseguras", () => {
        const invalidUrls = [
            "https://cdn.example.com/image.jpg",
            "https://cdn.example.com/photo.jpeg",
            "https://cdn.example.com/banner.webp",
            "https://cdn.example.com/anim.gif",
            "https://cdn.example.com/script.js",
            "javascript:alert(1)",
            "data:text/html;<script>alert(1)</script>",
        ];
        for (const url of invalidUrls) {
            assert.strictEqual(
                ASSET_FORMAT_REGEX.test(url),
                false,
                `Ativo ${url} deveria ser rejeitado`,
            );
        }
    });
});

describe("Painel Administrativo - Validacao Defensiva de Links Afiliados", () => {
    it("deve aceitar links legitimos de e-commerce e afiliados", () => {
        const validUrls = [
            "https://amzn.to/3xyz123",
            "https://www.amazon.com.br/dp/B08N5WRWNW?tag=afiliado-20",
            "https://shope.ee/8pK123",
            "https://mercadolivre.com/sec/123xyz",
            "http://aliexpress.com/item/100500123.html",
        ];
        for (const url of validUrls) {
            assert.strictEqual(
                isValidHttpUrl(url),
                true,
                `URL ${url} deveria ser aceita`,
            );
        }
    });

    it("deve rejeitar links sem protocolo ou com esquemas perigosos", () => {
        const dangerousUrls = [
            "javascript:void(0)",
            "javascript:alert(document.cookie)",
            "data:text/html,<html>",
            "vbscript:msgbox",
            "ftp://files.example.com",
            "//amzn.to/relative-protocol",
            "/caminho/relativo",
            "",
        ];
        for (const url of dangerousUrls) {
            assert.strictEqual(
                isValidHttpUrl(url),
                false,
                `URL perigosa ${url} deveria ser rejeitada`,
            );
        }
    });
});

describe("Painel Administrativo - Curadoria de Videos e Embeds", () => {
    it("deve reconhecer plataforma e extrair ID em URLs coladas no formulario de video", () => {
        const tiktok = parseVideoUrl(
            "https://www.tiktok.com/@criador/video/7123456789012345678",
        );
        assert.ok(tiktok);
        assert.strictEqual(tiktok.platform, "tiktok");
        assert.strictEqual(tiktok.platformVideoId, "7123456789012345678");

        const reels = parseVideoUrl("https://www.instagram.com/reel/C7xyz123/");
        assert.ok(reels);
        assert.strictEqual(reels.platform, "reels");
        assert.strictEqual(reels.platformVideoId, "C7xyz123");

        const shorts = parseVideoUrl(
            "https://www.youtube.com/shorts/dQw4w9WgXcQ",
        );
        assert.ok(shorts);
        assert.strictEqual(shorts.platform, "shorts");
        assert.strictEqual(shorts.platformVideoId, "dQw4w9WgXcQ");
    });

    it("deve rejeitar links que nao pertencem a plataformas verticais suportadas", () => {
        assert.strictEqual(parseVideoUrl("https://vimeo.com/123456"), null);
        assert.strictEqual(
            parseVideoUrl("https://facebook.com/watch?v=123"),
            null,
        );
        assert.strictEqual(
            parseVideoUrl("https://exemplo.com/video.mp4"),
            null,
        );
    });
});

describe("Painel Administrativo - Consistencia de Slugs e Precos", () => {
    it("deve gerar slugs seguros a partir de nomes de categorias e titulos de videos", () => {
        assert.strictEqual(slugify("Eletronicos & Audio"), "eletronicos-audio");
        assert.strictEqual(
            slugify("Review Fone Bluetooth 2026!"),
            "review-fone-bluetooth-2026",
        );
        assert.strictEqual(
            slugify("Cozinha & Casa Inteligente"),
            "cozinha-casa-inteligente",
        );
    });

    it("deve calcular descontos e badges corretamente para produtos cadastrados", () => {
        const regular = 200;
        const discount = 150;
        const pct = formatDiscountPercentage(regular, discount);
        assert.strictEqual(pct, 25);
        assert.strictEqual(formatDiscountBadge(regular, discount), "-25%");
    });
});
