import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * Cria um cliente Supabase isolado para o ciclo de vida do Middleware do Next.js.
 * Sincroniza a leitura e a escrita de cookies entre a requisicao e a resposta HTTP.
 */
export function createMiddlewareClient(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
            "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem ser configurados no arquivo de ambiente.",
        );
    }

    const cookieMethods: CookieMethodsServer = {
        getAll() {
            return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value),
            );
            response = NextResponse.next({
                request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
            );
        },
    };

    const supabase = createServerClient<Database>(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: cookieMethods,
        },
    );

    return {
        supabase,
        getResponse: () => response,
        getUser: async () => {
            try {
                const {
                    data: { user },
                    error,
                } = await supabase.auth.getUser();

                if (error || !user) {
                    return null;
                }
                return user;
            } catch {
                return null;
            }
        },
    };
}
