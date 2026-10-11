import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

/**
 * Script de migração automática do banco de dados PostgreSQL (Supabase).
 * Executado durante o pipeline de deploy na Vercel antes da compilação do Next.js.
 */
async function runMigrations() {
    let connectionString =
        process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        console.log(
            "[Migrações] Variável DATABASE_URL ou POSTGRES_URL não configurada.",
        );
        console.log(
            "[Migrações] Pulando execução automática de migrações no banco de dados.",
        );
        process.exit(0);
    }

    // Sanitização defensiva da URL: remove aspas externas, espaços ou colchetes na senha
    connectionString = connectionString.trim().replace(/^["']|["']$/g, "");
    connectionString = connectionString.replace(
        /:["'\[]([^"'\]]+)["'\]]@/,
        ":$1@",
    );

    console.log(
        "[Migrações] Conectando ao banco de dados PostgreSQL via conexão segura...",
    );

    let sql;
    try {
        sql = postgres(connectionString, {
            ssl: "require",
            max: 1,
            connect_timeout: 15,
            prepare: false,
        });

        // Garante a existência da tabela de controle de histórico de migrações
        await sql`
            CREATE TABLE IF NOT EXISTS public._promocuts_migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `;

        // Sincroniza a sequence do SERIAL caso registros tenham sido inseridos com id explícito
        await sql`
            SELECT setval(
                pg_get_serial_sequence('public._promocuts_migrations', 'id'),
                COALESCE((SELECT MAX(id) FROM public._promocuts_migrations), 0) + 1,
                false
            );
        `.catch(() => {});

        // Consulta as migrações que já foram executadas anteriormente
        const appliedRows = await sql`
            SELECT name FROM public._promocuts_migrations;
        `;
        const appliedSet = new Set(appliedRows.map((r) => r.name));

        // Diretório contendo os arquivos SQL de migração
        const migrationsDir = path.resolve(process.cwd(), "supabase", "migrations");

        if (!fs.existsSync(migrationsDir)) {
            console.log(
                `[Migrações] Diretório não encontrado: ${migrationsDir}. Pulando.`,
            );
            await sql.end();
            process.exit(0);
        }

        // Leitura dinâmica de todos os arquivos .sql com ordenação natural
        const files = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith(".sql"))
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        console.log(
            `[Migrações] Total de arquivos encontrados no repositório: ${files.length}`,
        );

        let executedCount = 0;

        for (const file of files) {
            if (appliedSet.has(file)) {
                console.log(`[Migrações] Já aplicada anteriormente: ${file}`);
                continue;
            }

            console.log(`[Migrações] Aplicando migração: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const content = fs.readFileSync(filePath, "utf-8");

            // Execução transacional do script SQL
            await sql.begin(async (tx) => {
                await tx.unsafe(content);
                await tx`
                    INSERT INTO public._promocuts_migrations (id, name)
                    VALUES (
                        COALESCE((SELECT MAX(id) FROM public._promocuts_migrations), 0) + 1,
                        ${file}
                    )
                    ON CONFLICT (name) DO NOTHING;
                `;
                await tx`
                    SELECT setval(
                        pg_get_serial_sequence('public._promocuts_migrations', 'id'),
                        COALESCE((SELECT MAX(id) FROM public._promocuts_migrations), 1)
                    );
                `.catch(() => {});
            });

            console.log(`[Migrações] Concluída com sucesso: ${file}`);
            executedCount++;
        }

        if (executedCount === 0) {
            console.log(
                "[Migrações] O banco de dados já está completamente atualizado.",
            );
        } else {
            console.log(
                `[Migrações] Processo concluído. ${executedCount} nova(s) migração(ões) aplicada(s) com sucesso.`,
            );
        }

        await sql.end();
        process.exit(0);
    } catch (err) {
        console.error("[Migrações] Erro crítico ao aplicar migrações no banco de dados:");
        const message = err instanceof Error ? err.message : String(err);
        console.error(message);
        if (message.includes("Invalid URL") || err?.code === "ERR_INVALID_URL") {
            console.error(
                "[Migrações] Causa identificada: Formato inválido em DATABASE_URL.",
            );
            console.error(
                "[Migrações] Solução: Certifique-se de que a URL começa com postgresql:// e que a senha não possui aspas (\") ou colchetes ([]).",
            );
        } else if (message.includes("ENETUNREACH") || message.includes("2600:")) {
            console.error(
                "[Migrações] Causa identificada: A Vercel opera em rede IPv4 e não alcança o endereço direto IPv6 do Supabase.",
            );
            console.error(
                "[Migrações] Solução: Altere DATABASE_URL na Vercel para a URL do Connection Pooler do Supabase (*.pooler.supabase.com).",
            );
        }
        if (sql) await sql.end().catch(() => {});
        process.exit(1);
    }
}

runMigrations();
