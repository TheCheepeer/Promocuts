import { NextResponse, type NextRequest } from "next/server";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { extractOpenGraphMetadata, isSafeExternalUrl } from "@/lib/extractor/og-parser";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
    try {
        // Validação estrita de sessão administrativa
        await requireAdminAuth();

        let body: { url?: unknown } | null = null;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Corpo da requisição inválido ou ausente." },
                { status: 400 },
            );
        }

        const rawUrl = body?.url;
        if (!rawUrl || typeof rawUrl !== "string") {
            return NextResponse.json(
                { error: "O parâmetro url é obrigatório e deve ser uma string." },
                { status: 400 },
            );
        }

        const trimmedUrl = rawUrl.trim();
        if (!isSafeExternalUrl(trimmedUrl)) {
            return NextResponse.json(
                {
                    error:
                        "A URL informada é inválida ou direciona para um endereço de rede restrito por segurança.",
                },
                { status: 400 },
            );
        }

        const metadata = await extractOpenGraphMetadata(trimmedUrl);

        return NextResponse.json(
            {
                success: true,
                data: metadata,
            },
            { status: 200 },
        );
    } catch (err) {
        logger.error("Erro ao processar extração de metadados Open Graph", {
            erro: err instanceof Error ? err.message : String(err),
        });

        const status =
            err instanceof Error && err.message.includes("Não autorizado") ? 403 : 500;

        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Falha ao extrair metadados da oferta informada.",
            },
            { status },
        );
    }
}

