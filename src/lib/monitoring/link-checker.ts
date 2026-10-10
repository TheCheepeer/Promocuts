import { createAdminClient } from "@/lib/supabase/admin";
import { isSafeExternalUrl } from "@/lib/extractor/og-parser";
import { logger } from "@/lib/logger";

export interface LinkCheckResult {
    isAvailable: boolean;
    statusCode: number | null;
    error?: string;
}

/**
 * Realiza uma checagem HTTP defensiva e leve de integridade para a URL de afiliado informada.
 */
export async function checkOfferLink(url: string): Promise<LinkCheckResult> {
    if (!url || !isSafeExternalUrl(url)) {
        return {
            isAvailable: false,
            statusCode: null,
            error: "URL inválida ou restrita.",
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6 segundos de tolerância

    try {
        // Tenta primeiramente requisição HEAD para economizar banda
        let response: Response;
        try {
            response = await fetch(url, {
                method: "HEAD",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PromoCuts-Monitor/1.0",
                    Accept: "*/*",
                },
                signal: controller.signal,
                redirect: "follow",
            });
        } catch {
            // Se HEAD falhar ou for bloqueado pelo servidor remoto, tenta GET leve
            response = await fetch(url, {
                method: "GET",
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PromoCuts-Monitor/1.0",
                    Accept: "text/html,*/*;q=0.8",
                },
                signal: controller.signal,
                redirect: "follow",
            });
            // Cancela imediatamente a leitura do corpo para preservar recursos
            if (response.body) {
                try {
                    await response.body.cancel();
                } catch {
                    // Ignora erro ao cancelar stream
                }
            }
        }

        clearTimeout(timeout);

        const status = response.status;

        // Status de sucesso e redirecionamentos válidos
        if (status >= 200 && status < 400) {
            return {
                isAvailable: true,
                statusCode: status,
            };
        }

        // 404 (Não Encontrado) ou 410 (Gone) indicam que a oferta ou página foi removida
        if (status === 404 || status === 410) {
            return {
                isAvailable: false,
                statusCode: status,
                error: "Página ou oferta não encontrada (404/410).",
            };
        }

        // Outros erros de cliente (como 403 por bloqueio de scraping) ou servidor
        // Em 403/429 (bloqueio de bot pela loja), não devemos marcar como quebrado sumariamente,
        // mas registramos o código para auditoria
        const isLikelyBotBlock = status === 403 || status === 429;
        return {
            isAvailable: isLikelyBotBlock ? true : false,
            statusCode: status,
            error: `Resposta HTTP com status ${status}.`,
        };
    } catch (err) {
        clearTimeout(timeout);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
            isAvailable: false,
            statusCode: null,
            error: errorMessage.includes("aborted")
                ? "Tempo limite de conexão esgotado (Timeout)."
                : errorMessage,
        };
    }
}

/**
 * Audita um lote de links afiliados cadastrados no banco de dados.
 */
export async function auditOfferLinks(
    batchSize = 25,
): Promise<{ checked: number; issues: number; updated: number }> {
    const supabase = createAdminClient();

    // Busca os links prioritários: nunca checados ou com verificação mais antiga
    const { data: links, error: fetchError } = await supabase
        .from("product_links")
        .select("id, affiliate_url, store_name, is_available")
        .order("last_checked_at", { ascending: true, nullsFirst: true })
        .limit(batchSize);

    if (fetchError || !links || links.length === 0) {
        if (fetchError) {
            logger.error("Erro ao buscar links para auditoria", {
                erro: fetchError.message,
            });
        }
        return { checked: 0, issues: 0, updated: 0 };
    }

    let checkedCount = 0;
    let issuesCount = 0;
    let updatedCount = 0;

    for (const link of links) {
        checkedCount++;
        const result = await checkOfferLink(link.affiliate_url);

        if (!result.isAvailable) {
            issuesCount++;
        }

        const now = new Date().toISOString();
        const { error: updateError } = await supabase
            .from("product_links")
            .update({
                is_available: result.isAvailable,
                status_code: result.statusCode,
                last_checked_at: now,
            })
            .eq("id", link.id);

        if (!updateError) {
            updatedCount++;
        }
    }

    logger.info("Auditoria periódica de links de ofertas concluída", {
        verificados: checkedCount,
        problemas: issuesCount,
        atualizados: updatedCount,
    });

    return {
        checked: checkedCount,
        issues: issuesCount,
        updated: updatedCount,
    };
}

