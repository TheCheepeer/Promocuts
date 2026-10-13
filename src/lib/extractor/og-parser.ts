import { logger } from "@/lib/logger";
import {
    getStoreStrategy,
    STORE_STRATEGIES,
    detectStoreFromUrl,
    parsePriceNumber,
    type StoreStrategy,
} from "./store-strategies";

export {
    getStoreStrategy,
    STORE_STRATEGIES,
    detectStoreFromUrl,
    parsePriceNumber,
    type StoreStrategy,
};

export interface ExtractedMetadata {
    title: string | null;
    image: string | null;
    price: number | null;
    regularPrice?: number | null;
    store: string | null;
    siteName: string | null;
}

/**
 * Valida de forma defensiva se uma URL é externa, pública e segura para requisição no servidor (Mitigação de SSRF).
 */
export function isSafeExternalUrl(rawUrl: string): boolean {
    if (!rawUrl || typeof rawUrl !== "string") return false;
    const trimmed = rawUrl.trim();

    try {
        const parsed = new URL(trimmed);

        // Apenas HTTP e HTTPS são permitidos
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return false;
        }

        const hostname = parsed.hostname.toLowerCase();

        // Bloqueio de localhost e nomes locais
        if (
            hostname === "localhost" ||
            hostname.endsWith(".localhost") ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal") ||
            hostname.endsWith(".lan")
        ) {
            return false;
        }

        // Bloqueio de IPv4 e IPv6 em loopback e faixas privadas
        if (
            hostname === "127.0.0.1" ||
            hostname === "0.0.0.0" ||
            hostname === "::1" ||
            hostname === "[::1]"
        ) {
            return false;
        }

        // Checagem de faixas IPv4 privadas / link-local / cloud metadata (169.254.169.254)
        const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
            const octet1 = parseInt(ipv4Match[1], 10);
            const octet2 = parseInt(ipv4Match[2], 10);

            if (octet1 === 10) return false; // 10.0.0.0/8
            if (octet1 === 127) return false; // 127.0.0.0/8
            if (octet1 === 169 && octet2 === 254) return false; // 169.254.0.0/16 (Link-local & AWS Metadata)
            if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false; // 172.16.0.0/12
            if (octet1 === 192 && octet2 === 168) return false; // 192.168.0.0/16
            if (octet1 === 0) return false; // 0.0.0.0/8
        }

        return true;
    } catch {
        return false;
    }
}


/**
 * Decodifica entidades HTML comuns sem introduzir dependências externas pesadas.
 */
function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();
}

/**
 * Extrai atributos de conteúdo de tags <meta> a partir do HTML.
 */
function extractMetaContent(html: string, propertyOrName: string): string | null {
    // Busca por property="..." content="..."
    const propRegex = new RegExp(
        `<meta[^>]+(?:property|name)=["']${propertyOrName}["'][^>]+content=["']([^"']+)["']`,
        "i",
    );
    const matchProp = html.match(propRegex);
    if (matchProp && matchProp[1]) {
        return decodeHtmlEntities(matchProp[1]);
    }

    // Busca alternativa: content="..." property="..."
    const contentFirstRegex = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${propertyOrName}["']`,
        "i",
    );
    const matchContentFirst = html.match(contentFirstRegex);
    if (matchContentFirst && matchContentFirst[1]) {
        return decodeHtmlEntities(matchContentFirst[1]);
    }

    return null;
}

/**
 * Extrai o texto da tag <title>.
 */
function extractTitleTag(html: string): string | null {
    const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
    const match = html.match(titleRegex);
    return match && match[1] ? decodeHtmlEntities(match[1]) : null;
}

/**
 * Converte URLs relativas de imagem em URLs absolutas utilizando a base informada.
 */
function resolveAbsoluteUrl(relativeOrAbsolute: string | null, baseUrl: string): string | null {
    if (!relativeOrAbsolute) return null;
    const trimmed = relativeOrAbsolute.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }

    try {
        const resolved = new URL(trimmed, baseUrl);
        return resolved.toString();
    } catch {
        return null;
    }
}

/**
 * Remove sufixos comuns de marketplaces e plataformas de e-commerce do título do produto,
 * utilizando a estratégia da loja quando informada.
 */
export function cleanProductTitle(rawTitle: string | null, url?: string): string | null {
    if (!rawTitle) return null;
    const trimmed = rawTitle.trim();
    if (url) {
        const strategy = getStoreStrategy(url);
        if (strategy.cleanTitle) {
            return strategy.cleanTitle(trimmed) || null;
        }
    }

    const storeSuffixRegex =
        /\s*(?:\||-|–|—|:)\s*(?:Shopee(?:\s+Brasil)?|Amazon(?:\.com(?:\.br)?)?|Mercado\s+(?:Livre|Libre)|Magalu|Magazine\s+Luiza|Kabum!?|AliExpress|Casas\s+Bahia|Americanas)\s*$/i;
    return trimmed.replace(storeSuffixRegex, "").trim() || null;
}

/**
 * Analisa e extrai metadados estruturados JSON-LD (schema.org Product ou BreadcrumbList).
 */
export function extractLdJsonProduct(html: string): {
    title: string | null;
    image: string | null;
    price: number | null;
    regularPrice: number | null;
    store: string | null;
} {
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let title: string | null = null;
    let image: string | null = null;
    let price: number | null = null;
    let regularPrice: number | null = null;
    let store: string | null = null;

    while ((match = scriptRegex.exec(html)) !== null) {
        try {
            const data = JSON.parse(match[1]);
            const items = Array.isArray(data) ? data : (data["@graph"] || [data]);

            for (const item of items) {
                if (item["@type"] === "Product" || item["@type"] === "IndividualProduct") {
                    if (item.name && typeof item.name === "string") {
                        title = item.name.trim();
                    }
                    if (item.image) {
                        if (typeof item.image === "string") {
                            image = item.image;
                        } else if (Array.isArray(item.image) && item.image[0]) {
                            image = typeof item.image[0] === "string" ? item.image[0] : item.image[0].url;
                        } else if (item.image.url && typeof item.image.url === "string") {
                            image = item.image.url;
                        }
                    }
                    if (item.offers) {
                        const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
                        for (const offer of offers) {
                            const rawOfferPrice =
                                offer.price ??
                                offer.lowPrice ??
                                (offer.priceSpecification && offer.priceSpecification.price);
                            const rawHighPrice = offer.highPrice;

                            if (rawOfferPrice != null) {
                                const parsed =
                                    typeof rawOfferPrice === "number"
                                        ? rawOfferPrice
                                        : parsePriceNumber(String(rawOfferPrice));
                                if (parsed && parsed > 0 && (!price || parsed < price)) {
                                    price = parsed;
                                }
                            }

                            if (rawHighPrice != null) {
                                const parsedHigh =
                                    typeof rawHighPrice === "number"
                                        ? rawHighPrice
                                        : parsePriceNumber(String(rawHighPrice));
                                if (parsedHigh && parsedHigh > 0 && (!regularPrice || parsedHigh > regularPrice)) {
                                    regularPrice = parsedHigh;
                                }
                            }
                        }
                    }
                    if (item.brand) {
                        if (typeof item.brand === "string") {
                            store = item.brand;
                        } else if (item.brand.name && typeof item.brand.name === "string") {
                            store = item.brand.name;
                        }
                    }
                }
            }
        } catch {
            // Ignora JSON-LD com formatação inválida
        }
    }

    return { title, image, price, regularPrice, store };
}


/**
 * Tenta extrair o preço promocional principal ou valor corrente de destaque a partir de microdados HTML e marcações de e-commerce.
 */
export function extractPriceFromHtml(html: string, url?: string): number | null {
    // 1. Se a URL for fornecida, consulta prioritariamente a estratégia especializada da loja
    if (url) {
        const strategy = getStoreStrategy(url);
        if (strategy.extractPrice) {
            const price = strategy.extractPrice(html);
            if (price) return price;
        }
    }

    // 2. Meta tags semânticas universais de preço de venda / oferta corrente
    const priceMetaRegex =
        /<meta[^>]+(?:property|name|itemprop)=["'](?:product:sale_price:amount|og:price:amount|product:price:amount|price)["'][^>]+content=["']([^"']+)["']/i;
    const matchMeta = html.match(priceMetaRegex);
    if (matchMeta && matchMeta[1]) {
        const parsed = parsePriceNumber(matchMeta[1]);
        if (parsed) return parsed;
    }

    // 2b. Content antecedendo property/itemprop
    const metaFirstRegex =
        /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:product:sale_price:amount|og:price:amount|product:price:amount|price)["']/i;
    const matchMetaFirst = html.match(metaFirstRegex);
    if (matchMetaFirst && matchMetaFirst[1]) {
        const parsed = parsePriceNumber(matchMetaFirst[1]);
        if (parsed) return parsed;
    }

    // 3. Elementos microdata com itemprop="price"
    const itempropRegex = /<[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i;
    const matchItemprop = html.match(itempropRegex);
    if (matchItemprop && matchItemprop[1]) {
        const parsed = parsePriceNumber(matchItemprop[1]);
        if (parsed) return parsed;
    }

    // 4. Executa estratégias de lojas registradas (fallback quando URL não for fornecida)
    for (const strategy of STORE_STRATEGIES) {
        if (strategy.extractPrice) {
            const price = strategy.extractPrice(html);
            if (price) return price;
        }
    }

    // 5. Classes universais de preço principal/destaque em e-commerces (Shopify, WooCommerce, etc.)
    const prominentClassRegex =
        /class=["'][^"']*(?:price--highlight|price__current|current-price|product__price|product-price|sale-price|sales-price|price-tag-fraction)[^"']*["'][^>]*>[\s\S]{0,100}?((?:R\$|BRL|USD|EUR|GBP|\$|€|£)?\s*[\d.,]+)/i;
    const matchProminent = html.match(prominentClassRegex);
    if (matchProminent && matchProminent[1]) {
        const parsed = parsePriceNumber(matchProminent[1]);
        if (parsed) return parsed;
    }

    // 6. Atributos de dados (data-price ou data-product-price)
    const dataPriceRegex = /data-(?:product-)?price=["']([\d.,]+)["']/i;
    const matchData = html.match(dataPriceRegex);
    if (matchData && matchData[1]) {
        const parsed = parsePriceNumber(matchData[1]);
        if (parsed) return parsed;
    }

    return null;
}

/**
 * Tenta extrair o preço original / preço riscado ("de:") a partir de tags semânticas e seletores de e-commerce.
 */
export function extractRegularPriceFromHtml(html: string, url?: string): number | null {
    // 1. Se a URL for fornecida, consulta prioritariamente a estratégia especializada da loja
    if (url) {
        const strategy = getStoreStrategy(url);
        if (strategy.extractRegularPrice) {
            const regPrice = strategy.extractRegularPrice(html);
            if (regPrice) return regPrice;
        }
    }

    // 2. Meta tag semântica de preço original
    const originalMetaRegex =
        /<meta[^>]+(?:property|name|itemprop)=["'](?:product:original_price:amount|original_price)["'][^>]+content=["']([^"']+)["']/i;
    const matchMeta = html.match(originalMetaRegex);
    if (matchMeta && matchMeta[1]) {
        const parsed = parsePriceNumber(matchMeta[1]);
        if (parsed) return parsed;
    }

    // 2b. Content antecedendo property/itemprop
    const originalContentFirstRegex =
        /<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["'](?:product:original_price:amount|original_price)["']/i;
    const matchContentFirst = html.match(originalContentFirstRegex);
    if (matchContentFirst && matchContentFirst[1]) {
        const parsed = parsePriceNumber(matchContentFirst[1]);
        if (parsed) return parsed;
    }

    // 3. Executa estratégias de lojas registradas (fallback quando URL não for fornecida)
    for (const strategy of STORE_STRATEGIES) {
        if (strategy.extractRegularPrice) {
            const regPrice = strategy.extractRegularPrice(html);
            if (regPrice) return regPrice;
        }
    }

    return null;
}

/**
 * Analisa o HTML fornecido e extrai os metadados Open Graph utilizando o padrão Strategy.
 */
export function parseHtmlMetadata(html: string, baseUrl: string): ExtractedMetadata {
    const ldData = extractLdJsonProduct(html);

    const ogTitle = extractMetaContent(html, "og:title") || extractMetaContent(html, "twitter:title");
    const tagTitle = extractTitleTag(html);
    const rawTitle = ldData.title || ogTitle || tagTitle || null;
    const title = cleanProductTitle(rawTitle, baseUrl);

    const rawImage =
        extractMetaContent(html, "og:image") ||
        extractMetaContent(html, "og:image:secure_url") ||
        extractMetaContent(html, "twitter:image") ||
        ldData.image ||
        null;
    const image = resolveAbsoluteUrl(rawImage, baseUrl);

    const siteName =
        extractMetaContent(html, "og:site_name") ||
        extractMetaContent(html, "twitter:site") ||
        ldData.store ||
        null;

    const strategy = getStoreStrategy(baseUrl, siteName);
    const store = strategy.name;

    // Tentativa de extração de preço em metadados de e-commerce, JSON-LD e microdados
    let price: number | null = ldData.price;
    const htmlPrice = extractPriceFromHtml(html, baseUrl);
    if (htmlPrice != null && (price == null || price <= 0 || htmlPrice < price)) {
        price = htmlPrice;
    }

    let regularPrice: number | null = ldData.regularPrice;
    if (regularPrice == null || regularPrice <= 0) {
        regularPrice = extractRegularPriceFromHtml(html, baseUrl);
    }

    // Se o preço regular for menor ou igual ao promocional, descarta para evitar inconsistência
    if (regularPrice != null && price != null && regularPrice <= price) {
        regularPrice = null;
    }

    return {
        title,
        image,
        price,
        regularPrice,
        store,
        siteName,
    };
}

/**
 * Executa uma requisição HTTP defensiva para extrair os metadados da URL de forma segura.
 * Utiliza primordialmente User-Agents de pré-visualização social (reconhecidos para renderização
 * de Open Graph em SPAs e plataformas de e-commerce como Shopee, Magalu e Amazon), com fallback.
 */
export async function extractOpenGraphMetadata(targetUrl: string): Promise<ExtractedMetadata> {
    if (!isSafeExternalUrl(targetUrl)) {
        throw new Error("URL inválida ou endereço de rede restrito por política de segurança.");
    }

    const candidateUserAgents = [
        // WhatsApp link preview crawler (geralmente aceito com SSR nativo em Shopee, Amazon, Magalu, Casas Bahia, Kabum)
        "WhatsApp/2.21.12.21 A",
        // Facebook External Hit crawler
        "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        // Navegador Chrome padrão como último recurso
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 PromoCuts/1.0",
    ];

    for (const ua of candidateUserAgents) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000); // 6 segundos de limite por tentativa

        try {
            const response = await fetch(targetUrl, {
                method: "GET",
                headers: {
                    "User-Agent": ua,
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                },
                signal: controller.signal,
                redirect: "follow",
            });

            clearTimeout(timeout);

            if (!response.ok) {
                continue;
            }

            // Limita a leitura a no máximo 512 KB do cabeçalho HTML
            const reader = response.body?.getReader();
            let html = "";
            let bytesRead = 0;
            const maxBytes = 512 * 1024; // 512 KB

            if (reader) {
                const decoder = new TextDecoder("utf-8");
                while (bytesRead < maxBytes) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) {
                        bytesRead += value.length;
                        html += decoder.decode(value, { stream: true });
                        // Se o cabeçalho <head> já terminou e já localizamos og:title ou <title>, interrompe antecipadamente
                        if (
                            html.includes("</head>") &&
                            (html.includes("og:title") || html.includes("<title"))
                        ) {
                            break;
                        }
                    }
                }
                reader.cancel().catch(() => {});
            } else {
                html = await response.text();
            }

            const metadata = parseHtmlMetadata(html, response.url || targetUrl);

            // Se obteve título ou imagem, retorna imediatamente com sucesso
            if (metadata.title || metadata.image) {
                return metadata;
            }
        } catch (err) {
            clearTimeout(timeout);
            logger.warn("Tentativa de extração falhou com User-Agent", {
                url: targetUrl,
                ua,
                erro: err instanceof Error ? err.message : String(err),
            });
        }
    }

    // Fallback defensivo final: retorna apenas a loja identificada pelo domínio
    return {
        title: null,
        image: null,
        price: null,
        store: detectStoreFromUrl(targetUrl),
        siteName: null,
    };
}
