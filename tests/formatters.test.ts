import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    formatCurrency,
    formatNumber,
    formatCompactNumber,
    formatDiscountPercentage,
    formatDiscountBadge,
    slugify,
} from "../src/lib/formatters.js";

describe("Utilitarios de Formatacao - Moeda (formatCurrency)", () => {
    it("deve formatar numeros decimais no padrao brasileiro", () => {
        assert.equal(formatCurrency(129.9), "R$ 129,90");
        assert.equal(formatCurrency(19.99), "R$ 19,99");
    });

    it("deve formatar valores inteiros e de milhares", () => {
        assert.equal(formatCurrency(1500), "R$ 1.500,00");
        assert.equal(formatCurrency(12500.5), "R$ 12.500,50");
    });

    it("deve formatar zero corretamente", () => {
        assert.equal(formatCurrency(0), "R$ 0,00");
    });

    it("deve tratar strings numericas com ponto, virgula ou formato BR", () => {
        assert.equal(formatCurrency("49.99"), "R$ 49,99");
        assert.equal(formatCurrency("49,99"), "R$ 49,99");
        assert.equal(formatCurrency("1.234,56"), "R$ 1.234,56");
    });

    it("deve retornar R$ 0,00 para entradas invalidas, vazias ou nulas", () => {
        assert.equal(formatCurrency(null), "R$ 0,00");
        assert.equal(formatCurrency(undefined), "R$ 0,00");
        assert.equal(formatCurrency(""), "R$ 0,00");
        assert.equal(formatCurrency("abc"), "R$ 0,00");
        assert.equal(formatCurrency(NaN), "R$ 0,00");
    });
});

describe("Utilitarios de Formatacao - Numeros (formatNumber)", () => {
    it("deve formatar com separador de milhar brasileiro", () => {
        assert.equal(formatNumber(15400), "15.400");
        assert.equal(formatNumber(1000000), "1.000.000");
        assert.equal(formatNumber(950), "950");
    });

    it("deve tratar zero e valores nulos", () => {
        assert.equal(formatNumber(0), "0");
        assert.equal(formatNumber(null), "0");
        assert.equal(formatNumber(undefined), "0");
    });
});

describe("Utilitarios de Formatacao - Metricas Compactas (formatCompactNumber)", () => {
    it("deve exibir valores menores que 1000 como numero simples", () => {
        assert.equal(formatCompactNumber(0), "0");
        assert.equal(formatCompactNumber(450), "450");
        assert.equal(formatCompactNumber(999), "999");
    });

    it("deve exibir milhares compactados", () => {
        assert.equal(formatCompactNumber(1000), "1 mil");
        assert.equal(formatCompactNumber(1500), "1,5 mil");
        assert.equal(formatCompactNumber(25400), "25,4 mil");
    });

    it("deve exibir milhoes compactados", () => {
        assert.equal(formatCompactNumber(1000000), "1 mi");
        assert.equal(formatCompactNumber(2500000), "2,5 mi");
    });

    it("deve tratar valores nulos e invalidos", () => {
        assert.equal(formatCompactNumber(null), "0");
        assert.equal(formatCompactNumber(undefined), "0");
        assert.equal(formatCompactNumber("invalido"), "0");
    });
});

describe("Utilitarios de Formatacao - Descontos", () => {
    it("deve calcular a porcentagem correta de desconto", () => {
        assert.equal(formatDiscountPercentage(100, 70), 30);
        assert.equal(formatDiscountPercentage(200, 150), 25);
        assert.equal(formatDiscountPercentage(100, 33.3), 67);
    });

    it("deve retornar 0 quando nao houver desconto ou o preco promocional for maior", () => {
        assert.equal(formatDiscountPercentage(100, 100), 0);
        assert.equal(formatDiscountPercentage(100, 120), 0);
    });

    it("deve retornar 0 para precos nulos, negativos ou invalidos", () => {
        assert.equal(formatDiscountPercentage(0, 50), 0);
        assert.equal(formatDiscountPercentage(100, 0), 0);
        assert.equal(formatDiscountPercentage(null, 50), 0);
        assert.equal(formatDiscountPercentage(100, null), 0);
    });

    it("deve gerar crachas visuais de desconto corretos com formatDiscountBadge", () => {
        assert.equal(formatDiscountBadge(100, 70), "-30%");
        assert.equal(formatDiscountBadge(200, 150), "-25%");
        assert.equal(formatDiscountBadge(100, 100), "");
        assert.equal(formatDiscountBadge(null, null), "");
    });
});

describe("Utilitarios de Formatacao - Gerador de Slug (slugify)", () => {
    it("deve converter textos com acentos e espacos em slugs limpos", () => {
        assert.equal(
            slugify("Promoção de Fone Sem Fio"),
            "promocao-de-fone-sem-fio",
        );
        assert.equal(
            slugify("Cafeteira Elétrica 110V Inox"),
            "cafeteira-eletrica-110v-inox",
        );
    });

    it("deve remover caracteres especiais, pontuacoes e parenteses", () => {
        assert.equal(
            slugify("Super Oferta: 50% OFF (Imperdível!)"),
            "super-oferta-50-off-imperdivel",
        );
    });

    it("deve condensar espacos, underscores e hifens repetidos", () => {
        assert.equal(
            slugify("   câmera___4k---ultra   hd   "),
            "camera-4k-ultra-hd",
        );
    });

    it("deve retornar string vazia para entradas invalidas", () => {
        assert.equal(slugify(""), "");
        // @ts-expect-error teste com tipo invalido
        assert.equal(slugify(null), "");
        // @ts-expect-error teste com tipo invalido
        assert.equal(slugify(undefined), "");
    });
});
