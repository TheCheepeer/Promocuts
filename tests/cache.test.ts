import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
    isRedisConfigured,
    getCachedData,
    setCachedData,
    deleteCachedData,
    invalidateFeedCache,
} from "../src/lib/cache/redis";

describe("Modulo de Cache Serverless - Resiliencia e Fallback (Upstash Redis)", () => {
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    afterEach(() => {
        if (originalUrl) {
            process.env.UPSTASH_REDIS_REST_URL = originalUrl;
        } else {
            delete process.env.UPSTASH_REDIS_REST_URL;
        }

        if (originalToken) {
            process.env.UPSTASH_REDIS_REST_TOKEN = originalToken;
        } else {
            delete process.env.UPSTASH_REDIS_REST_TOKEN;
        }
    });

    it("deve reportar que o Redis nao esta configurado quando variaveis estao ausentes", () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        assert.equal(isRedisConfigured(), false);
    });

    it("deve reportar que o Redis esta configurado quando ambas variaveis estao presentes", () => {
        process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
        process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token-xyz";

        assert.equal(isRedisConfigured(), true);
    });

    it("deve retornar null silenciosamente ao buscar cache sem credenciais configuradas", async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        const result = await getCachedData<string>("teste:chave:inexistente");
        assert.equal(result, null);
    });

    it("deve executar setCachedData silenciosamente e sem excecoes quando sem credenciais", async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        await assert.doesNotReject(async () => {
            await setCachedData("teste:chave", { dado: 123 }, 60);
        });
    });

    it("deve executar deleteCachedData silenciosamente e sem excecoes quando sem credenciais", async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        await assert.doesNotReject(async () => {
            await deleteCachedData("teste:chave");
        });
    });

    it("deve executar invalidateFeedCache silenciosamente e sem excecoes quando sem credenciais", async () => {
        delete process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_TOKEN;

        await assert.doesNotReject(async () => {
            await invalidateFeedCache();
        });
    });
});

