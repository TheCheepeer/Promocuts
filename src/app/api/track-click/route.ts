import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { isValidUuid, sanitizeHeader } from "@/lib/telemetry";
import type { AffiliateClickInsert } from "@/types/database";

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
            { error: "Corpo da requisicao invalido ou ausente." },
            { status: 400 },
        );
    }

    const { product_id, video_id } = body;

    // Validacao estrita do ID de produto obrigatorio
    if (!isValidUuid(product_id)) {
        return NextResponse.json(
            { error: "Identificador de produto invalido." },
            { status: 400 },
        );
    }

    // Validacao estrita do ID de video opcional
    if (
        video_id !== undefined &&
        video_id !== null &&
        video_id !== "" &&
        !isValidUuid(video_id)
    ) {
        return NextResponse.json(
            { error: "Identificador de video invalido." },
            { status: 400 },
        );
    }

    // Extracao e truncamento defensivo de cabecalhos
    const rawUserAgent = request.headers.get("user-agent");
    const rawReferrer =
        request.headers.get("referer") || request.headers.get("referrer");

    const userAgent = sanitizeHeader(rawUserAgent, 512);
    const referrer = sanitizeHeader(rawReferrer, 1024);

    try {
        const supabase = createAdminClient();
        const clickData: AffiliateClickInsert = {
            product_id: product_id as string,
            video_id: (video_id as string) || null,
            user_agent: userAgent,
            referrer: referrer,
        };
        const { error } = await supabase
            .from("affiliate_clicks")
            .insert(clickData);

        if (error) {
            logger.warn("Falha ao registrar clique de afiliado no banco", {
                message: error.message,
                code: error.code,
            });
            return NextResponse.json(
                { error: "Falha ao registrar telemetria de clique." },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        logger.error("Excecao ao processar clique de afiliado", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return NextResponse.json(
            { error: "Erro interno ao processar telemetria." },
            { status: 500 },
        );
    }
}
