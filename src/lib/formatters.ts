/**
 * Utilitarios de formatacao de dados numericos, monetarios e geracao de identificadores de dominio.
 */

/**
 * Converte qualquer entrada monetaria para numero valido.
 * Aceita numeros, strings com ponto ou virgula, e trata nulos com seguranca.
 */
function parseNumericValue(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === "") {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
            return 0;
        }

        // Trata formato brasileiro (1.234,56 -> 1234.56) ou simples com virgula (12,50 -> 12.50)
        let normalized = trimmed;
        if (normalized.includes(",") && normalized.includes(".")) {
            normalized = normalized.replace(/\./g, "").replace(",", ".");
        } else if (normalized.includes(",")) {
            normalized = normalized.replace(",", ".");
        }

        const parsed = parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}

/**
 * Formata um valor numerico como moeda brasileira (Real - BRL).
 * Exemplo: 129.9 -> "R$ 129,90"
 */
export function formatCurrency(
    value: number | string | null | undefined,
): string {
    const num = parseNumericValue(value);

    const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);

    // Normaliza espaco nao separavel (\u00A0 ou \u202F) para espaco padrao
    return formatted.replace(/[\u00A0\u202F]/g, " ");
}

/**
 * Formata um numero com separador de milhar no padrao brasileiro.
 * Exemplo: 15400 -> "15.400"
 */
export function formatNumber(
    value: number | string | null | undefined,
): string {
    const num = parseNumericValue(value);

    return new Intl.NumberFormat("pt-BR").format(num);
}

/**
 * Formata metricas e contadores de forma compacta e legivel.
 * Exemplos:
 * 950 -> "950"
 * 1500 -> "1,5 mil"
 * 1000000 -> "1 mi"
 */
export function formatCompactNumber(
    value: number | string | null | undefined,
): string {
    const num = parseNumericValue(value);

    if (num < 1000) {
        return num.toString();
    }

    if (num < 1000000) {
        const thousands = num / 1000;
        const formatted =
            thousands % 1 === 0
                ? thousands.toFixed(0)
                : thousands.toFixed(1).replace(".", ",");
        return `${formatted} mil`;
    }

    const millions = num / 1000000;
    const formatted =
        millions % 1 === 0
            ? millions.toFixed(0)
            : millions.toFixed(1).replace(".", ",");
    return `${formatted} mi`;
}

/**
 * Calcula a porcentagem inteira de desconto entre o preco original e o promocional.
 * Retorna 0 caso nao haja desconto ou os precos sejam invalidos.
 */
export function formatDiscountPercentage(
    regularPrice: number | string | null | undefined,
    discountPrice: number | string | null | undefined,
): number {
    const regular = parseNumericValue(regularPrice);
    const discount = parseNumericValue(discountPrice);

    if (regular <= 0 || discount <= 0 || discount >= regular) {
        return 0;
    }

    const diff = regular - discount;
    return Math.round((diff / regular) * 100);
}

/**
 * Retorna a etiqueta textual de desconto para badges em cards de produto.
 * Exemplo: 100 e 70 -> "-30%"
 */
export function formatDiscountBadge(
    regularPrice: number | string | null | undefined,
    discountPrice: number | string | null | undefined,
): string {
    const percentage = formatDiscountPercentage(regularPrice, discountPrice);
    if (percentage <= 0) {
        return "";
    }

    return `-${percentage}%`;
}

/**
 * Gera um slug limpo e seguro para URLs a partir de um titulo ou texto arbitrario.
 * Remove acentuacoes, caracteres especiais e converte para letras minusculas com hifens.
 */
export function slugify(text: string): string {
    if (!text || typeof text !== "string") {
        return "";
    }

    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-") // Converte espacos e underscores em hifens
        .replace(/[^a-z0-9-]/g, "") // Mantem apenas alfanumericos e hifens
        .replace(/-+/g, "-") // Remove hifens repetidos
        .replace(/^-+|-+$/g, ""); // Remove hifens no inicio e fim
}
