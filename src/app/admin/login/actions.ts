"use server";

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

        const appUrl =
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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
