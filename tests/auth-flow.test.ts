import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    sanitizeRedirectUrl,
    isEmailAuthorized,
} from "../src/lib/security/auth.js";

describe("Utilitario de Seguranca - Sanitizacao de Redirecionamento (sanitizeRedirectUrl)", () => {
    it("deve permitir rotas relativas internas seguras", () => {
        assert.equal(sanitizeRedirectUrl("/admin"), "/admin");
        assert.equal(sanitizeRedirectUrl("/admin/videos"), "/admin/videos");
        assert.equal(
            sanitizeRedirectUrl("/admin/settings?tab=branding"),
            "/admin/settings?tab=branding",
        );
        assert.equal(sanitizeRedirectUrl("/c/tecnologia"), "/c/tecnologia");
    });

    it("deve rejeitar tentativas de Open Redirect com protocolo relativo (//)", () => {
        assert.equal(sanitizeRedirectUrl("//evil.com"), "/admin");
        assert.equal(sanitizeRedirectUrl("//evil.com/phishing"), "/admin");
        assert.equal(sanitizeRedirectUrl("/\\evil.com"), "/admin");
    });

    it("deve rejeitar URLs absolutas externas com esquemas HTTP/HTTPS ou javascript:", () => {
        assert.equal(sanitizeRedirectUrl("https://phishing.site"), "/admin");
        assert.equal(sanitizeRedirectUrl("http://evil.com"), "/admin");
        assert.equal(sanitizeRedirectUrl("javascript:alert(1)"), "/admin");
    });

    it("deve usar o fallback padrao ou customizado para entradas nulas ou vazias", () => {
        assert.equal(sanitizeRedirectUrl(null), "/admin");
        assert.equal(sanitizeRedirectUrl(undefined), "/admin");
        assert.equal(sanitizeRedirectUrl(""), "/admin");
        assert.equal(sanitizeRedirectUrl("   "), "/admin");
        assert.equal(
            sanitizeRedirectUrl(null, "/admin/dashboard"),
            "/admin/dashboard",
        );
    });
});

describe("Utilitario de Seguranca - Whitelist de E-mail (isEmailAuthorized)", () => {
    const adminConfig = "proprietario@promocuts.com";

    it("deve autorizar quando os e-mails coincidirem perfeitamente", () => {
        assert.equal(
            isEmailAuthorized("proprietario@promocuts.com", adminConfig),
            true,
        );
    });

    it("deve tratar comparacao de e-mail de forma insensivel a maiusculas/minusculas", () => {
        assert.equal(
            isEmailAuthorized("PROPRIETARIO@PROMOCUTS.COM", adminConfig),
            true,
        );
        assert.equal(
            isEmailAuthorized("Proprietario@PromoCuts.com", adminConfig),
            true,
        );
    });

    it("deve ignorar espacos em branco nas bordas", () => {
        assert.equal(
            isEmailAuthorized("  proprietario@promocuts.com  ", adminConfig),
            true,
        );
    });

    it("deve rejeitar e-mails nao autorizados", () => {
        assert.equal(
            isEmailAuthorized("outro.usuario@gmail.com", adminConfig),
            false,
        );
        assert.equal(
            isEmailAuthorized("hacker@malicioso.com", adminConfig),
            false,
        );
        assert.equal(
            isEmailAuthorized("proprietario@promocuts.com.br", adminConfig),
            false,
        );
    });

    it("deve rejeitar entradas nulas, indefinidas ou configuracao vazia", () => {
        assert.equal(isEmailAuthorized(null, adminConfig), false);
        assert.equal(isEmailAuthorized(undefined, adminConfig), false);
        assert.equal(isEmailAuthorized("", adminConfig), false);
        assert.equal(
            isEmailAuthorized("proprietario@promocuts.com", undefined),
            false,
        );
        assert.equal(
            isEmailAuthorized("proprietario@promocuts.com", ""),
            false,
        );
    });
});
