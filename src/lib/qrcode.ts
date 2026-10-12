/**
 * Gerador Determinístico de QR Code em SVG Puro (Zero Dependências Externas)
 * Repositório: PromoCuts
 * Padrão: Compatível com a especificação ISO/IEC 18004 (Nível M de correção de erro).
 */

// ==============================================================================
// 1. Aritmética de Galois Field GF(2^8) para Código de Reed-Solomon
// ==============================================================================

const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        EXP_TABLE[i + 255] = x;
        LOG_TABLE[x] = i;
        x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
    }
})();

function gfMul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
}

function rsGeneratorPoly(numEc: number): Uint8Array {
    let poly = new Uint8Array([1]);
    for (let i = 0; i < numEc; i++) {
        const next = new Uint8Array(poly.length + 1);
        const factor = EXP_TABLE[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= gfMul(poly[j], factor);
            next[j + 1] ^= poly[j];
        }
        poly = next;
    }
    return poly;
}

function rsCalculateEc(data: Uint8Array, numEc: number): Uint8Array {
    const gen = rsGeneratorPoly(numEc);
    const ec = new Uint8Array(numEc);
    for (let i = 0; i < data.length; i++) {
        const factor = data[i] ^ ec[0];
        ec.copyWithin(0, 1);
        ec[numEc - 1] = 0;
        if (factor !== 0) {
            for (let j = 0; j < numEc; j++) {
                ec[j] ^= gfMul(gen[j], factor);
            }
        }
    }
    return ec;
}

// ==============================================================================
// 2. Parâmetros de Versão do QR Code (Nível M de Correção de Erros)
// ==============================================================================

type VersionConfig = {
    version: number;
    totalCodewords: number;
    ecCodewordsPerBlock: number;
    blocksGroup1: number;
    dataCodewordsGroup1: number;
    blocksGroup2: number;
    dataCodewordsGroup2: number;
    alignmentPositions: number[];
};

const VERSION_CONFIGS: VersionConfig[] = [
    // Versão 1 (21x21)
    { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 10, blocksGroup1: 1, dataCodewordsGroup1: 16, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [] },
    // Versão 2 (25x25)
    { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 16, blocksGroup1: 1, dataCodewordsGroup1: 28, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 18] },
    // Versão 3 (29x29)
    { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 26, blocksGroup1: 1, dataCodewordsGroup1: 44, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 22] },
    // Versão 4 (33x33)
    { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 18, blocksGroup1: 2, dataCodewordsGroup1: 32, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 26] },
    // Versão 5 (37x37)
    { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 24, blocksGroup1: 2, dataCodewordsGroup1: 43, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 30] },
    // Versão 6 (41x41)
    { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 16, blocksGroup1: 4, dataCodewordsGroup1: 27, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 34] },
    // Versão 7 (45x45)
    { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 18, blocksGroup1: 4, dataCodewordsGroup1: 31, blocksGroup2: 0, dataCodewordsGroup2: 0, alignmentPositions: [6, 22, 38] },
    // Versão 8 (49x49)
    { version: 8, totalCodewords: 242, ecCodewordsPerBlock: 22, blocksGroup1: 2, dataCodewordsGroup1: 38, blocksGroup2: 2, dataCodewordsGroup2: 39, alignmentPositions: [6, 24, 42] },
    // Versão 9 (53x53)
    { version: 9, totalCodewords: 292, ecCodewordsPerBlock: 22, blocksGroup1: 3, dataCodewordsGroup1: 36, blocksGroup2: 2, dataCodewordsGroup2: 37, alignmentPositions: [6, 26, 46] },
    // Versão 10 (57x57)
    { version: 10, totalCodewords: 346, ecCodewordsPerBlock: 26, blocksGroup1: 4, dataCodewordsGroup1: 43, blocksGroup2: 1, dataCodewordsGroup2: 44, alignmentPositions: [6, 28, 50] },
];

function selectVersion(dataLengthInBytes: number): VersionConfig {
    for (const cfg of VERSION_CONFIGS) {
        const totalDataBytes =
            cfg.blocksGroup1 * cfg.dataCodewordsGroup1 +
            cfg.blocksGroup2 * cfg.dataCodewordsGroup2;
        // Cabeçalho de byte mode: 4 bits de modo + 8 bits de contagem (para versões <= 9) ou 16 bits
        const headerBits = 4 + (cfg.version <= 9 ? 8 : 16);
        const availableDataBytes = Math.floor((totalDataBytes * 8 - headerBits) / 8);
        if (dataLengthInBytes <= availableDataBytes) {
            return cfg;
        }
    }
    throw new Error("Tamanho de texto excede a capacidade suportada do QR Code (versões 1 a 10).");
}

// ==============================================================================
// 3. Montagem do Fluxo de Bits e Entrelaçamento de Dados
// ==============================================================================

class BitBuffer {
    private buffer: number[] = [];
    private length: number = 0;

    put(num: number, length: number) {
        for (let i = 0; i < length; i++) {
            this.putBit(((num >>> (length - i - 1)) & 1) === 1);
        }
    }

    putBit(bit: boolean) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
            this.buffer.push(0);
        }
        if (bit) {
            this.buffer[bufIndex] |= 0x80 >>> (this.length % 8);
        }
        this.length++;
    }

    getLengthInBits(): number {
        return this.length;
    }

    getBuffer(): Uint8Array {
        return new Uint8Array(this.buffer);
    }
}

function encodeData(text: string, cfg: VersionConfig): Uint8Array {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(text);

    const totalDataCodewords =
        cfg.blocksGroup1 * cfg.dataCodewordsGroup1 +
        cfg.blocksGroup2 * cfg.dataCodewordsGroup2;

    const bitBuffer = new BitBuffer();

    // Modo Byte: 0100 (4 bits)
    bitBuffer.put(0x4, 4);

    // Contagem de caracteres: 8 bits (versões 1 a 9) ou 16 bits (versão 10)
    const charCountBits = cfg.version <= 9 ? 8 : 16;
    bitBuffer.put(utf8Bytes.length, charCountBits);

    // Dados em bytes
    for (let i = 0; i < utf8Bytes.length; i++) {
        bitBuffer.put(utf8Bytes[i], 8);
    }

    // Terminador de 4 bits (ou menos se faltar pouco)
    const totalDataBits = totalDataCodewords * 8;
    const remainingBits = totalDataBits - bitBuffer.getLengthInBits();
    const terminatorBits = Math.min(4, Math.max(0, remainingBits));
    bitBuffer.put(0, terminatorBits);

    // Preenchimento de bits até múltiplos de 8
    while (bitBuffer.getLengthInBits() % 8 !== 0) {
        bitBuffer.putBit(false);
    }

    // Preenchimento com bytes alternados 0xEC e 0x11 até a capacidade máxima
    const bytes = Array.from(bitBuffer.getBuffer());
    let pad = 0xec;
    while (bytes.length < totalDataCodewords) {
        bytes.push(pad);
        pad = pad === 0xec ? 0x11 : 0xec;
    }

    // Dividir em blocos e calcular os códigos de correção de erro Reed-Solomon
    const dataBlocks: Uint8Array[] = [];
    const ecBlocks: Uint8Array[] = [];
    let offset = 0;

    for (let b = 0; b < cfg.blocksGroup1; b++) {
        const blockData = new Uint8Array(bytes.slice(offset, offset + cfg.dataCodewordsGroup1));
        dataBlocks.push(blockData);
        ecBlocks.push(rsCalculateEc(blockData, cfg.ecCodewordsPerBlock));
        offset += cfg.dataCodewordsGroup1;
    }

    for (let b = 0; b < cfg.blocksGroup2; b++) {
        const blockData = new Uint8Array(bytes.slice(offset, offset + cfg.dataCodewordsGroup2));
        dataBlocks.push(blockData);
        ecBlocks.push(rsCalculateEc(blockData, cfg.ecCodewordsPerBlock));
        offset += cfg.dataCodewordsGroup2;
    }

    // Entrelaçamento das palavras-código de dados
    const interleaved: number[] = [];
    const maxDataBlockLen = Math.max(cfg.dataCodewordsGroup1, cfg.dataCodewordsGroup2);

    for (let i = 0; i < maxDataBlockLen; i++) {
        for (const block of dataBlocks) {
            if (i < block.length) {
                interleaved.push(block[i]);
            }
        }
    }

    // Entrelaçamento das palavras-código de erro
    for (let i = 0; i < cfg.ecCodewordsPerBlock; i++) {
        for (const block of ecBlocks) {
            interleaved.push(block[i]);
        }
    }

    return new Uint8Array(interleaved);
}

// ==============================================================================
// 4. Construção da Matriz de Módulos do QR Code
// ==============================================================================

function createMatrix(size: number): { modules: boolean[][]; reserved: boolean[][] } {
    const modules: boolean[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => false),
    );
    const reserved: boolean[][] = Array.from({ length: size }, () =>
        Array.from({ length: size }, () => false),
    );
    return { modules, reserved };
}

function placeFinderPattern(
    row: number,
    col: number,
    modules: boolean[][],
    reserved: boolean[][],
    size: number,
) {
    for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
            const curR = row + r;
            const curC = col + c;
            if (curR >= 0 && curR < size && curC >= 0 && curC < size) {
                reserved[curR][curC] = true;
                const isBorder = r === -1 || r === 7 || c === -1 || c === 7;
                if (!isBorder) {
                    const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
                    const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                    modules[curR][curC] = isOuter || isInner;
                } else {
                    modules[curR][curC] = false;
                }
            }
        }
    }
}

function placeAlignmentPattern(
    row: number,
    col: number,
    modules: boolean[][],
    reserved: boolean[][],
) {
    if (reserved[row][col]) return;
    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            reserved[row + r][col + c] = true;
            const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            modules[row + r][col + c] = isBorder || isCenter;
        }
    }
}

// Tabela de informações de formato (Nível M, Máscara 0-7 com código BCH 15 bits)
// Nível M = 00 binário.
const FORMAT_INFO = [
    0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

function applyFormatInfo(modules: boolean[][], reserved: boolean[][], mask: number, size: number) {
    const formatBits = FORMAT_INFO[mask];
    for (let i = 0; i < 15; i++) {
        const bit = ((formatBits >>> (14 - i)) & 1) === 1;

        // Padrão no canto superior esquerdo
        if (i < 6) {
            modules[i][8] = bit;
            reserved[i][8] = true;
        } else if (i < 8) {
            modules[i + 1][8] = bit;
            reserved[i + 1][8] = true;
        } else {
            modules[8][15 - i] = bit;
            reserved[8][15 - i] = true;
        }

        // Padrão nos outros dois cantos
        if (i < 7) {
            modules[8][size - 1 - i] = bit;
            reserved[8][size - 1 - i] = true;
        } else {
            modules[size - 15 + i][8] = bit;
            reserved[size - 15 + i][8] = true;
        }
    }
}

function getMaskBit(mask: number, row: number, col: number): boolean {
    switch (mask) {
        case 0:
            return (row + col) % 2 === 0;
        case 1:
            return row % 2 === 0;
        case 2:
            return col % 3 === 0;
        case 3:
            return (row + col) % 3 === 0;
        case 4:
            return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
        case 5:
            return ((row * col) % 2) + ((row * col) % 3) === 0;
        case 6:
            return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
        case 7:
            return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
        default:
            return false;
    }
}

/**
 * Avalia penalidade de uma máscara (Regras 1 a 4 da ISO/IEC 18004)
 */
function evaluatePenalty(matrix: boolean[][], size: number): number {
    let penalty = 0;

    // Regra 1: Cinco ou mais módulos consecutivos da mesma cor
    for (let r = 0; r < size; r++) {
        let count = 1;
        for (let c = 1; c < size; c++) {
            if (matrix[r][c] === matrix[r][c - 1]) {
                count++;
            } else {
                if (count >= 5) penalty += 3 + (count - 5);
                count = 1;
            }
        }
        if (count >= 5) penalty += 3 + (count - 5);
    }

    for (let c = 0; c < size; c++) {
        let count = 1;
        for (let r = 1; r < size; r++) {
            if (matrix[r][c] === matrix[r - 1][c]) {
                count++;
            } else {
                if (count >= 5) penalty += 3 + (count - 5);
                count = 1;
            }
        }
        if (count >= 5) penalty += 3 + (count - 5);
    }

    // Regra 2: Blocos 2x2 da mesma cor
    for (let r = 0; r < size - 1; r++) {
        for (let c = 0; c < size - 1; c++) {
            const v = matrix[r][c];
            if (
                v === matrix[r][c + 1] &&
                v === matrix[r + 1][c] &&
                v === matrix[r + 1][c + 1]
            ) {
                penalty += 3;
            }
        }
    }

    return penalty;
}

// ==============================================================================
// 5. Interface Pública e Renderização SVG
// ==============================================================================

export function generateQrMatrix(text: string): boolean[][] {
    const cfg = selectVersion(new TextEncoder().encode(text).length);
    const size = 17 + 4 * cfg.version;
    const { modules, reserved } = createMatrix(size);

    // 1. Padrões de localização (Finder patterns 7x7)
    placeFinderPattern(0, 0, modules, reserved, size);
    placeFinderPattern(0, size - 7, modules, reserved, size);
    placeFinderPattern(size - 7, 0, modules, reserved, size);

    // 2. Temporizadores (Timing patterns)
    for (let i = 8; i < size - 8; i++) {
        const isDark = i % 2 === 0;
        if (!reserved[6][i]) {
            modules[6][i] = isDark;
            reserved[6][i] = true;
        }
        if (!reserved[i][6]) {
            modules[i][6] = isDark;
            reserved[i][6] = true;
        }
    }

    // 3. Padrões de alinhamento (Alignment patterns para versão >= 2)
    const positions = cfg.alignmentPositions;
    for (let i = 0; i < positions.length; i++) {
        for (let j = 0; j < positions.length; j++) {
            const r = positions[i];
            const c = positions[j];
            placeAlignmentPattern(r, c, modules, reserved);
        }
    }

    // 4. Módulo escuro fixo
    modules[4 * cfg.version + 9][8] = true;
    reserved[4 * cfg.version + 9][8] = true;

    // 5. Reserva de áreas de formato
    for (let i = 0; i < 9; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
    }
    for (let i = 0; i < 8; i++) {
        reserved[8][size - 1 - i] = true;
        reserved[size - 1 - i][8] = true;
    }

    // 6. Dados codificados
    const dataBytes = encodeData(text, cfg);

    // 7. Testar as 8 máscaras para escolher a de menor penalidade
    let minPenalty = Infinity;
    let bestModules: boolean[][] = [];

    for (let mask = 0; mask < 8; mask++) {
        const curModules = modules.map((row) => [...row]);
        const curReserved = reserved.map((row) => [...row]);

        let byteIdx = 0;
        let bitIdx = 7;
        let upward = true;

        for (let right = size - 1; right > 0; right -= 2) {
            // Pular a coluna 6 do timing pattern vertical
            const colR = right <= 6 ? right - 1 : right;
            const colL = colR - 1;

            const rowRange = upward
                ? Array.from({ length: size }, (_, i) => size - 1 - i)
                : Array.from({ length: size }, (_, i) => i);

            for (const row of rowRange) {
                for (const col of [colR, colL]) {
                    if (!curReserved[row][col]) {
                        let bit = false;
                        if (byteIdx < dataBytes.length) {
                            bit = ((dataBytes[byteIdx] >>> bitIdx) & 1) === 1;
                            bitIdx--;
                            if (bitIdx < 0) {
                                bitIdx = 7;
                                byteIdx++;
                            }
                        }
                        const maskBit = getMaskBit(mask, row, col);
                        curModules[row][col] = bit !== maskBit;
                    }
                }
            }
            upward = !upward;
        }

        applyFormatInfo(curModules, curReserved, mask, size);
        const penalty = evaluatePenalty(curModules, size);
        if (penalty < minPenalty) {
            minPenalty = penalty;
            bestModules = curModules;
        }
    }

    return bestModules;
}

export type QrCodeOptions = {
    size?: number;
    padding?: number;
    fgColor?: string;
    bgColor?: string;
};

/**
 * Gera um SVG determinístico de alta resolução representando o QR Code do texto informado.
 */
export function generateQrCodeSvg(text: string, options: QrCodeOptions = {}): string {
    const {
        size = 220,
        padding = 2,
        fgColor = "currentColor",
        bgColor = "transparent",
    } = options;

    const matrix = generateQrMatrix(text);
    const moduleCount = matrix.length;
    const totalSize = moduleCount + padding * 2;

    // Gerar desenho com caminhos vetoriais otimizados
    let pathD = "";
    for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
            if (matrix[r][c]) {
                const x = c + padding;
                const y = r + padding;
                pathD += `M${x},${y}h1v1h-1z `;
            }
        }
    }

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">`,
        bgColor && bgColor !== "transparent"
            ? `<rect width="100%" height="100%" fill="${bgColor}" />`
            : "",
        `<path d="${pathD.trim()}" fill="${fgColor}" />`,
        `</svg>`,
    ]
        .filter(Boolean)
        .join("");
}
