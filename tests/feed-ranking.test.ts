import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    calculateVideoScore,
    rankVideosByFreshness,
    type RankableVideo,
} from "../src/lib/feed/ranking.js";

describe("Algoritmo de Ranqueamento de Feed (Recência e Dispersão Estocástica)", () => {
    const fixedNow = new Date("2026-10-12T12:00:00.000Z").getTime();
    const oneHour = 60 * 60 * 1000;

    describe("calculateVideoScore", () => {
        it("deve atribuir pontuação base 100 a um vídeo recém-publicado sem jitter", () => {
            const createdAt = new Date(fixedNow).toISOString();
            const score = calculateVideoScore(createdAt, fixedNow, () => 0);

            assert.strictEqual(score, 100);
        });

        it("deve apresentar pontuação de 50 após exatamente 24 horas (meia-vida) sem jitter", () => {
            const createdAt = new Date(fixedNow - 24 * oneHour).toISOString();
            const score = calculateVideoScore(createdAt, fixedNow, () => 0);

            // 100 / (1 + (24/24)^0.75) = 100 / 2 = 50
            assert.strictEqual(Math.round(score), 50);
        });

        it("deve decair progressivamente à medida que a idade do vídeo aumenta", () => {
            const date1h = new Date(fixedNow - 1 * oneHour).toISOString();
            const date12h = new Date(fixedNow - 12 * oneHour).toISOString();
            const date48h = new Date(fixedNow - 48 * oneHour).toISOString();
            const date7d = new Date(fixedNow - 7 * 24 * oneHour).toISOString();

            const score1h = calculateVideoScore(date1h, fixedNow, () => 0);
            const score12h = calculateVideoScore(date12h, fixedNow, () => 0);
            const score48h = calculateVideoScore(date48h, fixedNow, () => 0);
            const score7d = calculateVideoScore(date7d, fixedNow, () => 0);

            assert.ok(score1h > score12h, "1h deve ter pontuação maior que 12h");
            assert.ok(score12h > score48h, "12h deve ter pontuação maior que 48h");
            assert.ok(score48h > score7d, "48h deve ter pontuação maior que 7 dias");
        });

        it("deve incorporar o jitter controlado de até 25 pontos", () => {
            const createdAt = new Date(fixedNow).toISOString();

            const scoreMinJitter = calculateVideoScore(createdAt, fixedNow, () => 0);
            const scoreHalfJitter = calculateVideoScore(createdAt, fixedNow, () => 0.5);
            const scoreMaxJitter = calculateVideoScore(createdAt, fixedNow, () => 1);

            assert.strictEqual(scoreMinJitter, 100);
            assert.strictEqual(scoreHalfJitter, 112.5);
            assert.strictEqual(scoreMaxJitter, 125);
        });

        it("deve tratar datas futuras graciosamente mantendo pontuação máxima", () => {
            const futureDate = new Date(fixedNow + 10 * oneHour).toISOString();
            const score = calculateVideoScore(futureDate, fixedNow, () => 0);

            assert.strictEqual(score, 100);
        });
    });

    describe("rankVideosByFreshness", () => {
        it("deve retornar lista vazia ou unitária sem erros", () => {
            assert.deepStrictEqual(rankVideosByFreshness([]), []);

            const singleVideo: RankableVideo[] = [
                { id: "vid-1", created_at: new Date(fixedNow).toISOString() },
            ];
            assert.deepStrictEqual(rankVideosByFreshness(singleVideo), singleVideo);
        });

        it("deve manter um vídeo novo no topo mesmo se um vídeo antigo receber jitter máximo", () => {
            // Vídeo com 2 horas de idade
            const videoNovo: RankableVideo = {
                id: "novo",
                created_at: new Date(fixedNow - 2 * oneHour).toISOString(),
            };
            // Vídeo com 14 dias de idade (336 horas)
            const videoAntigo: RankableVideo = {
                id: "antigo",
                created_at: new Date(fixedNow - 14 * 24 * oneHour).toISOString(),
            };

            // Jitter determinístico: o vídeo novo recebe 0 de jitter, o antigo recebe o máximo (1)
            let callCount = 0;
            const customRandom = () => {
                callCount++;
                // Chamada 1 (novo): jitter zero
                // Chamada 2 (antigo): jitter máximo (1 -> 25 pontos)
                return callCount === 1 ? 0 : 1;
            };

            const ranked = rankVideosByFreshness([videoAntigo, videoNovo], fixedNow, customRandom);

            assert.strictEqual(ranked[0].id, "novo");
            assert.strictEqual(ranked[1].id, "antigo");
        });

        it("não deve mutar o array original fornecido", () => {
            const original: RankableVideo[] = [
                { id: "antigo", created_at: new Date(fixedNow - 48 * oneHour).toISOString() },
                { id: "novo", created_at: new Date(fixedNow).toISOString() },
            ];

            const copy = [...original];
            const ranked = rankVideosByFreshness(original, fixedNow, () => 0);

            assert.deepStrictEqual(original, copy);
            assert.strictEqual(ranked[0].id, "novo");
            assert.strictEqual(ranked[1].id, "antigo");
        });

        it("deve preservar todos os metadados dos vídeos classificados", () => {
            interface CustomVideo extends RankableVideo {
                title: string;
                slug: string;
            }

            const items: CustomVideo[] = [
                {
                    id: "v1",
                    title: "Corte Legal",
                    slug: "corte-legal",
                    created_at: new Date(fixedNow - 5 * oneHour).toISOString(),
                },
                {
                    id: "v2",
                    title: "Corte Super Recente",
                    slug: "corte-super-recente",
                    created_at: new Date(fixedNow).toISOString(),
                },
            ];

            const ranked = rankVideosByFreshness(items, fixedNow, () => 0);

            assert.strictEqual(ranked[0].slug, "corte-super-recente");
            assert.strictEqual(ranked[0].title, "Corte Super Recente");
            assert.strictEqual(ranked[1].slug, "corte-legal");
        });
    });
});

