const isDev =
    process.env.IS_DEV === "true" || process.env.NODE_ENV === "development";

function formatTimestamp(): string {
    return new Date().toISOString();
}

function sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== "object") {
        return data;
    }

    const sensitiveKeys = [
        "password",
        "secret",
        "token",
        "key",
        "service_role",
        "auth_secret",
        "authorization",
    ];

    try {
        const copy = JSON.parse(JSON.stringify(data));
        const mask = (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) {
                if (
                    sensitiveKeys.some((pattern) =>
                        k.toLowerCase().includes(pattern.toLowerCase()),
                    )
                ) {
                    obj[k] = "[REDACTED]";
                } else if (v && typeof v === "object") {
                    mask(v as Record<string, unknown>);
                }
            }
        };

        mask(copy);
        return copy;
    } catch {
        return "[Unserializable Data]";
    }
}

export const logger = {
    isDev,

    debug(message: string, context?: unknown): void {
        if (!isDev) {
            return;
        }
        const timestamp = formatTimestamp();
        if (context !== undefined) {
            console.debug(
                `[DEBUG] [${timestamp}] ${message}`,
                sanitizeData(context),
            );
        } else {
            console.debug(`[DEBUG] [${timestamp}] ${message}`);
        }
    },

    info(message: string, context?: unknown): void {
        const timestamp = formatTimestamp();
        if (context !== undefined) {
            console.info(
                `[INFO] [${timestamp}] ${message}`,
                sanitizeData(context),
            );
        } else {
            console.info(`[INFO] [${timestamp}] ${message}`);
        }
    },

    warn(message: string, context?: unknown): void {
        const timestamp = formatTimestamp();
        if (context !== undefined) {
            console.warn(
                `[WARN] [${timestamp}] ${message}`,
                sanitizeData(context),
            );
        } else {
            console.warn(`[WARN] [${timestamp}] ${message}`);
        }
    },

    error(message: string, error?: unknown): void {
        const timestamp = formatTimestamp();
        if (isDev) {
            if (error !== undefined) {
                console.error(`[ERROR] [${timestamp}] ${message}`, error);
            } else {
                console.error(`[ERROR] [${timestamp}] ${message}`);
            }
            return;
        }

        let safeErrorSummary: string | undefined;
        if (error instanceof Error) {
            safeErrorSummary = error.message;
        } else if (typeof error === "string") {
            safeErrorSummary = error;
        }

        if (safeErrorSummary) {
            console.error(
                `[ERROR] [${timestamp}] ${message} - ${safeErrorSummary}`,
            );
        } else {
            console.error(`[ERROR] [${timestamp}] ${message}`);
        }
    },
};
