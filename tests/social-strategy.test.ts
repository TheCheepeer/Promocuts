import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    SOCIAL_PLATFORMS,
    getSocialPlatform,
    detectPlatformFromUrl,
    formatSocialUrl,
} from "../src/lib/social/strategies";

describe("Padrão Strategy para Redes Sociais e Canais de Criador", () => {
    it("deve conter todas as plataformas essenciais com integridade estrutural", () => {
        assert.ok(SOCIAL_PLATFORMS.length >= 30, "Deve suportar pelo menos 30 plataformas");

        for (const platform of SOCIAL_PLATFORMS) {
            assert.ok(platform.id, `A plataforma deve possuir um ID: ${JSON.stringify(platform)}`);
            assert.ok(platform.name, `A plataforma ${platform.id} deve possuir um nome legível`);
            assert.ok(platform.category, `A plataforma ${platform.id} deve possuir uma categoria`);
            assert.ok(platform.brandColor.startsWith("#"), `A plataforma ${platform.id} deve ter uma cor hexadecimal válida`);
            assert.equal(typeof platform.formatUrl, "function", `A plataforma ${platform.id} deve ter função formatUrl`);
        }
    });

    it("deve recuperar a estratégia por ID corretamente", () => {
        const youtube = getSocialPlatform("youtube");
        assert.equal(youtube.id, "youtube");
        assert.equal(youtube.name, "YouTube");

        const reddit = getSocialPlatform("reddit");
        assert.equal(reddit.id, "reddit");
        assert.equal(reddit.name, "Reddit");

        const unknown = getSocialPlatform("plataforma_desconhecida");
        assert.equal(unknown.id, "link", "Deve fazer fallback para Link Externo genérico");
    });

    it("deve autodetectar plataformas a partir de URLs populares", () => {
        const testCases: [string, string][] = [
            ["https://youtube.com/@meucanal", "youtube"],
            ["https://youtu.be/abc123xyz", "youtube"],
            ["https://tiktok.com/@criador", "tiktok"],
            ["https://instagram.com/promocuts", "instagram"],
            ["https://reddit.com/r/promocoes", "reddit"],
            ["https://twitch.tv/streamer", "twitch"],
            ["https://discord.gg/comunidade", "discord"],
            ["https://open.spotify.com/playlist/123", "spotify"],
            ["https://github.com/TheCheepeer/Promocuts", "github"],
            ["https://wa.me/5511999999999", "whatsapp"],
            ["https://t.me/meugrupo", "telegram"],
            ["https://steamcommunity.com/id/gamer", "steam"],
            ["https://kick.com/streamer", "kick"],
            ["https://threads.net/@perfil", "threads"],
            ["https://pinterest.com/quadro", "pinterest"],
        ];

        for (const [url, expectedId] of testCases) {
            const detected = detectPlatformFromUrl(url);
            assert.ok(detected, `Deveria ter detectado a plataforma para a URL: ${url}`);
            assert.equal(detected?.id, expectedId, `URL ${url} deveria mapear para ${expectedId}`);
        }
    });

    it("deve formatar handles sem prefixo adicionando o link base", () => {
        assert.equal(
            formatSocialUrl("instagram", "meu_perfil"),
            "https://instagram.com/meu_perfil",
        );
        assert.equal(
            formatSocialUrl("instagram", "@meu_perfil"),
            "https://instagram.com/meu_perfil",
        );
        assert.equal(
            formatSocialUrl("tiktok", "criador_oficial"),
            "https://tiktok.com/@criador_oficial",
        );
        assert.equal(
            formatSocialUrl("youtube", "canal_viral"),
            "https://youtube.com/@canal_viral",
        );
    });

    it("deve preservar URLs absolutas completas sem duplicação de prefixos", () => {
        const fullUrl = "https://instagram.com/promocuts_oficial";
        assert.equal(formatSocialUrl("instagram", fullUrl), fullUrl);

        const customReddit = "https://www.reddit.com/user/promocuts";
        assert.equal(formatSocialUrl("reddit", customReddit), customReddit);
    });
});

