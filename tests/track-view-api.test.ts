import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../src/app/api/track-view/route.js";

describe("Endpoint de Telemetria de Visitas - POST /api/track-view", () => {
    it("deve retornar 400 se o corpo da requisição for inválido ou ausente", async () => {
        const req = new NextRequest("http://localhost/api/track-view", {
            method: "POST",
            body: "invalid-json",
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req);
        assert.equal(res.status, 400);

        const data = await res.json();
        assert.ok(data.error);
    });

    it("deve retornar 400 se o parâmetro path for ausente ou não for string", async () => {
        const req = new NextRequest("http://localhost/api/track-view", {
            method: "POST",
            body: JSON.stringify({ path: 12345 }),
            headers: { "Content-Type": "application/json" },
        });

        const res = await POST(req);
        assert.equal(res.status, 400);

        const data = await res.json();
        assert.match(data.error, /caminho/i);
    });

    it("deve ignorar com status 200 e flag ignored para rotas do painel /admin", async () => {
        const adminPaths = [
            "/admin",
            "/admin/",
            "/admin/metrics",
            "/admin/videos",
            "/admin/products",
            "/admin/settings",
            "/ADMIN/bio-links",
            "/admin/metrics?period=30d",
        ];

        for (const path of adminPaths) {
            const req = new NextRequest("http://localhost/api/track-view", {
                method: "POST",
                body: JSON.stringify({ path }),
                headers: { "Content-Type": "application/json" },
            });

            const res = await POST(req);
            assert.equal(res.status, 200);

            const data = await res.json();
            assert.equal(data.ignored, true, `Deveria ter ignorado caminho administrativo: ${path}`);
            assert.equal(data.reason, "administrative_or_internal_path");
        }
    });

    it("deve ignorar com status 200 rotas técnicas internas e arquivos estáticos", async () => {
        const internalPaths = [
            "/api/track-click",
            "/api/cron/check-offers",
            "/_next/static/chunks/main.js",
            "/favicon.ico",
            "/logo.png",
            "/icon.svg",
        ];

        for (const path of internalPaths) {
            const req = new NextRequest("http://localhost/api/track-view", {
                method: "POST",
                body: JSON.stringify({ path }),
                headers: { "Content-Type": "application/json" },
            });

            const res = await POST(req);
            assert.equal(res.status, 200);

            const data = await res.json();
            assert.equal(data.ignored, true, `Deveria ter ignorado caminho interno: ${path}`);
        }
    });
});

