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
            { error: "Corpo da requisição inválido ou ausente." },
            { status: 400 },
        );
    }

    const { product_id, video_id, link_id, store_name, bio_link_id } = body;

    // Extração e truncamento defensivo de cabeçalhos e strings
    const rawUserAgent = request.headers.get("user-agent");
    const rawReferrer =
        request.headers.get("referer") || request.headers.get("referrer");

    const userAgent = sanitizeHeader(rawUserAgent, 512);
    const referrer = sanitizeHeader(rawReferrer, 1024);

    // Fluxo 1: Telemetria de Clique em Bio Link / Comunidade
    if (bio_link_id !== undefined && bio_link_id !== null) {
        if (!isValidUuid(bio_link_id)) {
            return NextResponse.json(
                { error: "Identificador de link de bio inválido." },
                { status: 400 },
            );
        }

        try {
            const supabase = createAdminClient();
            const { error } = await supabase
                .from("bio_link_clicks")
                .insert({
                    bio_link_id: bio_link_id as string,
                    user_agent: userAgent,
                    referrer: referrer,
                });

            if (error) {
                logger.warn("Falha ao registrar clique de bio link no banco", {
                    message: error.message,
                    code: error.code,
                });
                return NextResponse.json(
                    { error: "Falha ao registrar telemetria de clique em bio link." },
                    { status: 500 },
                );
            }

            return NextResponse.json({ success: true }, { status: 200 });
        } catch (err) {
            logger.error("Exceção ao processar clique em bio link", {
                erro: err instanceof Error ? err.message : String(err),
            });
            return NextResponse.json(
                { error: "Erro interno ao processar telemetria." },
                { status: 500 },
            );
        }
    }

    // Fluxo 2: Telemetria de Clique de Afiliado (Produtos e Ofertas)
    if (!isValidUuid(product_id)) {
        return NextResponse.json(
            { error: "Identificador de produto ou link de bio inválido." },
            { status: 400 },
        );
    }

    // Validação estrita do ID de vídeo opcional
    if (
        video_id !== undefined &&
        video_id !== null &&
        video_id !== "" &&
        !isValidUuid(video_id)
    ) {
        return NextResponse.json(
            { error: "Identificador de vídeo inválido." },
            { status: 400 },
        );
    }

    // Validação estrita do ID de link opcional
    if (
        link_id !== undefined &&
        link_id !== null &&
        link_id !== "" &&
        !isValidUuid(link_id)
    ) {
        return NextResponse.json(
            { error: "Identificador de oferta inválido." },
            { status: 400 },
        );
    }

    const sanitizedStoreName =
        typeof store_name === "string" ? store_name.slice(0, 100).trim() : null;

    try {
        const supabase = createAdminClient();
        const clickData: AffiliateClickInsert = {
            product_id: product_id as string,
            video_id: (video_id as string) || null,
            link_id: (link_id as string) || null,
            store_name: sanitizedStoreName || null,
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
        logger.error("Exceção ao processar clique de afiliado", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return NextResponse.json(
            { error: "Erro interno ao processar telemetria." },
            { status: 500 },
        );
    }
}
