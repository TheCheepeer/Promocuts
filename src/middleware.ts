import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { getClientIp, isIpAllowed } from "@/lib/security/ip";
import { logger } from "@/lib/logger";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isStaffRoute = pathname.startsWith("/admin");

    // -------------------------------------------------------------------------
    // 1. Tratamento para Rotas Publicas (Fora de /admin)
    // -------------------------------------------------------------------------
    if (!isStaffRoute) {
        // Se houver cookies de sessao do Supabase, renova a sessao sem bloquear
        const hasSessionCookie = request.cookies
            .getAll()
            .some((c) => c.name.startsWith("sb-"));

        if (hasSessionCookie) {
            try {
                const { getResponse } = createMiddlewareClient(request);
                return getResponse();
            } catch (err) {
                logger.warn("Falha ao renovar cookies em rota publica", {
                    erro: err instanceof Error ? err.message : String(err),
                });
            }
        }

        return NextResponse.next();
    }

    // -------------------------------------------------------------------------
    // 2. Barreira 1: Filtro de Rede / VPN Guard (ADMIN_ALLOWED_IPS)
    // -------------------------------------------------------------------------
    const allowedIps = process.env.ADMIN_ALLOWED_IPS;
    if (allowedIps && allowedIps.trim() !== "") {
        const clientIp = getClientIp(request);

        if (!clientIp || !isIpAllowed(clientIp, allowedIps)) {
            logger.warn(
                "Acesso administrativo bloqueado por filtro de IP/VPN",
                {
                    clientIp,
                    pathname,
                },
            );

            return new NextResponse(
                "403 Forbidden: Acesso restrito a rede autorizada.",
                {
                    status: 403,
                    headers: {
                        "Content-Type": "text/plain; charset=utf-8",
                    },
                },
            );
        }
    }

    // -------------------------------------------------------------------------
    // 3. Inicializacao do Cliente Supabase e Avaliacao de Sessao
    // -------------------------------------------------------------------------
    let middlewareClient;
    try {
        middlewareClient = createMiddlewareClient(request);
    } catch (err) {
        logger.error("Erro ao inicializar cliente Supabase no middleware", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return new NextResponse(
            "500 Internal Server Error: Configuracao de ambiente incompleta.",
            { status: 500 },
        );
    }

    const { getResponse, getUser } = middlewareClient;
    const user = await getUser();
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    // Funcao auxiliar para preservar cookies ao efetuar redirecionamento
    const createRedirect = (targetUrl: URL) => {
        const redirectRes = NextResponse.redirect(targetUrl);
        getResponse()
            .cookies.getAll()
            .forEach((cookie) => {
                redirectRes.cookies.set(cookie.name, cookie.value, cookie);
            });
        return redirectRes;
    };

    // -------------------------------------------------------------------------
    // 4. Barreira 2, 3 e 4: Controle de Acesso e Whitelist de Identidade
    // -------------------------------------------------------------------------
    const isLoginPage = pathname === "/admin/login";

    // Caso A: O usuario acessa a tela de login (/admin/login)
    if (isLoginPage) {
        // Se ja estiver autenticado como o administrador autorizado, redireciona ao painel
        if (
            user &&
            adminEmail &&
            user.email?.trim().toLowerCase() === adminEmail
        ) {
            return createRedirect(new URL("/admin", request.url));
        }

        // Caso contrario (visitante anonimo ou sessao nao autorizada), permite ver a tela de login
        return getResponse();
    }

    // Caso B: Qualquer outra rota administrativa (/admin/*)
    // Se nao ha sessao ativa, redireciona amigavelmente para a tela de login
    if (!user) {
        const loginUrl = new URL("/admin/login", request.url);
        if (pathname !== "/admin") {
            loginUrl.searchParams.set("next", pathname);
        }
        return createRedirect(loginUrl);
    }

    // Se o usuario esta logado, mas o e-mail NAO coincide com ADMIN_EMAIL
    if (!adminEmail || user.email?.trim().toLowerCase() !== adminEmail) {
        logger.warn(
            "Tentativa de acesso com usuario autenticado fora da whitelist",
            {
                userEmail: user.email,
                requiredEmail: adminEmail,
                pathname,
            },
        );

        return new NextResponse(
            "403 Forbidden: Usuario nao autorizado a acessar o painel administrativo.",
            {
                status: 403,
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                },
            },
        );
    }

    // Usuario autenticado e verificado com sucesso contra ADMIN_EMAIL
    return getResponse();
}

export const config = {
    matcher: [
        /*
         * Corresponde a todos os caminhos de requisicao, exceto:
         * - _next/static (arquivos estaticos de compilacao)
         * - _next/image (arquivos de otimizacao de imagem)
         * - favicon.ico (icone da aba)
         * - arquivos estaticos por extensao (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
    ],
};
