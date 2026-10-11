import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

let redisClient: Redis | null = null;

/**
 * Obtem o cliente singleton do Upstash Redis via HTTP/REST.
 * Retorna null silenciosamente caso as variaveis nao estejam configuradas.
 */
export function getRedisClient(): Redis | null {
    if (redisClient) {
        return redisClient;
    }

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        return null;
    }

    try {
        redisClient = new Redis({
            url,
            token,
        });
        return redisClient;
    } catch (err) {
        logger.warn("Falha ao inicializar o cliente Upstash Redis", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

/**
 * Verifica se as credenciais do Upstash Redis estao presentes no ambiente.
 */
export function isRedisConfigured(): boolean {
    return Boolean(
        process.env.UPSTASH_REDIS_REST_URL &&
            process.env.UPSTASH_REDIS_REST_TOKEN,
    );
}

function isDynamicServerError(err: unknown): boolean {
    if (
        typeof err === "object" &&
        err !== null &&
        "digest" in err &&
        (err as { digest: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
        return true;
    }
    return false;
}

/**
 * Consulta um dado armazenado em cache por chave.
 * Retorna null em caso de cache miss, ausência de credenciais ou falha de rede.
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();
    if (!redis) {
        return null;
    }

    try {
        const data = await redis.get<T>(key);
        if (data !== null && data !== undefined) {
            logger.debug(`Cache hit para chave: ${key}`);
            return data;
        }
        return null;
    } catch (err) {
        if (isDynamicServerError(err)) {
            throw err;
        }
        logger.warn(`Falha na leitura de cache para chave: ${key}`, {
            erro: err instanceof Error ? err.message : String(err),
        });
        return null;
    }
}

/**
 * Grava um dado em cache com tempo de vida definido (TTL em segundos).
 * Silencioso em caso de indisponibilidade para garantir resiliencia.
 */
export async function setCachedData<T>(
    key: string,
    data: T,
    ttlSeconds = 300,
): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
        return;
    }

    try {
        await redis.set(key, data, { ex: ttlSeconds });
        logger.debug(`Cache gravado para chave: ${key} (TTL: ${ttlSeconds}s)`);
    } catch (err) {
        if (isDynamicServerError(err)) {
            throw err;
        }
        logger.warn(`Falha na gravacao de cache para chave: ${key}`, {
            erro: err instanceof Error ? err.message : String(err),
        });
    }
}

/**
 * Remove uma chave especifica do cache.
 */
export async function deleteCachedData(key: string): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
        return;
    }

    try {
        await redis.del(key);
        logger.debug(`Cache removido para chave: ${key}`);
    } catch (err) {
        if (isDynamicServerError(err)) {
            throw err;
        }
        logger.warn(`Falha ao remover cache para chave: ${key}`, {
            erro: err instanceof Error ? err.message : String(err),
        });
    }
}

/**
 * Invalida as principais chaves da vitrine publica (feed geral, categorias e configuracoes).
 * Disparado pelas Server Actions administrativas ao criar, editar ou excluir conteudo.
 */
export async function invalidateFeedCache(): Promise<void> {
    const redis = getRedisClient();
    if (!redis) {
        return;
    }

    try {
        await redis.del(
            "promocuts:feed:all",
            "promocuts:categories:all",
            "promocuts:settings:singleton",
            "promocuts:bio_links:all",
        );
        logger.info("Cache da vitrine publica invalidado com sucesso");
    } catch (err) {
        if (isDynamicServerError(err)) {
            throw err;
        }
        logger.warn("Falha ao invalidar cache do feed", {
            erro: err instanceof Error ? err.message : String(err),
        });
    }
}

