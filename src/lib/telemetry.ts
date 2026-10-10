export const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_REGEX.test(value);
}

export function sanitizeHeader(
    value: string | null | undefined,
    maxLength: number,
): string | null {
    if (!value || typeof value !== "string") {
        return null;
    }
    return value.slice(0, maxLength);
}

/**
 * Registra o engajamento de clique de afiliado, identificando opcionalmente o vídeo,
 * o link específico e a loja parceira escolhida pelo visitante.
 */
export function trackAffiliateClick(
    productId: string,
    videoId?: string | null,
    linkId?: string | null,
    storeName?: string | null,
): void {
    if (!productId || typeof window === "undefined") {
        return;
    }

    const payload = JSON.stringify({
        product_id: productId,
        video_id: videoId || null,
        link_id: linkId || null,
        store_name: storeName ? storeName.slice(0, 100) : null,
    });

    try {
        if (
            typeof navigator !== "undefined" &&
            typeof navigator.sendBeacon === "function"
        ) {
            const blob = new Blob([payload], { type: "application/json" });
            const sent = navigator.sendBeacon("/api/track-click", blob);
            if (sent) return;
        }

        fetch("/api/track-click", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: payload,
            keepalive: true,
        }).catch(() => {
            // Falha silenciosa defensiva para preservar a navegação do visitante
        });
    } catch {
        // Falha silenciosa defensiva
    }
}
