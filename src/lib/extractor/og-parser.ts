import { logger } from "@/lib/logger";

export interface ExtractedMetadata {
    title: string | null;
    image: string | null;
    price: number | null;
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
 * Detecta o nome amigável da loja parceira com base no domínio ou metadados da página.
 */
export function detectStoreFromUrl(url: string, siteName?: string | null): string {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();

        if (host.includes("amazon.") || host.includes("amzn.to")) {
            return "Amazon";
        }
        if (host.includes("shopee.") || host.includes("shp.ee")) {
            return "Shopee";
        }
        if (host.includes("mercadolivre.") || host.includes("mercadolibre.") || host.includes("meli.la")) {
            return "Mercado Livre";
        }
        if (host.includes("aliexpress.")) {
            return "AliExpress";
        }
        if (host.includes("magazineluiza.com.br") || host.includes("magalu.")) {
            return "Magalu";
        }
        if (host.includes("kabum.com.br")) {
            return "Kabum";
        }
        if (host.includes("americanas.com.br")) {
            return "Americanas";
        }
        if (host.includes("casasbahia.com.br")) {
            return "Casas Bahia";
        }
    } catch {
        // Fallback para avaliação de siteName
    }

    if (siteName && siteName.trim()) {
        const cleaned = siteName.trim();
        if (cleaned.length <= 50) return cleaned;
    }

    return "Loja Parceira";
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
 * Remove sufixos comuns de marketplaces e plataformas de e-commerce do título do produto.
 */
export function cleanProductTitle(rawTitle: string | null): string | null {
    if (!rawTitle) return null;
    let title = rawTitle.trim();

    const storeSuffixRegex =
        /\s*(?:\||-|–|—|:)\s*(?:Shopee(?:\s+Brasil)?|Amazon(?:\.com(?:\.br)?)?|Mercado\s+Livre|Magalu|Magazine\s+Luiza|Kabum!?|AliExpress|Casas\s+Bahia)\s*$/i;
    title = title.replace(storeSuffixRegex, "").trim();

    return title || null;
}

/**
 * Analisa e extrai metadados estruturados JSON-LD (schema.org Product ou BreadcrumbList).
 */
export function extractLdJsonProduct(html: string): {
    title: string | null;
    image: string | null;
    price: number | null;
    store: string | null;
} {
    const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let title: string | null = null;
    let image: string | null = null;
    let price: number | null = null;
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
                        const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                        if (offers && offers.price != null) {
                            const p = parseFloat(String(offers.price).replace(",", "."));
                            if (!isNaN(p) && p >= 0) price = p;
                        }
                        if (offers && offers.seller && typeof offers.seller.name === "string") {
                            store = offers.seller.name.trim();
                        }
                    }
                    if (item.brand && typeof item.brand.name === "string" && !store) {
                        store = item.brand.name.trim();
                    }
                }

                // Fallback para o último item de BreadcrumbList caso ainda não tenha título
                if (item["@type"] === "BreadcrumbList" && item.itemListElement && !title) {
                    const elements = item.itemListElement;
                    if (Array.isArray(elements) && elements.length > 0) {
                        const last = elements[elements.length - 1];
                        const name = last?.item?.name || last?.name;
                        if (name && typeof name === "string") {
                            title = name.trim();
                        }
                    }
                }
            }
        } catch {
            // Ignora JSON-LD mal formatado
        }
    }

    return { title, image, price, store };
}

/**
 * Analisa o HTML fornecido e extrai os metadados Open Graph.
 */
export function parseHtmlMetadata(html: string, baseUrl: string): ExtractedMetadata {
    const ldData = extractLdJsonProduct(html);

    const ogTitle = extractMetaContent(html, "og:title") || extractMetaContent(html, "twitter:title");
    const tagTitle = extractTitleTag(html);
    const rawTitle = ldData.title || ogTitle || tagTitle || null;
    const title = cleanProductTitle(rawTitle);

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

    const store = detectStoreFromUrl(baseUrl, siteName);

    // Tentativa de extração de preço sugerido em metadados de e-commerce
    let price: number | null = ldData.price;
    if (price == null) {
        const rawPrice =
            extractMetaContent(html, "og:price:amount") ||
            extractMetaContent(html, "product:price:amount") ||
            extractMetaContent(html, "price") ||
            null;

        if (rawPrice) {
            let normalized = rawPrice.trim();
            if (normalized.includes(".") && normalized.includes(",")) {
                if (normalized.lastIndexOf(",") > normalized.lastIndexOf(".")) {
                    normalized = normalized.replace(/\./g, "").replace(",", ".");
                } else {
                    normalized = normalized.replace(/,/g, "");
                }
            } else if (normalized.includes(",")) {
                normalized = normalized.replace(",", ".");
            }

            const parsed = parseFloat(normalized);
            if (!isNaN(parsed) && parsed >= 0) {
                price = Math.round(parsed * 100) / 100;
            }
        }
    }

    return {
        title,
        image,
        price,
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
