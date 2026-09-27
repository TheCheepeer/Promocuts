import React from "react";
import { createClient } from "@/lib/supabase/server";
import { isEmailAuthorized } from "@/lib/security/auth";
import { AdminNav } from "./admin-nav";

export const metadata = {
    title: {
        template: "%s — PromoCuts Admin",
        default: "Painel Administrativo — PromoCuts",
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Avalia a existencia de sessao administrativa
    let userEmail: string | null = null;

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const adminEmail = process.env.ADMIN_EMAIL;
        if (user && isEmailAuthorized(user.email, adminEmail)) {
            userEmail = user.email || "admin";
        }
    } catch {
        // Falha na resolucao de sessao (esperado para rotas anonimas como /admin/login)
    }

    // Se nao ha sessao administrativa valida (ex: tela de login), renderiza apenas o conteudo
    if (!userEmail) {
        return <>{children}</>;
    }

    // Usuario autenticado e autorizado: renderiza a casca administrativa completa
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
            <AdminNav userEmail={userEmail} />

            <div className="md:pl-64 flex flex-col min-h-screen">
                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
