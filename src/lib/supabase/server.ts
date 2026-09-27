import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem ser configurados no arquivo de ambiente.",
        );
    }

    const cookieMethods: CookieMethodsServer = {
        getAll() {
            return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
            try {
                cookiesToSet.forEach(({ name, value, options }) => {
                    cookieStore.set(name, value, options);
                });
            } catch {
                // O metodo setAll pode falhar quando invocado a partir de um Server Component puro.
                // Isto e esperado no modelo do App Router do Next.js se houver middleware gerenciando sessoes.
            }
        },
    };

    return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: cookieMethods,
    });
}
