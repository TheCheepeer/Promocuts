import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    normalizeIp,
    isValidIp,
    matchCidr,
    getClientIp,
    isIpAllowed,
} from "../src/lib/security/ip.js";

describe("Utilitario de Seguranca - Normalizacao e Validacao de IP", () => {
    it("deve normalizar IPs IPv4 e IPv6 sem alteracoes indevidas", () => {
        assert.equal(normalizeIp("192.168.1.1"), "192.168.1.1");
        assert.equal(normalizeIp(" 127.0.0.1 "), "127.0.0.1");
        assert.equal(normalizeIp("::1"), "::1");
    });

    it("deve converter IPv4 mapeado em IPv6 (::ffff:) para IPv4 simples", () => {
        assert.equal(normalizeIp("::ffff:192.168.1.1"), "192.168.1.1");
        assert.equal(normalizeIp("::ffff:10.0.0.50"), "10.0.0.50");
    });

    it("deve validar corretamente se um endereco e IP valido", () => {
        assert.equal(isValidIp("127.0.0.1"), true);
        assert.equal(isValidIp("10.0.0.1"), true);
        assert.equal(isValidIp("255.255.255.255"), true);
        assert.equal(isValidIp("::1"), true);
        assert.equal(isValidIp("fe80::1"), true);
        assert.equal(isValidIp("2001:db8::8a2e:370:7334"), true);

        assert.equal(isValidIp("999.999.999.999"), false);
        assert.equal(isValidIp("1.2.3"), false);
        assert.equal(isValidIp("not-an-ip"), false);
        assert.equal(isValidIp(""), false);
    });
});

describe("Utilitario de Seguranca - Correspondencia de Faixas CIDR", () => {
    it("deve verificar sub-redes IPv4 em CIDR corretamente", () => {
        // Faixa Tailscale VPN: 100.64.0.0/10 (100.64.0.0 a 100.127.255.255)
        assert.equal(matchCidr("100.64.0.1", "100.64.0.0/10"), true);
        assert.equal(matchCidr("100.100.50.2", "100.64.0.0/10"), true);
        assert.equal(matchCidr("100.127.255.254", "100.64.0.0/10"), true);
        assert.equal(matchCidr("100.63.255.255", "100.64.0.0/10"), false);
        assert.equal(matchCidr("100.128.0.1", "100.64.0.0/10"), false);

        // Faixa privada classe A: 10.0.0.0/8
        assert.equal(matchCidr("10.0.0.1", "10.0.0.0/8"), true);
        assert.equal(matchCidr("10.254.254.254", "10.0.0.0/8"), true);
        assert.equal(matchCidr("11.0.0.1", "10.0.0.0/8"), false);

        // Faixa exata /32
        assert.equal(matchCidr("192.168.1.100", "192.168.1.100/32"), true);
        assert.equal(matchCidr("192.168.1.101", "192.168.1.100/32"), false);

        // Faixa universal /0
        assert.equal(matchCidr("1.2.3.4", "0.0.0.0/0"), true);
    });

    it("deve verificar sub-redes IPv6 em CIDR corretamente", () => {
        assert.equal(matchCidr("fe80::1", "fe80::/10"), true);
        assert.equal(matchCidr("febf::ffff", "fe80::/10"), true);
        assert.equal(matchCidr("fec0::1", "fe80::/10"), false);

        assert.equal(matchCidr("::1", "::1/128"), true);
        assert.equal(matchCidr("::2", "::1/128"), false);
    });

    it("deve rejeitar prefixos invalidos de CIDR de forma segura", () => {
        assert.equal(matchCidr("192.168.1.1", "192.168.1.0/33"), false);
        assert.equal(matchCidr("192.168.1.1", "192.168.1.0/-1"), false);
        assert.equal(matchCidr("192.168.1.1", "192.168.1.0/abc"), false);
        assert.equal(matchCidr("invalid", "10.0.0.0/8"), false);
    });
});

describe("Utilitario de Seguranca - Regras de Acesso de Rede (isIpAllowed)", () => {
    it("deve permitir acesso se a lista estiver vazia ou indefinida", () => {
        assert.equal(isIpAllowed("192.168.1.1", undefined), true);
        assert.equal(isIpAllowed("192.168.1.1", ""), true);
        assert.equal(isIpAllowed("192.168.1.1", "   "), true);
    });

    it("deve validar IPs individuais e blocos CIDR em lista separada por virgula", () => {
        const allowedConfig = "100.64.0.0/10, 10.0.0.0/8, 127.0.0.1, ::1";

        // IPs autorizados
        assert.equal(isIpAllowed("127.0.0.1", allowedConfig), true);
        assert.equal(isIpAllowed("100.64.5.10", allowedConfig), true);
        assert.equal(isIpAllowed("10.50.2.1", allowedConfig), true);
        assert.equal(isIpAllowed("::1", allowedConfig), true);

        // IPv4 mapeado em IPv6
        assert.equal(isIpAllowed("::ffff:127.0.0.1", allowedConfig), true);
        assert.equal(isIpAllowed("::ffff:10.0.0.1", allowedConfig), true);

        // IPs negados
        assert.equal(isIpAllowed("192.168.1.1", allowedConfig), false);
        assert.equal(isIpAllowed("203.0.113.1", allowedConfig), false);
        assert.equal(isIpAllowed("8.8.8.8", allowedConfig), false);
    });
});

describe("Utilitario de Seguranca - Extracao de IP (getClientIp)", () => {
    it("deve extrair o primeiro IP de x-forwarded-for quando presente", () => {
        const headers = new Headers({
            "x-forwarded-for": "203.0.113.195, 70.41.3.18, 150.172.238.178",
        });
        assert.equal(getClientIp(headers), "203.0.113.195");
    });

    it("deve extrair IP de x-real-ip quando x-forwarded-for nao estiver presente", () => {
        const headers = new Headers({
            "x-real-ip": "198.51.100.42",
        });
        assert.equal(getClientIp(headers), "198.51.100.42");
    });

    it("deve extrair IP de cf-connecting-ip quando fornecido", () => {
        const headers = new Headers({
            "cf-connecting-ip": "100.64.12.34",
        });
        assert.equal(getClientIp(headers), "100.64.12.34");
    });

    it("deve extrair IP a partir de objeto de requisicao NextRequest simulado", () => {
        const simulatedReq = {
            headers: new Headers(),
            ip: "10.0.0.99",
        };
        assert.equal(getClientIp(simulatedReq), "10.0.0.99");
    });

    it("deve retornar null se nenhum IP for encontrado", () => {
        const headers = new Headers();
        assert.equal(getClientIp(headers), null);
    });
});
