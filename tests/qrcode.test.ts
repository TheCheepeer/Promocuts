import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateQrMatrix, generateQrCodeSvg } from "../src/lib/qrcode";

describe("Gerador de QR Code em SVG Puro", () => {
    it("deve gerar matriz quadrada de módulos para uma URL padrão", () => {
        const matrix = generateQrMatrix("https://promocuts.com/links");
        assert.ok(matrix.length >= 21, "O tamanho da matriz deve ser pelo menos 21x21");
        assert.equal(matrix.length, matrix[0].length, "A matriz deve ser perfeitamente quadrada");
    });

    it("deve conter os 3 padrões de localização (Finder patterns) nos cantos", () => {
        const matrix = generateQrMatrix("https://promocuts.com/links");
        const size = matrix.length;

        // Canto superior esquerdo (0,0 a 6,6)
        assert.equal(matrix[0][0], true);
        assert.equal(matrix[0][6], true);
        assert.equal(matrix[6][0], true);
        assert.equal(matrix[6][6], true);

        // Canto superior direito (0, size-7 a 6, size-1)
        assert.equal(matrix[0][size - 7], true);
        assert.equal(matrix[0][size - 1], true);
        assert.equal(matrix[6][size - 7], true);
        assert.equal(matrix[6][size - 1], true);

        // Canto inferior esquerdo (size-7, 0 a size-1, 6)
        assert.equal(matrix[size - 7][0], true);
        assert.equal(matrix[size - 7][6], true);
        assert.equal(matrix[size - 1][0], true);
        assert.equal(matrix[size - 1][6], true);
    });

    it("deve gerar SVG válido contendo viewBox e elementos esperados", () => {
        const svg = generateQrCodeSvg("https://promocuts.com/links", {
            size: 200,
            bgColor: "#ffffff",
            fgColor: "#000000",
        });

        assert.ok(svg.startsWith("<svg"), "Deve iniciar com tag <svg");
        assert.ok(svg.endsWith("</svg>"), "Deve fechar com tag </svg>");
        assert.ok(svg.includes('viewBox="0 0'), "Deve conter viewBox");
        assert.ok(svg.includes('<rect width="100%" height="100%" fill="#ffffff"'), "Deve conter o fundo retangular");
        assert.ok(svg.includes('<path d="M'), "Deve conter o elemento path com as coordenadas vetoriais");
    });
});
