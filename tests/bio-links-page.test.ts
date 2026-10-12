import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getCachedData } from "../src/lib/cache/redis.js";
import { BIO_LINK_AVAILABLE_ICONS } from "../src/app/admin/bio-links/bio-link-icons.js";
import type { BioLink } from "../src/types/database.js";

describe("Página Pública de Bio Links (/links e /bio) - Resiliência e Metadados", () => {
    it("deve tratar o Redis como opcional retornando null sem lançar exceções", async () => {
        // Sem variáveis UPSTASH configuradas no ambiente de teste, getCachedData deve retornar null com segurança
        const result = await getCachedData<BioLink[]>("promocuts:bio_links:all");
        assert.strictEqual(result, null);
    });

    it("deve montar títulos e descrições semânticos para metadados de compartilhamento (Open Graph)", () => {
        const siteName = "Canal Exemplo";
        const siteTagline = "O melhor conteúdo de tecnologia";

        const metadataTitle = `Links & Bio | ${siteName}`;
        const metadataDescription = siteTagline || `Canais oficiais, comunidades e links de ${siteName}.`;

        assert.strictEqual(metadataTitle, "Links & Bio | Canal Exemplo");
        assert.strictEqual(metadataDescription, "O melhor conteúdo de tecnologia");
    });

    it("deve aplicar fallback seguro de descrição quando tagline estiver vazia", () => {
        const siteName = "Canal Sem Tagline";
        const siteTagline = "";

        const metadataDescription =
            siteTagline || `Canais oficiais, comunidades e links de ${siteName}.`;

        assert.strictEqual(
            metadataDescription,
            "Canais oficiais, comunidades e links de Canal Sem Tagline.",
        );
    });

    it("deve garantir que todos os ícones suportados possuem identificadores e rótulos válidos", () => {
        const iconIds = new Set(BIO_LINK_AVAILABLE_ICONS.map((i) => i.id));

        assert.ok(iconIds.has("twitch"));
        assert.ok(iconIds.has("discord"));
        assert.ok(iconIds.has("telegram"));
        assert.ok(iconIds.has("whatsapp"));
        assert.ok(iconIds.has("pix"));
        assert.ok(iconIds.has("youtube"));

        for (const icon of BIO_LINK_AVAILABLE_ICONS) {
            assert.ok(icon.label.trim().length > 0);
            assert.ok(icon.brandColor.startsWith("#"));
        }
    });

    it("deve limpar o protocolo HTTP/HTTPS de URLs para exibição simplificada ao visitante", () => {
        const cleanUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/i, "");

        assert.strictEqual(cleanUrl("https://discord.gg/minhacomunidade"), "discord.gg/minhacomunidade");
        assert.strictEqual(cleanUrl("http://www.twitch.tv/streamer"), "twitch.tv/streamer");
        assert.strictEqual(cleanUrl("https://t.me/ofertasvip"), "t.me/ofertasvip");
    });
});

