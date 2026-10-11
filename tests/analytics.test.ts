import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    parseTrafficSource,
    getDateRangeBounds,
    groupDailyTimeline,
} from "../src/lib/analytics.js";

describe("Analytics - Análise Sintática de Origens de Tráfego (Referrers)", () => {
    it("deve identificar tráfego direto para URLs ausentes ou vazias", () => {
        assert.equal(parseTrafficSource(null).id, "direct");
        assert.equal(parseTrafficSource(undefined).id, "direct");
        assert.equal(parseTrafficSource("").id, "direct");
        assert.equal(parseTrafficSource("   ").id, "direct");
        assert.equal(parseTrafficSource(null).label, "Tráfego Direto");
    });

    it("deve identificar tráfego originado do Instagram", () => {
        const referrals = [
            "https://l.instagram.com/",
            "https://www.instagram.com/p/C_12345/",
            "http://instagram.com",
            "android-app://com.instagram.android",
        ];

        for (const ref of referrals) {
            const res = parseTrafficSource(ref);
            assert.equal(res.id, "instagram", `Deveria classificar como Instagram: ${ref}`);
            assert.equal(res.label, "Instagram");
        }
    });

    it("deve identificar tráfego originado do TikTok", () => {
        const referrals = [
            "https://www.tiktok.com/@creator/video/123",
            "https://tiktok.com/",
        ];

        for (const ref of referrals) {
            const res = parseTrafficSource(ref);
            assert.equal(res.id, "tiktok", `Deveria classificar como TikTok: ${ref}`);
            assert.equal(res.label, "TikTok");
        }
    });

    it("deve identificar tráfego originado do YouTube", () => {
        const referrals = [
            "https://www.youtube.com/watch?v=abc",
            "https://youtu.be/abc",
            "http://m.youtube.com",
        ];

        for (const ref of referrals) {
            const res = parseTrafficSource(ref);
            assert.equal(res.id, "youtube", `Deveria classificar como YouTube: ${ref}`);
            assert.equal(res.label, "YouTube");
        }
    });

    it("deve identificar tráfego originado da Twitch e X/Twitter", () => {
        assert.equal(parseTrafficSource("https://www.twitch.tv/streamer").id, "twitch");
        assert.equal(parseTrafficSource("https://t.co/xyz123").id, "x");
        assert.equal(parseTrafficSource("https://twitter.com/post/1").id, "x");
        assert.equal(parseTrafficSource("https://x.com/post/2").id, "x");
    });

    it("deve classificar outros domínios genéricos como Outros Sites", () => {
        const referrals = [
            "https://google.com/search?q=teste",
            "https://facebook.com/share",
            "https://meuamigo.blog.br/artigo",
        ];

        for (const ref of referrals) {
            const res = parseTrafficSource(ref);
            assert.equal(res.id, "other");
            assert.equal(res.label, "Outros Sites");
        }
    });
});

describe("Analytics - Limites de Período Temporal (getDateRangeBounds)", () => {
    it("deve definir início às 00:00 do dia atual para o período 'today'", () => {
        const bounds = getDateRangeBounds("today");
        assert.ok(bounds.startDate);
        assert.equal(bounds.startDate.getHours(), 0);
        assert.equal(bounds.startDate.getMinutes(), 0);
        assert.equal(bounds.startDate.getSeconds(), 0);
    });

    it("deve definir intervalo de 7 dias para '7d'", () => {
        const bounds = getDateRangeBounds("7d");
        assert.ok(bounds.startDate);
        const diffDays = Math.round(
            (bounds.endDate.getTime() - bounds.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        assert.ok(diffDays >= 6 && diffDays <= 8);
    });

    it("deve definir intervalo de 30 dias para '30d'", () => {
        const bounds = getDateRangeBounds("30d");
        assert.ok(bounds.startDate);
        const diffDays = Math.round(
            (bounds.endDate.getTime() - bounds.startDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        assert.ok(diffDays >= 29 && diffDays <= 31);
    });

    it("deve retornar startDate nulo para 'all'", () => {
        const bounds = getDateRangeBounds("all");
        assert.equal(bounds.startDate, null);
    });
});

describe("Analytics - Agrupamento Temporal Diário (groupDailyTimeline)", () => {
    it("deve preencher todos os dias do período mesmo com ausência de dados", () => {
        const timeline = groupDailyTimeline([], [], 7);
        assert.equal(timeline.length, 7);

        for (const point of timeline) {
            assert.equal(point.affiliateClicks, 0);
            assert.equal(point.bioLinkClicks, 0);
            assert.equal(point.totalClicks, 0);
            assert.match(point.dateKey, /^\d{4}-\d{2}-\d{2}$/);
            assert.match(point.label, /^\d{2}\/\d{2}$/);
        }
    });

    it("deve acumular cliques corretamente nas datas correspondentes", () => {
        const todayIso = new Date().toISOString();
        const timeline = groupDailyTimeline([todayIso, todayIso], [todayIso], 7);

        const lastPoint = timeline[timeline.length - 1];
        assert.equal(lastPoint.affiliateClicks, 2);
        assert.equal(lastPoint.bioLinkClicks, 1);
        assert.equal(lastPoint.totalClicks, 3);
    });
});

