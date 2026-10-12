import { describe, it } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import {
    SOCIAL_ICON_STRATEGIES,
    getSocialIconStrategy,
    DefaultLinkIconStrategy,
    YouTubeIconStrategy,
    TikTokIconStrategy,
    InstagramIconStrategy,
    BilibiliIconStrategy,
    VimeoIconStrategy,
    TwitchIconStrategy,
    XIconStrategy,
    PixIconStrategy,
} from "../src/components/public/social-icon-strategies.js";

describe("Padrão Strategy para Renderização de Ícones Sociais (SocialIconStrategy)", () => {
    it("deve conter todas as estratégias registradas no catálogo unificado", () => {
        assert.ok(SOCIAL_ICON_STRATEGIES.length >= 30);

        // Verifica unicidade dos IDs primários
        const ids = SOCIAL_ICON_STRATEGIES.map((s) => s.id);
        const uniqueIds = new Set(ids);
        assert.equal(ids.length, uniqueIds.size);
    });

    it("deve recuperar estratégias por ID direto de forma insensível a maiúsculas", () => {
        assert.equal(getSocialIconStrategy("youtube").id, "youtube");
        assert.equal(getSocialIconStrategy("YOUTUBE").id, "youtube");
        assert.equal(getSocialIconStrategy("tiktok").id, "tiktok");
        assert.equal(getSocialIconStrategy("TIKTOK").id, "tiktok");
        assert.equal(getSocialIconStrategy("instagram").id, "instagram");
        assert.equal(getSocialIconStrategy("bilibili").id, "bilibili");
        assert.equal(getSocialIconStrategy("vimeo").id, "vimeo");
        assert.equal(getSocialIconStrategy("twitch").id, "twitch");
        assert.equal(getSocialIconStrategy("x").id, "x");
        assert.equal(getSocialIconStrategy("pix").id, "pix");
        assert.equal(getSocialIconStrategy("amazon").id, "amazon");
    });

    it("deve resolver aliases conhecidos para as estratégias oficiais correspondentes", () => {
        // shorts -> youtube
        const shortsStrategy = getSocialIconStrategy("shorts");
        assert.equal(shortsStrategy.id, "youtube");

        // reels -> instagram
        const reelsStrategy = getSocialIconStrategy("reels");
        assert.equal(reelsStrategy.id, "instagram");

        // twitter -> x
        const twitterStrategy = getSocialIconStrategy("twitter");
        assert.equal(twitterStrategy.id, "x");

        // globe / website -> site
        assert.equal(getSocialIconStrategy("globe").id, "site");
        assert.equal(getSocialIconStrategy("website").id, "site");
    });

    it("deve retornar DefaultLinkIconStrategy para valores nulos, vazios ou desconhecidos", () => {
        assert.equal(getSocialIconStrategy(null).id, "link");
        assert.equal(getSocialIconStrategy(undefined).id, "link");
        assert.equal(getSocialIconStrategy("").id, "link");
        assert.equal(getSocialIconStrategy("   ").id, "link");
        assert.equal(getSocialIconStrategy("plataforma_inexistente_xyz").id, "link");
        assert.equal(getSocialIconStrategy("link").id, "link");
    });

    it("deve renderizar nós React válidos para todas as estratégias registradas", () => {
        for (const strategy of SOCIAL_ICON_STRATEGIES) {
            const node = strategy.render("h-5 w-5");
            assert.ok(React.isValidElement(node), `Estratégia ${strategy.id} deve gerar um elemento React válido`);
            const props = (node as React.ReactElement<{ className?: string }>).props;
            assert.ok(
                props.className?.includes("h-5 w-5"),
                `Estratégia ${strategy.id} deve aplicar a classe css repassada`,
            );
        }
    });

    it("deve aplicar classe padrão h-4 w-4 quando invocada sem parâmetros", () => {
        const node = YouTubeIconStrategy.render();
        assert.ok(React.isValidElement(node));
        const props = (node as React.ReactElement<{ className?: string }>).props;
        assert.equal(props.className, "h-4 w-4");
    });
});

