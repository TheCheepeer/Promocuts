import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    isSafeExternalUrl,
    detectStoreFromUrl,
    parseHtmlMetadata,
    cleanProductTitle,
    parsePriceNumber,
    extractPriceFromHtml,
    extractRegularPriceFromHtml,
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

    it("deve limpar sufixos comuns de lojas parceiras através de cleanProductTitle", () => {
        assert.equal(
            cleanProductTitle("Playstation 4 Slim 1TB | Shopee Brasil"),
            "Playstation 4 Slim 1TB",
        );
        assert.equal(
            cleanProductTitle("Apple iPad Air 5th Gen - Amazon.com.br"),
            "Apple iPad Air 5th Gen",
        );
        assert.equal(
            cleanProductTitle("Smartphone Samsung Galaxy A15 - Magazine Luiza"),
            "Smartphone Samsung Galaxy A15",
        );
        assert.equal(
            cleanProductTitle("Cadeira Gamer Ergonômica | Kabum!"),
            "Cadeira Gamer Ergonômica",
        );
    });

    it("deve extrair dados de produto e BreadcrumbList a partir de JSON-LD", () => {
        const mockJsonLd = `
            <html>
            <head>
                <script type="application/ld+json">
                {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": "Controle DualSense PS5",
                    "image": "https://cdn.exemplo.com/dualsense.jpg",
                    "offers": {
                        "@type": "Offer",
                        "price": "429.90",
                        "priceCurrency": "BRL"
                    }
                }
                </script>
            </head>
            </html>
        `;

        const metadata = parseHtmlMetadata(mockJsonLd, "https://exemplo.com/produto");

        assert.equal(metadata.title, "Controle DualSense PS5");
        assert.equal(metadata.image, "https://cdn.exemplo.com/dualsense.jpg");
        assert.equal(metadata.price, 429.9);
    });

    it("deve extrair metadados da Shopee com content antecedendo property e data-rh", () => {
        const shopeeMock = `
            <!doctype html>
            <html>
            <head>
                <meta data-rh="true" content="Playstation 4 Slim - Console Original | Shopee Brasil" property="og:title"/>
                <meta data-rh="true" content="https://down-br.img.susercontent.com/file/sg-123" property="og:image"/>
                <meta data-rh="true" content="website" property="og:type"/>
            </head>
            <body></body>
            </html>
        `;

        const metadata = parseHtmlMetadata(
            shopeeMock,
            "https://shopee.com.br/product-i.544.190",
        );

        assert.equal(metadata.title, "Playstation 4 Slim - Console Original");
        assert.equal(
            metadata.image,
            "https://down-br.img.susercontent.com/file/sg-123",
        );
        assert.equal(metadata.store, "Shopee");
    });
});

describe("Extrator Open Graph - Conversão Numérica de Preço (parsePriceNumber)", () => {
    it("deve converter valores no formato brasileiro com separadores de milhar e centavos", () => {
        assert.equal(parsePriceNumber("R$ 1.499,90"), 1499.9);
        assert.equal(parsePriceNumber("R$ 3.899,00"), 3899);
        assert.equal(parsePriceNumber("249,50"), 249.5);
    });

    it("deve converter valores no formato padrão internacional/americano", () => {
        assert.equal(parsePriceNumber("1,499.90"), 1499.9);
        assert.equal(parsePriceNumber("249.90"), 249.9);
        assert.equal(parsePriceNumber("BRL 89.99"), 89.99);
    });

    it("deve retornar null para strings vazias, valores zerados ou inválidos", () => {
        assert.equal(parsePriceNumber(""), null);
        assert.equal(parsePriceNumber("R$ 0,00"), null);
        assert.equal(parsePriceNumber("invalido"), null);
        assert.equal(parsePriceNumber("-50.00"), null);
    });
});

describe("Extrator Open Graph - Extração de Preços em Marcações de E-commerce (extractPriceFromHtml)", () => {
    it("deve extrair preço a partir de meta tags semânticas (product:price:amount / og:price:amount)", () => {
        const html = `<html><head><meta property="product:price:amount" content="319.90" /></head></html>`;
        assert.equal(extractPriceFromHtml(html), 319.9);
    });

    it("deve extrair preço de microdados HTML com itemprop='price'", () => {
        const html = `<div><span itemprop="price" content="549.00">R$ 549,00</span></div>`;
        assert.equal(extractPriceFromHtml(html), 549);
    });

    it("deve extrair preço do buybox da Amazon com classe a-offscreen", () => {
        const html = `
            <div class="a-price a-size-medium a-color-price">
                <span class="a-offscreen">R$ 4.099,00</span>
                <span aria-hidden="true">R$ 4.099</span>
            </div>
        `;
        assert.equal(extractPriceFromHtml(html), 4099);
    });

    it("deve extrair fração de valor monetário do Mercado Livre (andes-money-amount__fraction)", () => {
        const html = `
            <span class="andes-money-amount__fraction">439,90</span>
        `;
        assert.equal(extractPriceFromHtml(html), 439.9);
    });

    it("deve extrair preço a partir de data-price ou data-product-price", () => {
        const html = `<button data-product-price="129.90">Comprar</button>`;
        assert.equal(extractPriceFromHtml(html), 129.9);
    });
});

describe("Extrator Open Graph - Extração Dupla de Preço Original e Promocional", () => {
    it("deve extrair tanto preço original quanto promocional e calcular oferta quando disponíveis", () => {
        const mockHtml = `
            <html>
            <head>
                <meta property="og:title" content="Monitor Gamer 144Hz" />
                <meta property="product:original_price:amount" content="1299.00" />
                <meta property="product:price:amount" content="899.00" />
            </head>
            </html>
        `;

        const metadata = parseHtmlMetadata(mockHtml, "https://exemplo.com/monitor");
        assert.equal(metadata.regularPrice, 1299);
        assert.equal(metadata.price, 899);
    });

    it("deve extrair preço riscado da Amazon como regularPrice", () => {
        const amazonHtml = `
            <div class="a-section">
                <div class="a-price a-text-price"><span class="a-offscreen">R$ 5.199,00</span></div>
                <div class="a-price"><span class="a-offscreen">R$ 4.099,00</span></div>
            </div>
        `;
        assert.equal(extractRegularPriceFromHtml(amazonHtml), 5199);
        assert.equal(extractPriceFromHtml(amazonHtml), 4099);
    });
});

