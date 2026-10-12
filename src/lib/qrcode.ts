/**
 * Gerador de QR Code em SVG Vetorial
 * Repositório: PromoCuts
 * Utiliza o motor canônico padrão da indústria para garantir 100% de conformidade com leitores de smartphones.
 */

import QRCode from "qrcode";

export type QrCodeOptions = {
    size?: number;
    margin?: number;
    padding?: number;
    fgColor?: string;
    bgColor?: string;
    darkColor?: string;
    lightColor?: string;
};

/**
 * Retorna a matriz booleana de módulos do QR Code gerado para o texto.
 */
export function generateQrMatrix(text: string): boolean[][] {
    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const size = qr.modules.size;
    const matrix: boolean[][] = [];

    for (let r = 0; r < size; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < size; c++) {
            row.push(qr.modules.get(r, c) === 1);
        }
        matrix.push(row);
    }

    return matrix;
}

/**
 * Gera um SVG vetorial determinístico de alta resolução representando o QR Code.
 * Por padrão, utiliza módulos pretos sobre fundo branco com margem adequada para garantir leitura instantânea em qualquer celular.
 */
export function generateQrCodeSvg(text: string, options: QrCodeOptions = {}): string {
    const {
        size = 200,
        margin = options.padding ?? 2,
        darkColor = options.fgColor && options.fgColor !== "currentColor" ? options.fgColor : "#000000",
        lightColor = options.bgColor && options.bgColor !== "transparent" ? options.bgColor : "#ffffff",
    } = options;

    const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
    const moduleCount = qr.modules.size;
    const totalSize = moduleCount + margin * 2;

    let pathD = "";
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (qr.modules.get(r, c) === 1) {
                const x = c + margin;
                const y = r + margin;
                pathD += `M${x},${y}h1v1h-1z `;
            }
        }
    }

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">`,
        lightColor ? `<rect width="100%" height="100%" fill="${lightColor}" />` : "",
        `<path d="${pathD.trim()}" fill="${darkColor}" />`,
        `</svg>`,
    ]
        .filter(Boolean)
        .join("");
}
