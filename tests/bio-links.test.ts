import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BIO_LINK_AVAILABLE_ICONS } from "../src/app/admin/bio-links/bio-link-icons.js";
import { isValidUuid } from "../src/lib/telemetry.js";

function validateUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

describe("Bio Links - Validação e Integridade de Dados", () => {
    it("deve aceitar URLs legítimas com protocolos HTTP e HTTPS", () => {
        const validUrls = [
            "https://twitch.tv/streamer",
            "https://kick.com/canal",
            "https://discord.gg/comunidade",
            "https://youtube.com/@criador",
            "http://meusite.com.br",
            "https://t.me/grupodeofertas",
        ];

        for (const url of validUrls) {
            assert.equal(validateUrl(url), true, `Deveria aceitar URL válida: ${url}`);
        }
    });

    it("deve rejeitar esquemas perigosos ou URLs malformadas", () => {
        const invalidUrls = [
            "javascript:alert(1)",
            "data:text/html;base64,PHNjcmlwdD4=",
            "file:///etc/passwd",
            "ftp://ftp.exemplo.com",
            "not-a-valid-url",
            "",
            "//protocol-relative.com",
        ];

        for (const url of invalidUrls) {
            assert.equal(validateUrl(url), false, `Deveria rejeitar URL insegura: ${url}`);
        }
    });

    it("deve conter catálogo de ícones com marcas reconhecidas e cores associadas", () => {
        assert.ok(BIO_LINK_AVAILABLE_ICONS.length >= 8);

        const ids = BIO_LINK_AVAILABLE_ICONS.map((i) => i.id);
        assert.ok(ids.includes("twitch"), "Deve suportar Twitch");
        assert.ok(ids.includes("kick"), "Deve suportar Kick");
        assert.ok(ids.includes("youtube"), "Deve suportar YouTube");
        assert.ok(ids.includes("discord"), "Deve suportar Discord");
        assert.ok(ids.includes("telegram"), "Deve suportar Telegram");
        assert.ok(ids.includes("whatsapp"), "Deve suportar WhatsApp");
        assert.ok(ids.includes("pix"), "Deve suportar PIX");
        assert.ok(ids.includes("apoiase"), "Deve suportar Apoia-se");

        for (const icon of BIO_LINK_AVAILABLE_ICONS) {
            assert.ok(icon.id.length > 0);
            assert.ok(icon.label.length > 0);
            assert.ok(icon.brandColor.startsWith("#"));
        }
    });

    it("deve validar identificadores de bio link com UUID estrito", () => {
        const validUuid = "123e4567-e89b-12d3-a456-426614174000";
        const invalidUuid = "not-a-uuid-123";

        assert.equal(isValidUuid(validUuid), true);
        assert.equal(isValidUuid(invalidUuid), false);
    });
});

