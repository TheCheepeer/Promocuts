import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    STORE_STRATEGIES,
    getStoreStrategy,
    detectStoreFromUrl,
    parsePriceNumber,
    AmazonStoreStrategy,
    ShopeeStoreStrategy,
    MercadoLivreStoreStrategy,
    AliExpressStoreStrategy,
    MagaluStoreStrategy,
    KabumStoreStrategy,
    CasasBahiaStoreStrategy,
    AmericanasStoreStrategy,
    DefaultStoreStrategy,
} from "../src/lib/extractor/store-strategies.js";

describe("Padrão Strategy de Lojas Parceiras - Catálogo e Registro", () => {
    it("deve conter todas as 8 lojas oficiais mapeadas no catálogo STORE_STRATEGIES", () => {
        const ids = STORE_STRATEGIES.map((s) => s.id);
        assert.deepEqual(ids, [
            "amazon",
            "shopee",
            "mercadolivre",
            "aliexpress",
            "magalu",
            "kabum",
            "casasbahia",
            "americanas",
        ]);
    });

    it("deve garantir que cada estratégia possui id, nome, domínios e método matchesUrl", () => {
        for (const strategy of STORE_STRATEGIES) {
            assert.ok(strategy.id.length > 0, `Estratégia deve ter id válido: ${strategy.id}`);
            assert.ok(strategy.name.length > 0, `Estratégia deve ter nome válido: ${strategy.id}`);
            assert.ok(Array.isArray(strategy.domains), `Domínios deve ser array: ${strategy.id}`);
            assert.equal(typeof strategy.matchesUrl, "function", `matchesUrl deve ser função: ${strategy.id}`);
        }
    });
});

describe("Padrão Strategy de Lojas - Resolução por Domínio e Nome (getStoreStrategy)", () => {
    it("deve resolver Amazon para URLs padrão e links encurtados amzn.to", () => {
        const strategy1 = getStoreStrategy("https://www.amazon.com.br/dp/B08N5WRWNW");
        assert.equal(strategy1.id, "amazon");
        assert.equal(strategy1.name, "Amazon");

        const strategy2 = getStoreStrategy("https://amzn.to/3xyz");
        assert.equal(strategy2.id, "amazon");
    });

    it("deve resolver Shopee para URLs padrão e links encurtados shp.ee", () => {
        const strategy1 = getStoreStrategy("https://shopee.com.br/product/123/456");
        assert.equal(strategy1.id, "shopee");
        assert.equal(strategy1.name, "Shopee");

        const strategy2 = getStoreStrategy("https://shp.ee/abc");
        assert.equal(strategy2.id, "shopee");
    });

    it("deve resolver Mercado Livre para domínios mercadolivre, mercadolibre e meli.la", () => {
        const strategy1 = getStoreStrategy("https://produto.mercadolivre.com.br/MLB-123");
        assert.equal(strategy1.id, "mercadolivre");
        assert.equal(strategy1.name, "Mercado Livre");

        const strategy2 = getStoreStrategy("https://articulo.mercadolibre.com/MLM-456");
        assert.equal(strategy2.id, "mercadolivre");

        const strategy3 = getStoreStrategy("https://meli.la/abc");
        assert.equal(strategy3.id, "mercadolivre");
    });

    it("deve resolver AliExpress", () => {
        const strategy = getStoreStrategy("https://pt.aliexpress.com/item/100500123.html");
        assert.equal(strategy.id, "aliexpress");
        assert.equal(strategy.name, "AliExpress");
    });

    it("deve resolver Magazine Luiza para magazineluiza.com.br e magalu.", () => {
        const strategy1 = getStoreStrategy("https://www.magazineluiza.com.br/produto/123");
        assert.equal(strategy1.id, "magalu");
        assert.equal(strategy1.name, "Magalu");

        const strategy2 = getStoreStrategy("https://m.magalu.com/produto/456");
        assert.equal(strategy2.id, "magalu");
    });

    it("deve resolver KaBuM!", () => {
        const strategy = getStoreStrategy("https://www.kabum.com.br/produto/789");
        assert.equal(strategy.id, "kabum");
        assert.equal(strategy.name, "Kabum");
    });

    it("deve resolver Casas Bahia", () => {
        const strategy = getStoreStrategy("https://www.casasbahia.com.br/produto/101112");
        assert.equal(strategy.id, "casasbahia");
        assert.equal(strategy.name, "Casas Bahia");
    });

    it("deve resolver Americanas", () => {
        const strategy = getStoreStrategy("https://www.americanas.com.br/produto/131415");
        assert.equal(strategy.id, "americanas");
        assert.equal(strategy.name, "Americanas");
    });

    it("deve resolver por siteName quando a URL não contiver o domínio mapeado", () => {
        const strategy = getStoreStrategy("https://link-redirecionador.com.br/oferta", "Amazon Brasil");
        assert.equal(strategy.id, "amazon");
    });

    it("deve retornar DefaultStoreStrategy com nome personalizado para lojas não mapeadas", () => {
        const strategy = getStoreStrategy("https://minhaloja.com.br/produto", "Minha Loja Nerd");
        assert.equal(strategy.id, "default");
        assert.equal(strategy.name, "Minha Loja Nerd");
    });

    it("deve retornar DefaultStoreStrategy com Loja Parceira para domínios anônimos", () => {
        const strategy = getStoreStrategy("https://loja-desconhecida.com/item");
        assert.equal(strategy.id, "default");
        assert.equal(strategy.name, "Loja Parceira");
    });

    it("deve detectar o nome da loja via detectStoreFromUrl de forma consistente", () => {
        assert.equal(detectStoreFromUrl("https://www.amazon.com.br/dp/B08N5WRWNW"), "Amazon");
        assert.equal(detectStoreFromUrl("https://shopee.com.br/item"), "Shopee");
        assert.equal(detectStoreFromUrl("https://loja-generica.com.br/p", "Tech Store"), "Tech Store");
        assert.equal(detectStoreFromUrl("https://loja-generica.com.br/p"), "Loja Parceira");
    });
});

describe("Padrão Strategy de Lojas - Sanitização de Títulos (cleanTitle)", () => {
    it("deve remover sufixos da Amazon nos títulos", () => {
        const raw = "Kindle Paperwhite 16GB Tela 6.8 Polegadas - Amazon.com.br";
        assert.equal(AmazonStoreStrategy.cleanTitle!(raw), "Kindle Paperwhite 16GB Tela 6.8 Polegadas");
    });

    it("deve remover sufixos da Shopee nos títulos", () => {
        const raw = "Fone de Ouvido Bluetooth Sem Fio | Shopee Brasil";
        assert.equal(ShopeeStoreStrategy.cleanTitle!(raw), "Fone de Ouvido Bluetooth Sem Fio");
    });

    it("deve remover sufixos do Mercado Livre nos títulos", () => {
        const raw = "Monitor Gamer 24 Polegadas 144Hz : Mercado Livre";
        assert.equal(MercadoLivreStoreStrategy.cleanTitle!(raw), "Monitor Gamer 24 Polegadas 144Hz");
    });

    it("deve remover sufixos da Magalu nos títulos", () => {
        const raw = "Smart TV 50 Polegadas 4K Ultra HD - Magazine Luiza";
        assert.equal(MagaluStoreStrategy.cleanTitle!(raw), "Smart TV 50 Polegadas 4K Ultra HD");
    });

    it("deve remover sufixos do KaBuM! nos títulos", () => {
        const raw = "Teclado Mecânico RGB Switch Blue | KaBuM!";
        assert.equal(KabumStoreStrategy.cleanTitle!(raw), "Teclado Mecânico RGB Switch Blue");
    });

    it("deve remover sufixos gerais em DefaultStoreStrategy", () => {
        const defaultStrategy = new DefaultStoreStrategy();
        assert.equal(
            defaultStrategy.cleanTitle("Console de Videogame 1TB - Casas Bahia"),
            "Console de Videogame 1TB",
        );
        assert.equal(
            defaultStrategy.cleanTitle("Smartphone 5G 128GB | Americanas"),
            "Smartphone 5G 128GB",
        );
    });
});

describe("Padrão Strategy de Lojas - Conversão Numérica de Preço (parsePriceNumber)", () => {
    it("deve converter formatos em Real (BRL) corretamente", () => {
        assert.equal(parsePriceNumber("R$ 1.299,90"), 1299.9);
        assert.equal(parsePriceNumber("BRL 49,99"), 49.99);
        assert.equal(parsePriceNumber("15,50"), 15.5);
        assert.equal(parsePriceNumber("1500"), 1500);
    });

    it("deve converter formatos internacionais (USD, EUR, GBP) com separador de ponto", () => {
        assert.equal(parsePriceNumber("$ 1,299.99"), 1299.99);
        assert.equal(parsePriceNumber("USD 24.50"), 24.5);
        assert.equal(parsePriceNumber("€ 99.90"), 99.9);
        assert.equal(parsePriceNumber("£ 149.00"), 149);
    });

    it("deve retornar null para valores inválidos, zero ou negativos", () => {
        assert.equal(parsePriceNumber(""), null);
        assert.equal(parsePriceNumber("indisponível"), null);
        assert.equal(parsePriceNumber("R$ 0,00"), null);
        assert.equal(parsePriceNumber("-15.00"), null);
    });
});

describe("Padrão Strategy de Lojas - Extração Específica de Preço e Preço Riscado", () => {
    it("deve extrair preço atual da Amazon ignorando a classe a-text-price do preço riscado", () => {
        const mockHtml = `
            <div class="a-section">
                <span class="a-price a-text-price"><span class="a-offscreen">R$ 399,00</span></span>
                <span class="a-price"><span class="a-offscreen">R$ 299,00</span></span>
            </div>
        `;
        const price = AmazonStoreStrategy.extractPrice!(mockHtml);
        assert.equal(price, 299);
    });

    it("deve extrair preço riscado (regular) da Amazon a partir de a-text-price", () => {
        const mockHtml = `
            <div class="a-section">
                <span class="a-price a-text-price"><span class="a-offscreen">R$ 450,00</span></span>
                <span class="a-price"><span class="a-offscreen">R$ 350,00</span></span>
            </div>
        `;
        const regularPrice = AmazonStoreStrategy.extractRegularPrice!(mockHtml);
        assert.equal(regularPrice, 450);
    });

    it("deve extrair fração de preço corrente do Mercado Livre", () => {
        const mockHtml = `
            <div class="ui-pdp-price">
                <span class="andes-money-amount andes-money-amount--previous">
                    <span class="andes-money-amount__fraction">2.199</span>
                </span>
                <span class="andes-money-amount">
                    <span class="andes-money-amount__fraction">1.799</span>
                </span>
            </div>
        `;
        const price = MercadoLivreStoreStrategy.extractPrice!(mockHtml);
        assert.equal(price, 1799);
    });

    it("deve extrair preço anterior (riscado) do Mercado Livre", () => {
        const mockHtml = `
            <div class="ui-pdp-price">
                <div class="andes-money-amount--previous">
                    <span class="andes-money-amount__fraction">2.500</span>
                </div>
            </div>
        `;
        const regularPrice = MercadoLivreStoreStrategy.extractRegularPrice!(mockHtml);
        assert.equal(regularPrice, 2500);
    });
});
