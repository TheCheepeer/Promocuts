import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectUrl, isEmailAuthorized } from "@/lib/security/auth";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next");
    const safeNext = sanitizeRedirectUrl(rawNext, "/admin");

    if (!code) {
        logger.warn("Requisicao para callback sem codigo de autorizacao", {
            url: request.url,
        });
        return NextResponse.redirect(
            new URL("/admin/login?error=missing_code", origin),
        );
    }

    try {
        const supabase = await createClient();
        const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            logger.warn("Falha ao trocar codigo de autenticacao por sessao", {
                mensagem: error.message,
            });
            return NextResponse.redirect(
                new URL("/admin/login?error=invalid_link", origin),
            );
        }

        const user = data?.user;
        const adminEmail = process.env.ADMIN_EMAIL;

        // Validacao rigorosa da identidade do usuario
        if (!user || !isEmailAuthorized(user.email, adminEmail)) {
            logger.warn("Usuario nao autorizado autenticado via Magic Link", {
                usuarioAutenticado: user?.email,
                administradorEsperado: adminEmail,
            });

            // Encerra imediatamente a sessao do usuario nao autorizado
            await supabase.auth.signOut();

            return NextResponse.redirect(
                new URL("/admin/login?error=unauthorized", origin),
            );
        }

        // Usuario autenticado com sucesso e validado contra a whitelist
        logger.info("Sessao administrativa estabelecida com sucesso", {
            email: user.email,
            destino: safeNext,
        });

        return NextResponse.redirect(new URL(safeNext, origin));
    } catch (err) {
        logger.error("Erro inesperado durante processamento de autenticacao", {
            erro: err instanceof Error ? err.message : String(err),
        });

        return NextResponse.redirect(
            new URL("/admin/login?error=auth_failed", origin),
        );
    }
}
