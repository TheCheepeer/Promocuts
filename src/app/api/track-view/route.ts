import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { sanitizeHeader } from "@/lib/telemetry";

/**
 * Normaliza o caminho de navegação extraindo apenas o pathname e removendo querystrings ou hashes.
 */
function normalizePathname(rawPath: string): string {
    try {
        if (rawPath.startsWith("/")) {
            const url = new URL(rawPath, "http://localhost");
            return url.pathname;
        }
        const url = new URL(rawPath);
        return url.pathname;
    } catch {
        const clean = rawPath.split("?")[0].split("#")[0].trim();
        return clean.startsWith("/") ? clean : `/${clean}`;
    }
}

/**
 * Verifica se o caminho pertence ao painel administrativo ou a rotas técnicas internas.
 */
function isIgnoredPath(pathname: string): boolean {
    const lower = pathname.toLowerCase();
    return (
        lower === "/admin" ||
        lower.startsWith("/admin/") ||
        lower.startsWith("/api/") ||
        lower.startsWith("/_next/") ||
        lower === "/favicon.ico" ||
        lower.endsWith(".png") ||
        lower.endsWith(".jpg") ||
        lower.endsWith(".svg") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".css") ||
        lower.endsWith(".js")
    );
}

export async function POST(request: NextRequest) {
    let body: Record<string, unknown> | null = null;

    try {
        body = await request.json();
    } catch {
        try {
            const rawText = await request.text();
            body = rawText ? JSON.parse(rawText) : null;
        } catch {
            body = null;
        }
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json(
            { error: "Corpo da requisição inválido ou ausente." },
            { status: 400 },
        );
    }

    const { path: rawPath } = body;

    if (!rawPath || typeof rawPath !== "string") {
        return NextResponse.json(
            { error: "Caminho de navegação (path) inválido ou ausente." },
            { status: 400 },
        );
    }

    const pathname = normalizePathname(rawPath).slice(0, 255);

    // Exclusão estrita de rotas administrativas e internas
    if (isIgnoredPath(pathname)) {
        return NextResponse.json(
            { ignored: true, reason: "administrative_or_internal_path" },
            { status: 200 },
        );
    }

    // Extração e truncamento defensivo de cabeçalhos
    const rawUserAgent = request.headers.get("user-agent");
    const rawReferrer =
        request.headers.get("referer") || request.headers.get("referrer");

    const userAgent = sanitizeHeader(rawUserAgent, 512);
    const referrer = sanitizeHeader(rawReferrer, 1024);

    try {
        const supabase = createAdminClient();
        const { error } = await supabase.from("page_views").insert({
            path: pathname,
            user_agent: userAgent,
            referrer: referrer,
        });

        if (error) {
            logger.warn("Falha ao registrar visualização de página no banco", {
                message: error.message,
                code: error.code,
            });
            return NextResponse.json(
                { error: "Falha ao registrar visualização de página." },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        logger.error("Exceção ao processar registro de visualização de página", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return NextResponse.json(
            { error: "Erro interno ao processar telemetria de navegação." },
            { status: 500 },
        );
    }
}

