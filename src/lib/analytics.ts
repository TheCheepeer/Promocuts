/**
 * Utilitários puros para agregação de telemetria, análise sintática de origens
 * e suporte a gráficos vetoriais do painel administrativo.
 */

export type MetricPeriod = "today" | "7d" | "30d" | "all";

export interface TrafficSourceInfo {
    id: "instagram" | "tiktok" | "youtube" | "twitch" | "x" | "direct" | "other";
    label: string;
    brandColor: string;
}

/**
 * Classifica a origem do visitante a partir da URL do cabeçalho Referer/Referrer.
 */
export function parseTrafficSource(referrer: string | null | undefined): TrafficSourceInfo {
    if (!referrer || typeof referrer !== "string" || referrer.trim() === "") {
        return {
            id: "direct",
            label: "Tráfego Direto",
            brandColor: "#71717A",
        };
    }

    try {
        const lower = referrer.toLowerCase();

        if (lower.includes("instagram.com") || lower.includes("com.instagram.android") || lower.includes("instagram")) {
            return {
                id: "instagram",
                label: "Instagram",
                brandColor: "#E1306C",
            };
        }

        if (lower.includes("tiktok.com") || lower.includes("com.zhiliaoapp.musically") || lower.includes("tiktok")) {
            return {
                id: "tiktok",
                label: "TikTok",
                brandColor: "#000000",
            };
        }

        if (
            lower.includes("youtube.com") ||
            lower.includes("youtu.be") ||
            lower.includes("com.google.android.youtube")
        ) {
            return {
                id: "youtube",
                label: "YouTube",
                brandColor: "#FF0000",
            };
        }

        if (lower.includes("twitch.tv") || lower.includes("tv.twitch")) {
            return {
                id: "twitch",
                label: "Twitch",
                brandColor: "#9146FF",
            };
        }

        if (
            lower.includes("twitter.com") ||
            lower.includes("t.co") ||
            lower.includes("x.com") ||
            lower.includes("com.twitter.android")
        ) {
            return {
                id: "x",
                label: "X (Twitter)",
                brandColor: "#0F1419",
            };
        }

        return {
            id: "other",
            label: "Outros Sites",
            brandColor: "#3B82F6",
        };
    } catch {
        return {
            id: "other",
            label: "Outros Sites",
            brandColor: "#3B82F6",
        };
    }
}

/**
 * Retorna os limites de data a partir da chave de período selecionada.
 */
export function getDateRangeBounds(period: MetricPeriod): {
    startDate: Date | null;
    endDate: Date;
} {
    const endDate = new Date();

    if (period === "today") {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
    }

    if (period === "7d") {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
    }

    if (period === "30d") {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        return { startDate, endDate };
    }

    return { startDate: null, endDate };
}

export interface DailyDataPoint {
    dateKey: string; // "YYYY-MM-DD"
    label: string;   // "05/10"
    affiliateClicks: number;
    bioLinkClicks: number;
    totalClicks: number;
}

/**
 * Agrupa cliques diários nos últimos N dias (gerando pontos zerados para dias vazios).
 */
export function groupDailyTimeline(
    affiliateDates: string[],
    bioLinkDates: string[],
    daysCount: number,
): DailyDataPoint[] {
    const pointsMap = new Map<string, { affiliate: number; bio: number; label: string }>();

    // Inicializa o mapa com todos os dias do período
    const today = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = `${dd}/${mm}`;
        pointsMap.set(dateKey, { affiliate: 0, bio: 0, label });
    }

    // Contabiliza cliques de afiliados
    for (const rawDate of affiliateDates) {
        if (!rawDate) continue;
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) continue;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const item = pointsMap.get(dateKey);
        if (item) {
            item.affiliate += 1;
        }
    }

    // Contabiliza cliques de bio links
    for (const rawDate of bioLinkDates) {
        if (!rawDate) continue;
        const d = new Date(rawDate);
        if (Number.isNaN(d.getTime())) continue;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const item = pointsMap.get(dateKey);
        if (item) {
            item.bio += 1;
        }
    }

    // Converte para array ordenado cronologicamente
    const result: DailyDataPoint[] = [];
    pointsMap.forEach((val, key) => {
        result.push({
            dateKey: key,
            label: val.label,
            affiliateClicks: val.affiliate,
            bioLinkClicks: val.bio,
            totalClicks: val.affiliate + val.bio,
        });
    });

    return result;
}
