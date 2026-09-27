import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAuthorized } from "@/lib/security/auth";
import { logger } from "@/lib/logger";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminAuthResult {
    user: User;
    adminDb: SupabaseClient<Database>;
}

/**
 * Valida a sessao ativa do usuario e confirma se o e-mail coincide com ADMIN_EMAIL.
 * Utilizado por Server Actions e Route Handlers administrativos para garantir
 * que operacoes de mutacao via Service Role Key ocorram somente sob credenciais validas.
 */
export async function requireAdminAuth(): Promise<AdminAuthResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        logger.warn(
            "Tentativa de execucao administrativa sem sessao de usuario ativa",
        );
        throw new Error(
            "Acesso administrativo nao autorizado: sessao ausente ou expirada.",
        );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || !isEmailAuthorized(user.email, adminEmail)) {
        logger.warn(
            "Acesso administrativo bloqueado para e-mail fora da whitelist",
            {
                email: user.email,
            },
        );
        throw new Error("Acesso administrativo negado: e-mail nao autorizado.");
    }

    const adminDb = createAdminClient();
    return { user, adminDb };
}
