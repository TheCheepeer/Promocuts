import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { isIpAllowed, normalizeIp } from "../src/lib/security/ip.js";
import {
    isEmailAuthorized,
    sanitizeRedirectUrl,
} from "../src/lib/security/auth.js";
import { isValidUuid, sanitizeHeader } from "../src/lib/telemetry.js";
import {
    parseVideoUrl,
    isValidVideoUrl,
    getEmbedUrl,
} from "../src/lib/embeds/parser.js";

describe("Auditoria de Seguranca - Controle de Acesso e Whitelist", () => {
    const adminEmail = "proprietario@promocuts.com";

    it("deve rejeitar usuarios autenticados fora da whitelist com 403", () => {
        const untrustedEmails = [
            "invasor@evil.com",
            "admin@outradominio.com",
            "proprietario@promocuts.com.br",
            "proprietario@gmail.com",
            "admin@promocuts.com",
        ];

        for (const email of untrustedEmails) {
            assert.equal(
                isEmailAuthorized(email, adminEmail),
                false,
                `Email nao autorizado '${email}' nao deve ter acesso ao /admin`,
            );
        }
    });

    it("deve autorizar estritamente o e-mail do proprietario independentemente de case", () => {
        assert.equal(
            isEmailAuthorized("proprietario@promocuts.com", adminEmail),
            true,
        );
        assert.equal(
            isEmailAuthorized("PROPRIETARIO@PROMOCUTS.COM", adminEmail),
            true,
        );
        assert.equal(
            isEmailAuthorized("  proprietario@promocuts.com  ", adminEmail),
            true,
        );
    });

    it("deve bloquear acesso por IP quando configurada lista restrita (VPN Guard)", () => {
        const vpnWhitelist = "100.64.0.0/10,192.168.1.0/24,127.0.0.1";

        // IPs fora da VPN devem ser rejeitados
        assert.equal(isIpAllowed("203.0.113.195", vpnWhitelist), false);
        assert.equal(isIpAllowed("8.8.8.8", vpnWhitelist), false);
        assert.equal(isIpAllowed("198.51.100.1", vpnWhitelist), false);

        // IPs dentro da VPN ou loopback devem ser autorizados
        assert.equal(isIpAllowed("100.64.10.5", vpnWhitelist), true);
        assert.equal(isIpAllowed("192.168.1.50", vpnWhitelist), true);
        assert.equal(isIpAllowed("127.0.0.1", vpnWhitelist), true);
        assert.equal(isIpAllowed("::ffff:127.0.0.1", vpnWhitelist), true);
    });
});

describe("Auditoria de Seguranca - Sanitizacao de Redirecionamento (Open Redirect)", () => {
    it("deve impedir evasao de redirecionamento com protocolo relativo //", () => {
        const payloads = [
            "//evil.com",
            "//evil.com/phishing",
            "//attacker.org?login=true",
            "/\\attacker.com",
            "\\\\evil.com",
        ];

        for (const payload of payloads) {
            const sanitized = sanitizeRedirectUrl(payload, "/admin");
            assert.equal(
                sanitized,
                "/admin",
                `Payload de open redirect '${payload}' deve sofrer fallback seguro para /admin`,
            );
        }
    });

    it("deve impedir esquemas perigosos (javascript, data, http absoluto)", () => {
        const payloads = [
            "javascript:alert(document.cookie)",
            "data:text/html,<script>alert(1)</script>",
            "https://attacker.site/login",
            "http://malicious.net/session",
        ];

        for (const payload of payloads) {
            const sanitized = sanitizeRedirectUrl(payload, "/admin");
            assert.equal(
                sanitized,
                "/admin",
                `Esquema inseguro '${payload}' deve ser bloqueado`,
            );
        }
    });

    it("deve preservar caminhos administrativos e publicos internos legitimos", () => {
        assert.equal(sanitizeRedirectUrl("/admin/videos"), "/admin/videos");
        assert.equal(
            sanitizeRedirectUrl("/admin/settings?tab=branding"),
            "/admin/settings?tab=branding",
        );
        assert.equal(sanitizeRedirectUrl("/c/eletronicos"), "/c/eletronicos");
        assert.equal(
            sanitizeRedirectUrl("/v/corte-viral-1"),
            "/v/corte-viral-1",
        );
    });
});

describe("Auditoria de Seguranca - Telemetria e Prevencao de DoS", () => {
    it("deve rejeitar identificadores UUID adulterados ou malformados", () => {
        const maliciousIds = [
            "'; DROP TABLE affiliate_clicks; --",
            "<script>alert(1)</script>",
            "../../etc/passwd",
            "12345678-1234-1234-1234-1234567890123",
            "not-a-valid-uuid",
            "",
            null,
            undefined,
        ];

        for (const id of maliciousIds) {
            assert.equal(
                isValidUuid(id),
                false,
                `Identificador malicioso ou invalido '${id}' deve ser rejeitado`,
            );
        }
    });

    it("deve truncar cabecalhos User-Agent a 512 caracteres para prevenir Storage DoS", () => {
        const longUserAgent = "A".repeat(1000);
        const sanitized = sanitizeHeader(longUserAgent, 512);

        assert.equal(sanitized?.length, 512);
        assert.equal(sanitized, "A".repeat(512));
    });

    it("deve truncar cabecalhos Referrer a 1024 caracteres", () => {
        const longReferrer = "https://example.com/" + "b".repeat(2000);
        const sanitized = sanitizeHeader(longReferrer, 1024);

        assert.equal(sanitized?.length, 1024);
    });
});

describe("Auditoria de Seguranca - Motor de Embeds e Isolamento de Iframe", () => {
    it("deve rejeitar URLs com esquemas maliciosos ou SSRF", () => {
        const maliciousUrls = [
            "javascript:alert(1)",
            "data:text/html,<h1>XSS</h1>",
            "file:///etc/passwd",
            "ftp://ftp.example.com",
            "http://169.254.169.254/latest/meta-data/",
            "http://localhost:3000/admin",
            "https://evil.com/video/123456",
        ];

        for (const url of maliciousUrls) {
            assert.equal(
                isValidVideoUrl(url),
                false,
                `URL maliciosa ou nao autorizada '${url}' deve ser rejeitada`,
            );
            assert.equal(
                parseVideoUrl(url),
                null,
                `Parser deve retornar null para URL '${url}'`,
            );
        }
    });

    it("deve gerar URL de embed YouTube utilizando dominio privacy-enhanced (youtube-nocookie)", () => {
        const shortsUrl = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
        const embedUrl = getEmbedUrl("shorts", "dQw4w9WgXcQ");

        assert.match(
            embedUrl,
            /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
            "YouTube Shorts deve utilizar youtube-nocookie.com para preservar privacidade",
        );
    });
});

describe("Auditoria de Seguranca - Cabecalhos Defensivos no Next.js (next.config.ts)", () => {
    const nextConfigPath = path.resolve(process.cwd(), "next.config.ts");

    it("deve conter o arquivo de configuracao do Next.js", () => {
        assert.equal(
            fs.existsSync(nextConfigPath),
            true,
            "next.config.ts deve existir",
        );
    });

    it("nao deve conter output standalone apos remocao do Docker", () => {
        const content = fs.readFileSync(nextConfigPath, "utf-8");
        assert.equal(
            content.includes('output: "standalone"'),
            false,
            "next.config.ts nao deve usar output standalone no modelo serverless",
        );
    });

    it("deve aplicar cabecalhos defensivos essenciais de seguranca", () => {
        const content = fs.readFileSync(nextConfigPath, "utf-8");

        assert.match(
            content,
            /X-Content-Type-Options/i,
            "Deve configurar X-Content-Type-Options",
        );
        assert.match(
            content,
            /nosniff/i,
            "Deve aplicar nosniff para prevenir MIME confusion",
        );
        assert.match(
            content,
            /X-Frame-Options/i,
            "Deve configurar X-Frame-Options",
        );
        assert.match(
            content,
            /SAMEORIGIN/i,
            "Deve aplicar SAMEORIGIN para prevenir clickjacking",
        );
        assert.match(
            content,
            /Referrer-Policy/i,
            "Deve configurar Referrer-Policy",
        );
        assert.match(
            content,
            /strict-origin-when-cross-origin/i,
            "Deve restringir envio de referrers sensiveis",
        );
        assert.match(
            content,
            /Permissions-Policy/i,
            "Deve restringir recursos sensiveis via Permissions-Policy",
        );
    });

    it("deve configurar Content-Security-Policy autorizando estritamente reprodutores oficiais", () => {
        const content = fs.readFileSync(nextConfigPath, "utf-8");

        assert.match(content, /Content-Security-Policy/i);
        assert.match(content, /https:\/\/www\.tiktok\.com/);
        assert.match(content, /https:\/\/www\.instagram\.com/);
        assert.match(content, /https:\/\/www\.youtube\.com/);
        assert.match(content, /https:\/\/www\.youtube-nocookie\.com/);
    });
});
