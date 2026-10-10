"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirectUrl, isEmailAuthorized } from "@/lib/security/auth";
import { logger } from "@/lib/logger";

export type LoginActionState = {
    success: boolean;
    message: string;
    error?: string;
};

/**
 * Server Action para envio de Magic Link de autenticacao administrativa.
 * Aplica defesa em profundidade para evitar enumeracao de usuarios e exaustao de cotas.
 */
export async function sendMagicLink(
    _prevState: LoginActionState,
    formData: FormData,
): Promise<LoginActionState> {
    const rawEmail = formData.get("email");
    const rawNext = formData.get("next");

    if (!rawEmail || typeof rawEmail !== "string") {
        return {
            success: false,
            message: "",
            error: "Informe um endereco de e-mail valido.",
        };
    }

    const email = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            success: false,
            message: "",
            error: "Formato de e-mail invalido. Verifique o endereco digitado.",
        };
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || adminEmail.trim() === "") {
        logger.error(
            "Tentativa de login administrativo sem ADMIN_EMAIL configurado no ambiente",
        );
        return {
            success: false,
            message: "",
            error: "Servidor em configuracao. Contate o administrador do sistema.",
        };
    }

    // Prevencao de enumeracao e consumo indevido de cotas:
    // Se o e-mail informado nao for o do administrador, nao dispara requisicao ao provedor
    if (!isEmailAuthorized(email, adminEmail)) {
        logger.warn(
            "Tentativa de solicitacao de Magic Link para e-mail nao autorizado",
            {
                emailSolicitado: email,
            },
        );

        return {
            success: true,
            message:
                "Se o e-mail informado estiver cadastrado, voce recebera um link de acesso em instantes.",
        };
    }

    // E-mail coincide com o administrador cadastrado
    try {
        const supabase = await createClient();
        const safeNext = sanitizeRedirectUrl(
            typeof rawNext === "string" ? rawNext : null,
            "/admin",
        );

        let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

        // Se NEXT_PUBLIC_APP_URL nao estiver configurado ou apontar para localhost,
        // tenta detectar a URL publica real a partir dos cabecalhos da requisicao HTTP
        if (!appUrl || appUrl.includes("localhost")) {
            try {
                const headerList = await headers();
                const host =
                    headerList.get("x-forwarded-host") || headerList.get("host");
                const proto =
                    headerList.get("x-forwarded-proto") ||
                    (host?.includes("localhost") ? "http" : "https");

                if (host && !host.includes("localhost")) {
                    appUrl = `${proto}://${host}`;
                }
            } catch {
                // Silencioso se invocado fora do ciclo de requisicao HTTP
            }
        }

        if (!appUrl) {
            appUrl = "http://localhost:3000";
        }

        // Remove barras finais para evitar URLs duplicadas (ex: //auth/callback)
        appUrl = appUrl.replace(/\/+$/, "");

        const emailRedirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(safeNext)}`;

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo,
            },
        });

        if (error) {
            logger.error("Erro retornado pelo Supabase Auth ao enviar OTP", {
                mensagem: error.message,
            });

            return {
                success: false,
                message: "",
                error: "Nao foi possivel enviar o link de acesso. Verifique as credenciais ou tente novamente mais tarde.",
            };
        }

        logger.info("Magic Link enviado com sucesso para o administrador", {
            email,
        });

        return {
            success: true,
            message:
                "Link de acesso enviado com sucesso. Verifique sua caixa de entrada e a pasta de spam.",
        };
    } catch (err) {
        logger.error("Excecao inesperada no envio de Magic Link", {
            erro: err instanceof Error ? err.message : String(err),
        });

        return {
            success: false,
            message: "",
            error: "Ocorreu uma falha inesperada no servidor. Tente novamente.",
        };
    }
}
