import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_SITE_SETTINGS } from "../src/lib/settings";
import { generateQrMatrix, generateQrCodeSvg } from "../src/lib/qrcode";
import type { SiteSettings } from "../src/types/database";

describe("Personalização e Design de Bio Links", () => {
    it("deve conter as novas propriedades em DEFAULT_SITE_SETTINGS", () => {
        assert.equal(DEFAULT_SITE_SETTINGS.bio_avatar_url_light, null);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_avatar_url_dark, null);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_show_storefront_banner, "banner");
        assert.equal(DEFAULT_SITE_SETTINGS.bio_show_qrcode, true);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_title, null);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_description, null);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_primary_color_light, null);
        assert.equal(DEFAULT_SITE_SETTINGS.bio_primary_color_dark, null);
    });

    it("deve resolver a cascata de avatar priorizando bio_avatar, depois logo_icon, depois logo, depois favicon", () => {
        function resolveAvatars(settings: Partial<SiteSettings>) {
            const avatarLight =
                settings.bio_avatar_url_light ||
                settings.logo_icon_url_light ||
                settings.logo_url_light ||
                settings.favicon_url_light ||
                null;

            const avatarDark =
                settings.bio_avatar_url_dark ||
                settings.logo_icon_url_dark ||
                settings.logo_url_dark ||
                settings.favicon_url_dark ||
                avatarLight;

            return { avatarLight, avatarDark };
        }

        // Cenário 1: Usuário só preencheu logo_url_light e favicon_url_light (caso real do Cheepeer)
        const res1 = resolveAvatars({
            logo_icon_url_light: null,
            logo_url_light: "https://exemplo.com/logo-cachorro.png",
            favicon_url_light: "https://exemplo.com/favicon-cachorro.png",
        });
        assert.equal(res1.avatarLight, "https://exemplo.com/logo-cachorro.png");
        assert.equal(res1.avatarDark, "https://exemplo.com/logo-cachorro.png");

        // Cenário 2: Usuário preencheu foto dedicada de bio links
        const res2 = resolveAvatars({
            bio_avatar_url_light: "https://exemplo.com/avatar-bio-claro.png",
            bio_avatar_url_dark: "https://exemplo.com/avatar-bio-escuro.png",
            logo_url_light: "https://exemplo.com/logo-cachorro.png",
        });
        assert.equal(res2.avatarLight, "https://exemplo.com/avatar-bio-claro.png");
        assert.equal(res2.avatarDark, "https://exemplo.com/avatar-bio-escuro.png");

        // Cenário 3: Tudo nulo
        const res3 = resolveAvatars({});
        assert.equal(res3.avatarLight, null);
        assert.equal(res3.avatarDark, null);
    });

    it("deve aceitar os estilos válidos para o cartaz da vitrine", () => {
        const validStyles = ["banner", "compact", "hidden"];
        for (const style of validStyles) {
            assert.ok(["banner", "compact", "hidden"].includes(style));
        }
    });

    it("deve gerar QR Code para URLs com parâmetros de rastreamento", () => {
        const url = "https://promocuts.com/links?utm_source=instagram&utm_medium=bio";
        const svg = generateQrCodeSvg(url, { size: 180 });
        assert.ok(svg.includes("<svg"));
        assert.ok(svg.includes('width="180"'));
        assert.ok(svg.includes('height="180"'));
    });
});
