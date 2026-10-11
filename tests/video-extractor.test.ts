import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractVideoMetadata } from "../src/lib/extractor/video-parser.js";

describe("Extrator de Vídeos - Proteção contra SSRF e Validação de Entrada", () => {
    it("deve rejeitar URLs vazias ou com tipos inválidos", async () => {
        await assert.rejects(
            async () => {
                // @ts-expect-error testando tipo inválido em tempo de execução
                await extractVideoMetadata(null);
            },
            {
                message: "URL de vídeo não fornecida ou inválida.",
            },
        );

        await assert.rejects(
            async () => {
                await extractVideoMetadata("");
            },
            {
                message: "URL de vídeo não fornecida ou inválida.",
            },
        );
    });

    it("deve bloquear tentativas de acesso a redes locais e IPs privados (SSRF)", async () => {
        const forbiddenUrls = [
            "http://localhost:3000/api",
            "http://127.0.0.1/admin",
            "http://169.254.169.254/latest/meta-data/",
            "http://10.0.0.1/painel",
            "http://192.168.1.1/roteador",
            "javascript:alert(1)",
            "file:///etc/passwd",
        ];

        for (const url of forbiddenUrls) {
            await assert.rejects(
                async () => {
                    await extractVideoMetadata(url);
                },
                /A URL informada é inválida ou direciona para um endereço de rede restrito por segurança/,
                `Deveria bloquear URL restrita: ${url}`,
            );
        }
    });

    it("deve rejeitar URLs de plataformas não suportadas", async () => {
        const unsupportedUrls = [
            "https://www.facebook.com/watch/?v=123456",
            "https://twitter.com/user/status/123456",
            "https://globo.com/noticia-exemplo",
        ];

        for (const url of unsupportedUrls) {
            await assert.rejects(
                async () => {
                    await extractVideoMetadata(url);
                },
                /URL não reconhecida/,
                `Deveria rejeitar plataforma não suportada: ${url}`,
            );
        }
    });
});

describe("Extrator de Vídeos - YouTube Shorts", () => {
    it("deve extrair metadados e gerar thumbnail garantida para YouTube Shorts", async () => {
        const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
        const metadata = await extractVideoMetadata(url);

        assert.equal(metadata.platform, "shorts");
        assert.equal(metadata.platformVideoId, "dQw4w9WgXcQ");
        assert.ok(metadata.thumbnailUrl, "Deveria conter uma URL de miniatura");
        assert.ok(
            metadata.thumbnailUrl.includes("ytimg.com") ||
                metadata.thumbnailUrl.includes("youtube.com"),
            "Miniatura deve apontar para os servidores do YouTube",
        );
    });
});

describe("Extrator de Vídeos - TikTok", () => {
    it("deve identificar plataforma TikTok e id de vídeo", async () => {
        const url = "https://www.tiktok.com/@scout2015/video/6718335390845095173";
        const metadata = await extractVideoMetadata(url);

        assert.equal(metadata.platform, "tiktok");
        assert.equal(metadata.platformVideoId, "6718335390845095173");
    });
});

describe("Extrator de Vídeos - Instagram Reels", () => {
    it("deve identificar plataforma Instagram Reels e id de corte", async () => {
        const url = "https://www.instagram.com/reel/C_k3y7_O5h2/";
        const metadata = await extractVideoMetadata(url);

        assert.equal(metadata.platform, "reels");
        assert.equal(metadata.platformVideoId, "C_k3y7_O5h2");
    });
});

