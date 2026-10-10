import { NextResponse, type NextRequest } from "next/server";
import { auditOfferLinks } from "@/lib/monitoring/link-checker";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        // Se CRON_SECRET estiver configurada no ambiente, valida o Bearer token
        if (cronSecret) {
            const expectedHeader = `Bearer ${cronSecret}`;
            if (authHeader !== expectedHeader) {
                logger.warn("Tentativa de acesso não autorizada ao endpoint de cron", {
                    ip: request.headers.get("x-forwarded-for"),
                });
                return NextResponse.json(
                    { error: "Acesso não autorizado." },
                    { status: 401 },
                );
            }
        }

        // Executa a auditoria de um lote de links
        const summary = await auditOfferLinks(25);

        return NextResponse.json(
            {
                success: true,
                message: "Auditoria de links executada com sucesso.",
                summary,
            },
            { status: 200 },
        );
    } catch (err) {
        logger.error("Exceção na execução do Cron Job de ofertas", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return NextResponse.json(
            {
                error:
                    err instanceof Error
                        ? err.message
                        : "Falha na execução do processo de auditoria.",
            },
            { status: 500 },
        );
    }
}

