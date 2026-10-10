import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    isSafeExternalUrl,
    detectStoreFromUrl,
    parseHtmlMetadata,
} from "../src/lib/extractor/og-parser.js";

describe("Extrator Open Graph - Proteção contra SSRF (isSafeExternalUrl)", () => {
    it("deve autorizar URLs públicas legítimas com protocolos HTTP e HTTPS", () => {
        const validUrls = [
            "https://www.amazon.com.br/dp/B08N5WRWNW",
            "https://shopee.com.br/product/12345/67890",
            "https://produto.mercadolivre.com.br/MLB-123456-produto",
            "https://pt.aliexpress.com/item/100500123.html",
            "http://loja-exemplo.com.br/oferta",
        ];

        for (const url of validUrls) {
            assert.equal(
                isSafeExternalUrl(url),
                true,
                `Deveria autorizar URL segura: ${url}`,
            );
        }
    });

    it("deve rejeitar protocolos perigosos que não sejam HTTP ou HTTPS", () => {
        const dangerousProtocols = [
            "javascript:alert(1)",
            "file:///etc/passwd",
            "ftp://servidor-interno.local",
            "data:text/html;base64,PHNjcmlwdD4=",
            "gopher://servidor.interno",
        ];

        for (const url of dangerousProtocols) {
            assert.equal(
                isSafeExternalUrl(url),
                false,
                `Deveria rejeitar protocolo inseguro: ${url}`,
            );
        }
    });

    it("deve bloquear loopback, localhost e nomes de domínio de rede local", () => {
        const localHosts = [
            "http://localhost:3000/api",
            "https://meu-pc.localhost/teste",
            "http://127.0.0.1:8080/admin",
            "http://[::1]/secret",
            "http://servidor.local",
            "http://intranet.internal",
            "http://roteador.lan",
        ];

        for (const url of localHosts) {
            assert.equal(
                isSafeExternalUrl(url),
                false,
                `Deveria bloquear rede local/loopback: ${url}`,
            );
        }
    });

    it("deve bloquear faixas de IP privado e endereços de metadados de nuvem", () => {
        const privateIps = [
            "http://10.0.0.1/admin",
            "http://10.255.255.255/dados",
            "http://172.16.0.1/cluster",
            "http://172.31.255.255/config",
            "http://192.168.0.1/roteador",
            "http://192.168.1.254/status",
            "http://169.254.169.254/latest/meta-data/", // AWS Cloud Metadata
            "http://169.254.1.1/link-local",
        ];

        for (const url of privateIps) {
            assert.equal(
                isSafeExternalUrl(url),
                false,
                `Deveria bloquear IP privado/metadata: ${url}`,
            );
        }
    });
});

describe("Extrator Open Graph - Identificação de Lojas Parceiras (detectStoreFromUrl)", () => {
    it("deve reconhecer corretamente os domínios das principais plataformas de e-commerce", () => {
        assert.equal(
            detectStoreFromUrl("https://www.amazon.com.br/dp/B08N5WRWNW"),
            "Amazon",
        );
        assert.equal(detectStoreFromUrl("https://amzn.to/3xyz"), "Amazon");
        assert.equal(
            detectStoreFromUrl("https://shopee.com.br/product/123/456"),
            "Shopee",
        );
        assert.equal(detectStoreFromUrl("https://shp.ee/abc123"), "Shopee");
        assert.equal(
            detectStoreFromUrl("https://produto.mercadolivre.com.br/MLB-123"),
            "Mercado Livre",
        );
        assert.equal(
            detectStoreFromUrl("https://pt.aliexpress.com/item/100500.html"),
            "AliExpress",
        );
        assert.equal(
            detectStoreFromUrl("https://www.magazineluiza.com.br/item/123"),
            "Magalu",
        );
        assert.equal(
            detectStoreFromUrl("https://www.kabum.com.br/produto/456"),
            "Kabum",
        );
    });

    it("deve utilizar fallback de siteName para domínios não mapeados", () => {
        assert.equal(
            detectStoreFromUrl("https://loja-independente.com.br/item", "Loja do Zé"),
            "Loja do Zé",
        );
        assert.equal(
            detectStoreFromUrl("https://desconhecido.com/item", null),
            "Loja Parceira",
        );
    });
});

describe("Extrator Open Graph - Análise Sintática de HTML (parseHtmlMetadata)", () => {
    it("deve extrair metadados completos de Open Graph a partir de HTML válido", () => {
        const mockHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta property="og:title" content="Fone de Ouvido Sem Fio Bluetooth &amp; Cancelamento de Ruído" />
                <meta property="og:image" content="https://m.media-amazon.com/images/I/71xyz.jpg" />
                <meta property="og:site_name" content="Amazon.com.br" />
                <meta property="product:price:amount" content="249.90" />
                <title>Título Ignorado Quando og:title Existe</title>
            </head>
            <body></body>
            </html>
        `;

        const metadata = parseHtmlMetadata(mockHtml, "https://www.amazon.com.br/dp/B08");

        assert.equal(
            metadata.title,
            "Fone de Ouvido Sem Fio Bluetooth & Cancelamento de Ruído",
        );
        assert.equal(
            metadata.image,
            "https://m.media-amazon.com/images/I/71xyz.jpg",
        );
        assert.equal(metadata.price, 249.9);
        assert.equal(metadata.store, "Amazon");
        assert.equal(metadata.siteName, "Amazon.com.br");
    });

    it("deve resolver URLs de imagens relativas para absolutas", () => {
        const mockHtml = `
            <html>
            <head>
                <meta property="og:title" content="Camiseta Básica" />
                <meta property="og:image" content="/assets/imagens/camiseta.jpg" />
            </head>
            </html>
        `;

        const metadata = parseHtmlMetadata(mockHtml, "https://lojaexemplo.com.br/produto");

        assert.equal(
            metadata.image,
            "https://lojaexemplo.com.br/assets/imagens/camiseta.jpg",
        );
    });

    it("deve recorrer à tag <title> caso og:title esteja ausente", () => {
        const mockHtml = `
            <html>
            <head>
                <title>Mouse Gamer RGB 12000 DPI | Loja Oficial</title>
            </head>
            </html>
        `;

        const metadata = parseHtmlMetadata(mockHtml, "https://kabum.com.br/produto");

        assert.equal(
            metadata.title,
            "Mouse Gamer RGB 12000 DPI | Loja Oficial",
        );
    });
});

