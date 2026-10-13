/**
 * Estrutura e catálogo de estratégias de extração por loja parceira (Padrão Strategy).
 * Permite adicionar novas lojas, marketplaces e plataformas de e-commerce de forma desacoplada
 * e extensível, sem sobrecarregar o orquestrador principal de Open Graph.
 */

export interface StoreStrategy {
    readonly id: string;
    readonly name: string;
    readonly domains: string[];
    matchesUrl(url: string, siteName?: string | null): boolean;
    cleanTitle?(rawTitle: string): string;
    extractPrice?(html: string): number | null;
    extractRegularPrice?(html: string): number | null;
}

/**
 * Converte strings numéricas de moeda em ponto flutuante válido (suporta formatos internacionais e BRL).
 */
export function parsePriceNumber(raw: string): number | null {
    if (!raw) return null;
    let clean = raw
        .replace(/(?:R\$|BRL|USD|EUR|GBP|\$|€|£|¥)\s*/gi, "")
        .trim();

    if (clean.includes(".") && clean.includes(",")) {
        if (clean.lastIndexOf(",") > clean.lastIndexOf(".")) {
            // Formato decimal com vírgula (ex: 1.499,90)
            clean = clean.replace(/\./g, "").replace(",", ".");
        } else {
            // Formato decimal com ponto (ex: 1,499.90)
            clean = clean.replace(/,/g, "");
        }
    } else if (clean.includes(",")) {
        clean = clean.replace(",", ".");
    }

    const val = parseFloat(clean);
    return !isNaN(val) && val > 0 ? Math.round(val * 100) / 100 : null;
}

/**
 * Cria função de correspondência de domínio para estratégias de lojas.
 */
function createDomainMatcher(domains: string[], siteNameKeywords: string[] = []) {
    return (url: string, siteName?: string | null): boolean => {
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            if (domains.some((d) => host.includes(d))) {
                return true;
            }
        } catch {
            // Fallback para avaliação de texto
        }

        if (siteName && siteName.trim()) {
            const lowerSite = siteName.toLowerCase();
            const keywords = [...domains.map((d) => d.replace(/\.$/, "")), ...siteNameKeywords];
            if (keywords.some((kw) => lowerSite.includes(kw))) {
                return true;
            }
        }

        return false;
    };
}

/**
 * Estratégia para Amazon (Brasil e Global)
 */
export const AmazonStoreStrategy: StoreStrategy = {
    id: "amazon",
    name: "Amazon",
    domains: ["amazon.", "amzn.to"],
    matchesUrl: createDomainMatcher(["amazon.", "amzn.to"], ["amazon"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Amazon(?:\.com(?:\.br)?)?)\s*$/i, "")
            .trim();
    },
    extractPrice: (html: string): number | null => {
        // Amazon BuyBox: ignora classe a-text-price (preço riscado)
        const amazonPriceMatches = html.matchAll(
            /<(?:div|span)[^>]*class=["']([^"']*a-price[^"']*)["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>([^<]+)<\/span>/gi,
        );
        for (const match of amazonPriceMatches) {
            const classNames = match[1];
            if (!classNames.includes("a-text-price")) {
                const parsed = parsePriceNumber(match[2]);
                if (parsed) return parsed;
            }
        }

        // Fallback a-offscreen geral com moeda
        const amazonOffscreen = html.match(
            /class=["']a-offscreen["'][^>]*>((?:R\$|BRL|USD|EUR|GBP|\$|€|£)?\s*[\d.,]+)<\/span>/i,
        );
        if (amazonOffscreen && amazonOffscreen[1]) {
            return parsePriceNumber(amazonOffscreen[1]);
        }

        return null;
    },
    extractRegularPrice: (html: string): number | null => {
        // Preço riscado da Amazon: a-text-price com a-offscreen
        const amazonStrikeRegex =
            /class=["'][^"']*a-text-price[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>([^<]+)<\/span>/i;
        const matchStrike = html.match(amazonStrikeRegex);
        if (matchStrike && matchStrike[1]) {
            return parsePriceNumber(matchStrike[1]);
        }
        return null;
    },
};

/**
 * Estratégia para Shopee
 */
export const ShopeeStoreStrategy: StoreStrategy = {
    id: "shopee",
    name: "Shopee",
    domains: ["shopee.", "shp.ee"],
    matchesUrl: createDomainMatcher(["shopee.", "shp.ee"], ["shopee"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Shopee(?:\s+Brasil)?)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia para Mercado Livre
 */
export const MercadoLivreStoreStrategy: StoreStrategy = {
    id: "mercadolivre",
    name: "Mercado Livre",
    domains: ["mercadolivre.", "mercadolibre.", "meli.la"],
    matchesUrl: createDomainMatcher(
        ["mercadolivre.", "mercadolibre.", "meli.la"],
        ["mercado livre", "mercado libre"],
    ),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Mercado\s+(?:Livre|Libre))\s*$/i, "")
            .trim();
    },
    extractPrice: (html: string): number | null => {
        // Se houver bloco de preco anterior/riscado, busca apos o fechamento da tag desse bloco
        let searchHtml = html;
        const prevIndex = html.indexOf("andes-money-amount--previous");
        if (prevIndex !== -1) {
            const afterPrev = html.slice(prevIndex);
            const closeTag = afterPrev.indexOf("</span>");
            if (closeTag !== -1) {
                searchHtml = afterPrev.slice(closeTag + 7);
            }
        }

        // Fracao corrente do Mercado Livre
        const mlFractionRegex =
            /class=["'][^"']*andes-money-amount__fraction[^"']*["'][^>]*>([\d.,]+)<\/span>/i;
        const matchMl = searchHtml.match(mlFractionRegex) || html.match(mlFractionRegex);
        if (matchMl && matchMl[1]) {
            let raw = matchMl[1];
            if (raw.includes(".") && !raw.includes(",")) {
                raw = raw.replace(/\./g, "");
            }
            return parsePriceNumber(raw);
        }
        return null;
    },
    extractRegularPrice: (html: string): number | null => {
        // Preço anterior / riscado do Mercado Livre
        const mlPrevRegex =
            /andes-money-amount--previous[^>]*>[\s\S]*?class=["'][^"']*andes-money-amount__fraction[^"']*["'][^>]*>([\d.,]+)<\/span>/i;
        const matchMlPrev = html.match(mlPrevRegex);
        if (matchMlPrev && matchMlPrev[1]) {
            let raw = matchMlPrev[1];
            if (raw.includes(".") && !raw.includes(",")) {
                raw = raw.replace(/\./g, "");
            }
            return parsePriceNumber(raw);
        }
        return null;
    },
};

/**
 * Estratégia para AliExpress
 */
export const AliExpressStoreStrategy: StoreStrategy = {
    id: "aliexpress",
    name: "AliExpress",
    domains: ["aliexpress."],
    matchesUrl: createDomainMatcher(["aliexpress."], ["aliexpress"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:AliExpress)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia para Magazine Luiza / Magalu
 */
export const MagaluStoreStrategy: StoreStrategy = {
    id: "magalu",
    name: "Magalu",
    domains: ["magazineluiza.com.br", "magalu."],
    matchesUrl: createDomainMatcher(
        ["magazineluiza.com.br", "magalu."],
        ["magalu", "magazine luiza"],
    ),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Magalu|Magazine\s+Luiza)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia para KaBuM!
 */
export const KabumStoreStrategy: StoreStrategy = {
    id: "kabum",
    name: "Kabum",
    domains: ["kabum.com.br"],
    matchesUrl: createDomainMatcher(["kabum.com.br"], ["kabum"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Kabum!?)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia para Casas Bahia
 */
export const CasasBahiaStoreStrategy: StoreStrategy = {
    id: "casasbahia",
    name: "Casas Bahia",
    domains: ["casasbahia.com.br"],
    matchesUrl: createDomainMatcher(["casasbahia.com.br"], ["casas bahia"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Casas\s+Bahia)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia para Americanas
 */
export const AmericanasStoreStrategy: StoreStrategy = {
    id: "americanas",
    name: "Americanas",
    domains: ["americanas.com.br"],
    matchesUrl: createDomainMatcher(["americanas.com.br"], ["americanas"]),
    cleanTitle: (raw: string): string => {
        return raw
            .replace(/\s*(?:\||-|–|—|:)\s*(?:Americanas)\s*$/i, "")
            .trim();
    },
};

/**
 * Estratégia padrão para lojas não mapeadas diretamente
 */
export class DefaultStoreStrategy implements StoreStrategy {
    readonly id = "default";
    readonly name: string;
    readonly domains: string[] = [];

    constructor(customName?: string | null) {
        this.name = customName && customName.trim() ? customName.trim() : "Loja Parceira";
    }

    matchesUrl(): boolean {
        return true;
    }

    cleanTitle(rawTitle: string): string {
        const storeSuffixRegex =
            /\s*(?:\||-|–|—|:)\s*(?:Shopee(?:\s+Brasil)?|Amazon(?:\.com(?:\.br)?)?|Mercado\s+(?:Livre|Libre)|Magalu|Magazine\s+Luiza|Kabum!?|AliExpress|Casas\s+Bahia|Americanas)\s*$/i;
        return rawTitle.replace(storeSuffixRegex, "").trim();
    }
}

/**
 * Catálogo unificado de estratégias registradas no sistema.
 */
export const STORE_STRATEGIES: readonly StoreStrategy[] = [
    AmazonStoreStrategy,
    ShopeeStoreStrategy,
    MercadoLivreStoreStrategy,
    AliExpressStoreStrategy,
    MagaluStoreStrategy,
    KabumStoreStrategy,
    CasasBahiaStoreStrategy,
    AmericanasStoreStrategy,
];

/**
 * Resolve a estratégia adequada para uma dada URL ou nome de site.
 */
export function getStoreStrategy(url: string, siteName?: string | null): StoreStrategy {
    for (const strategy of STORE_STRATEGIES) {
        if (strategy.matchesUrl(url, siteName)) {
            return strategy;
        }
    }

    if (siteName && siteName.trim()) {
        const cleaned = siteName.trim();
        if (cleaned.length <= 50) {
            return new DefaultStoreStrategy(cleaned);
        }
    }

    return new DefaultStoreStrategy();
}

/**
 * Detecta o nome amigável da loja com base na estratégia resolvida.
 */
export function detectStoreFromUrl(url: string, siteName?: string | null): string {
    return getStoreStrategy(url, siteName).name;
}
