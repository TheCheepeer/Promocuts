"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAuth } from "@/lib/security/admin-guard";
import { slugify } from "@/lib/formatters";
import { logger } from "@/lib/logger";

export interface CategoryActionState {
    success: boolean;
    error?: string;
    message?: string;
}

/**
 * Server Action para criacao de nova categoria.
 */
export async function createCategoryAction(
    _prevState: CategoryActionState,
    formData: FormData,
): Promise<CategoryActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        const rawName = formData.get("name");
        const rawSlug = formData.get("slug");
        const rawIcon = formData.get("icon");
        const rawDisplayOrder = formData.get("display_order");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 100) {
            return {
                success: false,
                error: "O nome da categoria e obrigatorio e deve ter ate 100 caracteres.",
            };
        }

        let slug =
            typeof rawSlug === "string" && rawSlug.trim() !== ""
                ? slugify(rawSlug.trim())
                : slugify(name);

        if (!slug) {
            slug = `categoria-${Date.now()}`;
        }

        // Verifica unicidade do slug
        const { data: existing } = await adminDb
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existing) {
            return {
                success: false,
                error: `Ja existe uma categoria cadastrada com o slug "${slug}". Escolha outro identificador.`,
            };
        }

        const icon =
            typeof rawIcon === "string" && rawIcon.trim() !== ""
                ? rawIcon.trim().toLowerCase()
                : null;

        const displayOrder =
            typeof rawDisplayOrder === "string"
                ? parseInt(rawDisplayOrder, 10) || 0
                : 0;

        const { error: insertError } = await adminDb.from("categories").insert({
            name,
            slug,
            icon,
            display_order: displayOrder,
        });

        if (insertError) {
            logger.error("Erro ao inserir categoria no banco", {
                erro: insertError.message,
            });
            return {
                success: false,
                error: "Falha ao gravar categoria no banco de dados.",
            };
        }

        revalidatePath("/admin/categories");
        revalidatePath("/");
        revalidatePath(`/c/${slug}`);

        return {
            success: true,
            message: "Categoria criada com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao na criacao de categoria", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Ocorreu um erro inesperado ao salvar a categoria.",
        };
    }
}

/**
 * Server Action para edicao de categoria existente.
 */
export async function updateCategoryAction(
    id: string,
    _prevState: CategoryActionState,
    formData: FormData,
): Promise<CategoryActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        if (!id) {
            return {
                success: false,
                error: "Identificador de categoria ausente.",
            };
        }

        const rawName = formData.get("name");
        const rawSlug = formData.get("slug");
        const rawIcon = formData.get("icon");
        const rawDisplayOrder = formData.get("display_order");

        const name = typeof rawName === "string" ? rawName.trim() : "";
        if (!name || name.length > 100) {
            return {
                success: false,
                error: "O nome da categoria e obrigatorio e deve ter ate 100 caracteres.",
            };
        }

        let slug =
            typeof rawSlug === "string" && rawSlug.trim() !== ""
                ? slugify(rawSlug.trim())
                : slugify(name);

        if (!slug) {
            slug = `categoria-${Date.now()}`;
        }

        // Verifica unicidade do slug excluindo o proprio registro
        const { data: existing } = await adminDb
            .from("categories")
            .select("id")
            .eq("slug", slug)
            .neq("id", id)
            .maybeSingle();

        if (existing) {
            return {
                success: false,
                error: `Ja existe outra categoria utilizando o slug "${slug}". Escolha outro identificador.`,
            };
        }

        const icon =
            typeof rawIcon === "string" && rawIcon.trim() !== ""
                ? rawIcon.trim().toLowerCase()
                : null;

        const displayOrder =
            typeof rawDisplayOrder === "string"
                ? parseInt(rawDisplayOrder, 10) || 0
                : 0;

        const { error: updateError } = await adminDb
            .from("categories")
            .update({
                name,
                slug,
                icon,
                display_order: displayOrder,
            })
            .eq("id", id);

        if (updateError) {
            logger.error("Erro ao atualizar categoria no banco", {
                erro: updateError.message,
            });
            return {
                success: false,
                error: "Falha ao atualizar dados da categoria.",
            };
        }

        revalidatePath("/admin/categories");
        revalidatePath("/");
        revalidatePath(`/c/${slug}`);

        return {
            success: true,
            message: "Categoria atualizada com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao na atualizacao de categoria", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Ocorreu um erro inesperado ao atualizar a categoria.",
        };
    }
}

/**
 * Server Action para exclusao de categoria.
 */
export async function deleteCategoryAction(
    id: string,
): Promise<CategoryActionState> {
    try {
        const { adminDb } = await requireAdminAuth();

        if (!id) {
            return {
                success: false,
                error: "Identificador da categoria nao fornecido.",
            };
        }

        const { error: deleteError } = await adminDb
            .from("categories")
            .delete()
            .eq("id", id);

        if (deleteError) {
            logger.error("Erro ao excluir categoria", {
                erro: deleteError.message,
            });
            return {
                success: false,
                error: "Nao foi possivel excluir a categoria.",
            };
        }

        revalidatePath("/admin/categories");
        revalidatePath("/");

        return {
            success: true,
            message: "Categoria excluida com sucesso.",
        };
    } catch (err) {
        logger.error("Excecao na exclusao de categoria", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "Falha ao processar a exclusao da categoria.",
        };
    }
}
