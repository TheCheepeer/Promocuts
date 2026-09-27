"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

/**
 * Server Action para encerrar a sessao do administrador e redirecionar para /admin/login.
 */
export async function logoutAction(): Promise<void> {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
    } catch (err) {
        logger.error("Erro ao encerrar sessao administrativa", {
            erro: err instanceof Error ? err.message : String(err),
        });
    }

    redirect("/admin/login");
}
