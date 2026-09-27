/**
 * Utilitario de telemetria anonima para monitoramento de cliques em produtos afiliados.
 */

export function trackAffiliateClick(
    productId: string,
    videoId?: string | null,
): void {
    if (!productId || typeof window === "undefined") {
        return;
    }

    const payload = JSON.stringify({
        product_id: productId,
        video_id: videoId || null,
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
            // Falha silenciosa defensiva para preservar a navegacao do visitante
        });
    } catch {
        // Falha silenciosa defensiva
    }
}
