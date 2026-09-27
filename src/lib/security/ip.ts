/**
 * Utilitario de seguranca para deteccao, normalizacao e validacao de enderecos IP e faixas CIDR.
 * Suporta IPv4 e IPv6 sem dependencias externas de runtime.
 */

/**
 * Converte um endereco IPv4 em inteiro de 32 bits sem sinal.
 */
function ipv4ToInt(ip: string): number | null {
    const parts = ip.split(".");
    if (parts.length !== 4) return null;

    let result = 0;
    for (const part of parts) {
        if (!/^\d+$/.test(part)) return null;
        const num = Number(part);
        if (num < 0 || num > 255) return null;
        result = ((result << 8) | num) >>> 0;
    }
    return result;
}

/**
 * Converte um endereco IPv6 em BigInt de 128 bits, expandindo a notacao abreviada '::'.
 */
function ipv6ToBigInt(ip: string): bigint | null {
    let cleanIp = ip.toLowerCase().trim();

    // Se for IPv4 mapeado em IPv6 (ex: ::ffff:192.168.1.1)
    if (cleanIp.startsWith("::ffff:") && cleanIp.includes(".")) {
        const v4Part = cleanIp.slice(7);
        const v4Int = ipv4ToInt(v4Part);
        if (v4Int === null) return null;
        return (0xffffn << 32n) | BigInt(v4Int);
    }

    if (cleanIp.includes("::")) {
        const parts = cleanIp.split("::");
        if (parts.length > 2) return null; // No maximo um '::' e valido

        const left = parts[0] ? parts[0].split(":") : [];
        const right = parts[1] ? parts[1].split(":") : [];
        const missing = 8 - (left.length + right.length);
        if (missing < 0) return null;

        const middle = new Array(missing).fill("0");
        cleanIp = [...left, ...middle, ...right].join(":");
    }

    const groups = cleanIp.split(":");
    if (groups.length !== 8) return null;

    let result = 0n;
    for (const group of groups) {
        if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
        result = (result << 16n) | BigInt(parseInt(group, 16));
    }
    return result;
}

/**
 * Normaliza um endereco IP (ex: converte ::ffff:192.168.1.1 para 192.168.1.1).
 */
export function normalizeIp(rawIp: string): string {
    const trimmed = rawIp.trim();
    if (trimmed.startsWith("::ffff:")) {
        const candidateV4 = trimmed.slice(7);
        if (ipv4ToInt(candidateV4) !== null) {
            return candidateV4;
        }
    }
    return trimmed;
}

/**
 * Verifica se um IP e valido (IPv4 ou IPv6).
 */
export function isValidIp(ip: string): boolean {
    const normalized = normalizeIp(ip);
    return ipv4ToInt(normalized) !== null || ipv6ToBigInt(normalized) !== null;
}

/**
 * Avalia se um endereco IP pertence a um bloco CIDR (IPv4 ou IPv6).
 */
export function matchCidr(ip: string, cidr: string): boolean {
    const normalizedIp = normalizeIp(ip);
    const [subnetStr, prefixStr] = cidr.trim().split("/");
    if (!subnetStr || prefixStr === undefined) return false;

    const prefix = Number(prefixStr);
    if (isNaN(prefix) || prefix < 0) return false;

    // Caso 1: IPv4
    const isIpV4 = normalizedIp.includes(".");
    const isSubnetV4 = subnetStr.includes(".");

    if (isIpV4 && isSubnetV4) {
        if (prefix > 32) return false;
        const ipInt = ipv4ToInt(normalizedIp);
        const subnetInt = ipv4ToInt(subnetStr);
        if (ipInt === null || subnetInt === null) return false;

        if (prefix === 0) return true;
        const mask = (~0 << (32 - prefix)) >>> 0;
        return (ipInt & mask) === (subnetInt & mask);
    }

    // Caso 2: IPv6
    const ipBig = ipv6ToBigInt(normalizedIp);
    const subnetBig = ipv6ToBigInt(subnetStr);

    if (ipBig !== null && subnetBig !== null) {
        if (prefix > 128) return false;
        if (prefix === 0) return true;

        const totalBits = 128n;
        const mask =
            ((1n << totalBits) - 1n) ^
            ((1n << (totalBits - BigInt(prefix))) - 1n);
        return (ipBig & mask) === (subnetBig & mask);
    }

    return false;
}

/**
 * Extrai o endereco IP do cliente a partir dos cabecalhos da requisicao HTTP ou de propriedades de borda.
 */
export function getClientIp(
    request:
        | Request
        | { headers: Headers; ip?: string }
        | Headers
        | { get(name: string): string | null },
): string | null {
    let headers: { get(name: string): string | null };
    let directIp: string | undefined;

    if ("headers" in request && typeof request.headers?.get === "function") {
        headers = request.headers;
        if ("ip" in request && typeof request.ip === "string") {
            directIp = request.ip;
        }
    } else if (
        typeof (request as { get: (name: string) => string | null }).get ===
        "function"
    ) {
        headers = request as { get(name: string): string | null };
    } else {
        return null;
    }

    // 1. x-forwarded-for (padrao de reverse proxies; o primeiro IP e o do cliente original)
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
        const firstIp = xForwardedFor.split(",")[0]?.trim();
        if (firstIp) return normalizeIp(firstIp);
    }

    // 2. x-real-ip (Nginx e proxies internos)
    const xRealIp = headers.get("x-real-ip");
    if (xRealIp?.trim()) {
        return normalizeIp(xRealIp.trim());
    }

    // 3. cf-connecting-ip (Cloudflare edge)
    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp?.trim()) {
        return normalizeIp(cfConnectingIp.trim());
    }

    // 4. Propriedade direta de runtime (ex: NextRequest.ip)
    if (directIp?.trim()) {
        return normalizeIp(directIp.trim());
    }

    return null;
}

/**
 * Avalia se o IP informado esta presente na lista de regras de rede (IPs individuais ou CIDRs).
 * Se allowedListStr estiver vazia ou indefinida, a regra e opcional e retorna true (livre acesso).
 */
export function isIpAllowed(
    clientIp: string,
    allowedListStr?: string,
): boolean {
    if (!allowedListStr || allowedListStr.trim() === "") {
        return true;
    }

    const normalizedClient = normalizeIp(clientIp);
    if (!normalizedClient) return false;

    const entries = allowedListStr
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    for (const entry of entries) {
        if (entry.includes("/")) {
            if (matchCidr(normalizedClient, entry)) {
                return true;
            }
        } else {
            const normalizedEntry = normalizeIp(entry);
            if (normalizedClient === normalizedEntry) {
                return true;
            }

            // Comparacao canonica para IPv6
            const clientV6 = ipv6ToBigInt(normalizedClient);
            const entryV6 = ipv6ToBigInt(normalizedEntry);
            if (clientV6 !== null && entryV6 !== null && clientV6 === entryV6) {
                return true;
            }
        }
    }

    return false;
}
