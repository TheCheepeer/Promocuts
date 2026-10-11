import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

/**
 * Utilitário para exportar os dados reais do banco de produção para supabase/seed.sql
 * Permite clonar o banco de produção para o ambiente de desenvolvimento em segundos.
 */
async function exportSeed() {
    let connectionString = process.env.DATABASE_URL;

    if (!connectionString && fs.existsSync(".env.production")) {
        const envProd = fs.readFileSync(".env.production", "utf-8");
        const match = envProd.match(/^DATABASE_URL=(.+)$/m);
        if (match) {
            connectionString = match[1].trim();
        }
    }

    if (!connectionString) {
        console.error(
            "[Exportação] DATABASE_URL não configurada no ambiente nem encontrada em .env.production.",
        );
        process.exit(1);
    }

    console.log(
        "[Exportação] Conectando ao banco de dados para exportação dos dados...",
    );

    const sql = postgres(connectionString, {
        ssl: "require",
        max: 1,
        connect_timeout: 15,
        prepare: false,
    });

    try {
        const tables = [
            "site_settings",
            "categories",
            "products",
            "product_links",
            "videos",
            "video_products",
            "_promocuts_migrations",
        ];

        let outputSql = "-- ==============================================================================\n";
        outputSql += "-- PromoCuts — Dados de Carga (Seed / Clone de Produção)\n";
        outputSql += `-- Gerado em: ${new Date().toISOString()}\n`;
        outputSql += "-- Execute este arquivo no SQL Editor do projeto de desenvolvimento após o schema.sql\n";
        outputSql += "-- ==============================================================================\n\n";

        for (const table of tables) {
            const tableExists = await sql`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = ${table}
                );
            `;

            if (!tableExists[0]?.exists) continue;

            const rows = await sql.unsafe(`SELECT * FROM public."${table}";`);
            console.log(
                `[Exportação] Tabela public.${table}: ${rows.length} registro(s) encontrado(s).`,
            );

            if (rows.length === 0) continue;

            if (table === "_promocuts_migrations") {
                outputSql += `CREATE TABLE IF NOT EXISTS public._promocuts_migrations (\n`;
                outputSql += `    id SERIAL PRIMARY KEY,\n`;
                outputSql += `    name VARCHAR(255) NOT NULL UNIQUE,\n`;
                outputSql += `    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n`;
                outputSql += `);\n\n`;
            }

            outputSql += `-- ------------------------------------------------------------------------------\n`;
            outputSql += `-- Tabela: public.${table} (${rows.length} registros)\n`;
            outputSql += `-- ------------------------------------------------------------------------------\n`;

            for (const row of rows) {
                const columns = Object.keys(row);
                const values = columns.map((col) => {
                    const val = row[col];
                    if (val === null || val === undefined) return "NULL";
                    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
                    if (typeof val === "number") return String(val);
                    if (val instanceof Date) return `'${val.toISOString()}'`;
                    if (typeof val === "object")
                        return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
                    return `'${String(val).replace(/'/g, "''")}'`;
                });

                const conflictClause =
                    table === "site_settings"
                        ? `ON CONFLICT ("id") DO UPDATE SET ${columns
                              .filter((c) => c !== "id")
                              .map((c) => `"${c}" = EXCLUDED."${c}"`)
                              .join(", ")}`
                        : `ON CONFLICT DO NOTHING`;

                outputSql += `INSERT INTO public."${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${values.join(", ")}) ${conflictClause};\n`;
            }

            if (table === "_promocuts_migrations") {
                outputSql += `SELECT setval(pg_get_serial_sequence('public._promocuts_migrations', 'id'), COALESCE((SELECT MAX(id) FROM public._promocuts_migrations), 1));\n`;
            }

            outputSql += "\n";
        }

        const outputPath = path.resolve(process.cwd(), "supabase", "seed.sql");
        fs.writeFileSync(outputPath, outputSql, "utf-8");
        console.log(`[Exportação] Concluída com sucesso! Arquivo gerado em: ${outputPath}`);

        await sql.end();
    } catch (err) {
        console.error("[Exportação] Erro ao extrair dados do banco de dados:");
        console.error(err instanceof Error ? err.message : String(err));
        await sql.end().catch(() => {});
        process.exit(1);
    }
}

exportSeed();
