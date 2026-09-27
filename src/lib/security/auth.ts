/**
 * Utilitarios de apoio a seguranca, sanitizacao de rotas e verificacao de credenciais administrativas.
 */

/**
 * Sanitiza URLs de redirecionamento para prevenir vulnerabilidades de Open Redirect.
 * Permite estritamente caminhos relativos internos que se iniciam com uma barra simples ('/').
 */
export function sanitizeRedirectUrl(
    target: string | null | undefined,
    fallback = "/admin",
): string {
    if (!target || typeof target !== "string") {
        return fallback;
    }

    const trimmed = target.trim();

    // Deve se iniciar com '/', mas rejeitar '//' e '/\' (links relativos de protocolo)
    if (
        !trimmed.startsWith("/") ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("/\\")
    ) {
        return fallback;
    }

    // Nao deve conter caracteres de controle ou dois-pontos no caminho base
    const pathPart = trimmed.split("?")[0] || "";
    if (pathPart.includes(":") || pathPart.includes("\\")) {
        return fallback;
    }

    return trimmed;
}

/**
 * Compara se o e-mail de um usuario coincide estritamente com o e-mail configurado do administrador.
 * Executa normalizacao de espacos e conversao case-insensitive.
 */
export function isEmailAuthorized(
    email: string | null | undefined,
    adminEmailConfig: string | null | undefined,
): boolean {
    if (!email || !adminEmailConfig) {
        return false;
    }

    const cleanUserEmail = email.trim().toLowerCase();
    const cleanAdminEmail = adminEmailConfig.trim().toLowerCase();

    if (!cleanUserEmail || !cleanAdminEmail) {
        return false;
    }

    return cleanUserEmail === cleanAdminEmail;
}
