import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    isValidUuid,
    sanitizeHeader,
    trackAffiliateClick,
    trackBioLinkClick,
    trackPageView,
} from "../src/lib/telemetry.js";

describe("Telemetria de Afiliados - Validacao de Identificadores (UUID)", () => {
    it("deve aceitar UUIDs validos em formatos padrao v4 e v1", () => {
        const validUuids = [
            "123e4567-e89b-12d3-a456-426614174000",
            "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            "c9a646d3-9c61-4cc9-bc18-472e09ff7b2b",
            "00000000-0000-1000-8000-000000000000",
        ];

        for (const id of validUuids) {
            assert.equal(
                isValidUuid(id),
                true,
                `Deveria aceitar UUID valido: ${id}`,
            );
        }
    });

    it("deve rejeitar UUIDs com caracteres invalidos ou tentativas de SQL injection", () => {
        const invalidUuids = [
            "",
            "not-a-uuid",
            "123e4567-e89b-12d3-a456-42661417400Z",
            "123e4567-e89b-12d3-a456-426614174000-extra",
            "'; DROP TABLE affiliate_clicks; --",
            "<script>alert(1)</script>",
            "12345678-1234-1234-1234-1234567890123",
            "12345678-1234-1234-1234-12345678901",
        ];

        for (const id of invalidUuids) {
            assert.equal(
                isValidUuid(id),
                false,
                `Deveria rejeitar identificador invalido: ${id}`,
            );
        }
    });

    it("deve rejeitar tipos primitivos nao-string de forma defensiva", () => {
        assert.equal(isValidUuid(null), false);
        assert.equal(isValidUuid(undefined), false);
        assert.equal(isValidUuid(12345), false);
        assert.equal(isValidUuid({}), false);
        assert.equal(isValidUuid([]), false);
    });
});

describe("Telemetria de Afiliados - Truncamento Defensivo de Cabecalhos", () => {
    it("deve truncar user agent excedente a 512 caracteres", () => {
        const longUserAgent = "A".repeat(800);
        const sanitized = sanitizeHeader(longUserAgent, 512);

        assert.ok(sanitized);
        assert.equal(sanitized.length, 512);
        assert.equal(sanitized, "A".repeat(512));
    });

    it("deve preservar user agent com comprimento inferior a 512 caracteres", () => {
        const normalUserAgent =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)";
        const sanitized = sanitizeHeader(normalUserAgent, 512);

        assert.equal(sanitized, normalUserAgent);
    });

    it("deve truncar referrer excedente a 1024 caracteres", () => {
        const longReferrer = `https://promocuts.com/feed?q=${"x".repeat(1500)}`;
        const sanitized = sanitizeHeader(longReferrer, 1024);

        assert.ok(sanitized);
        assert.equal(sanitized.length, 1024);
        assert.ok(sanitized.startsWith("https://promocuts.com/feed?q="));
    });

    it("deve retornar null para cabecalhos vazios, nulos ou indefinidos", () => {
        assert.equal(sanitizeHeader(null, 512), null);
        assert.equal(sanitizeHeader(undefined, 512), null);
        assert.equal(sanitizeHeader("", 512), null);
    });
});

describe("Telemetria de Afiliados - Utilitario Client-Side (trackAffiliateClick)", () => {
    it("nao deve disparar requisicao se productId for invalido ou vazio", () => {
        let fetchCalled = false;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (() => {
            fetchCalled = true;
            return Promise.resolve(new Response());
        }) as unknown as typeof fetch;

        try {
            trackAffiliateClick("");
            assert.equal(fetchCalled, false);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it("deve tentar utilizar navigator.sendBeacon quando disponivel no navegador", () => {
        let beaconPayload: unknown = null;
        let beaconUrl: string | null = null;

        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: (url: string, data: Blob) => {
                beaconUrl = url;
                beaconPayload = data;
                return true;
            },
            configurable: true,
            writable: true,
        });

        try {
            const testProductId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
            const testVideoId = "c9a646d3-9c61-4cc9-bc18-472e09ff7b2b";

            trackAffiliateClick(testProductId, testVideoId);

            assert.equal(beaconUrl, "/api/track-click");
            assert.ok(beaconPayload instanceof Blob);
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
        }
    });

    it("deve recorrer a fetch com keepalive quando sendBeacon retornar falso ou falhar", () => {
        let fetchUrl: string | null = null;
        let fetchInit: RequestInit | undefined = undefined;

        const originalFetch = globalThis.fetch;

        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: () => false, // Simula recusa pelo navegador
            configurable: true,
            writable: true,
        });

        globalThis.fetch = ((url: string, init?: RequestInit) => {
            fetchUrl = url;
            fetchInit = init;
            return Promise.resolve(new Response());
        }) as unknown as typeof fetch;

        try {
            const testProductId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
            trackAffiliateClick(testProductId, null);

            assert.equal(fetchUrl, "/api/track-click");
            const options = fetchInit as RequestInit | undefined;
            assert.ok(options);
            assert.equal(options.method, "POST");
            assert.equal(options.keepalive, true);
            const parsedBody = JSON.parse(options.body as string);
            assert.equal(parsedBody.product_id, testProductId);
            assert.equal(parsedBody.video_id, null);
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
            globalThis.fetch = originalFetch;
        }
    });

    it("deve tratar falhas silenciosamente sem lancar excecoes", () => {
        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: () => {
                throw new Error("SecurityError: Bloqueado por adblocker");
            },
            configurable: true,
            writable: true,
        });

        try {
            assert.doesNotThrow(() => {
                trackAffiliateClick("a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
            });
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
        }
    });
});

describe("Telemetria de Bio Links - Utilitário Client-Side (trackBioLinkClick)", () => {
    it("não deve disparar requisição se bioLinkId for vazio ou indefinido", () => {
        let called = false;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (() => {
            called = true;
            return Promise.resolve(new Response());
        }) as unknown as typeof fetch;

        try {
            trackBioLinkClick("");
            assert.equal(called, false);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it("deve disparar sendBeacon ou fetch para /api/track-click com bio_link_id", () => {
        const testBioLinkId = "550e8400-e29b-41d4-a716-446655440000";
        let beaconUrl: string | null = null;
        let beaconPayload: string | null = null;

        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: (url: string, data: Blob) => {
                beaconUrl = url;
                beaconPayload = "blob";
                return true;
            },
            configurable: true,
            writable: true,
        });

        try {
            trackBioLinkClick(testBioLinkId);
            assert.equal(beaconUrl, "/api/track-click");
            assert.ok(beaconPayload);
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
        }
    });
});

describe("Telemetria de Visitas - Utilitário Client-Side (trackPageView)", () => {
    it("não deve disparar requisição se path for vazio, nulo ou indefinido", () => {
        let called = false;
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (() => {
            called = true;
            return Promise.resolve(new Response());
        }) as unknown as typeof fetch;

        try {
            trackPageView("");
            // @ts-expect-error teste defensivo
            trackPageView(null);
            // @ts-expect-error teste defensivo
            trackPageView(undefined);
            assert.equal(called, false);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    it("não deve disparar requisição para rotas administrativas (/admin, /admin/*)", () => {
        let called = false;
        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: () => {
                called = true;
                return true;
            },
            configurable: true,
            writable: true,
        });

        try {
            trackPageView("/admin");
            trackPageView("/admin/metrics");
            trackPageView("/admin/videos");
            trackPageView("/admin/products?tab=1");
            trackPageView("/ADMIN/settings");
            trackPageView("/api/track-click");

            assert.equal(called, false, "Rotas /admin e /api jamais devem disparar telemetria de visualização");
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
        }
    });

    it("deve disparar sendBeacon ou fetch para /api/track-view com páginas públicas", () => {
        let beaconUrl: string | null = null;

        Object.defineProperty(globalThis, "window", {
            value: globalThis,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(globalThis.navigator, "sendBeacon", {
            value: (url: string) => {
                beaconUrl = url;
                return true;
            },
            configurable: true,
            writable: true,
        });

        try {
            trackPageView("/");
            assert.equal(beaconUrl, "/api/track-view");

            beaconUrl = null;
            trackPageView("/c/eletronicos");
            assert.equal(beaconUrl, "/api/track-view");

            beaconUrl = null;
            trackPageView("/v/video-promocional");
            assert.equal(beaconUrl, "/api/track-view");
        } finally {
            // @ts-expect-error limpeza de mock
            delete globalThis.window;
            // @ts-expect-error limpeza de mock
            delete globalThis.navigator.sendBeacon;
        }
    });
});

