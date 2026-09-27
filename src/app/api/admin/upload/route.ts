import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAuthorized } from "@/lib/security/auth";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = ["image/png", "image/svg+xml"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

export async function POST(request: NextRequest) {
    try {
        // 1. Validacao de sessao administrativa
        const supabase = await createClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        const adminEmail = process.env.ADMIN_EMAIL;
        if (userError || !user || !isEmailAuthorized(user.email, adminEmail)) {
            logger.warn("Tentativa de upload sem autorizacao administrativa");
            return NextResponse.json(
                { error: "Acesso nao autorizado." },
                { status: 403 },
            );
        }

        // 2. Extracao do arquivo multipart
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { error: "Nenhum arquivo enviado." },
                { status: 400 },
            );
        }

        // 3. Validacao de MIME type e extensao
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error: "Formato de arquivo invalido. Sao permitidos estritamente arquivos PNG (.png) ou SVG (.svg).",
                },
                { status: 400 },
            );
        }

        // 4. Validacao de tamanho
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: "O arquivo excede o limite maximo permitido de 2 MB.",
                },
                { status: 400 },
            );
        }

        const ext = file.type === "image/svg+xml" ? "svg" : "png";
        const uniqueId = crypto.randomUUID().slice(0, 12);
        const fileName = `asset-${Date.now()}-${uniqueId}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // 5. Tentativa de upload no Supabase Storage (bucket 'site-assets')
        try {
            const adminDb = createAdminClient();
            const { data: storageData, error: storageError } =
                await adminDb.storage
                    .from("site-assets")
                    .upload(fileName, buffer, {
                        contentType: file.type,
                        upsert: true,
                    });

            if (!storageError && storageData) {
                const {
                    data: { publicUrl },
                } = adminDb.storage.from("site-assets").getPublicUrl(fileName);

                logger.info(
                    "Upload de ativo gravado com sucesso no Supabase Storage",
                    {
                        fileName,
                    },
                );
                return NextResponse.json({ url: publicUrl });
            }
        } catch (storageErr) {
            logger.warn(
                "Supabase Storage indisponivel, utilizando armazenamento local em /public/uploads",
                {
                    erro:
                        storageErr instanceof Error
                            ? storageErr.message
                            : String(storageErr),
                },
            );
        }

        // 6. Fallback para armazenamento em disco local / Docker persistente (public/uploads)
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await fs.mkdir(uploadsDir, { recursive: true });
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, buffer);

        logger.info(
            "Upload de ativo gravado com sucesso em armazenamento local",
            {
                fileName,
            },
        );

        return NextResponse.json({ url: `/uploads/${fileName}` });
    } catch (err) {
        logger.error("Erro interno no processamento de upload", {
            erro: err instanceof Error ? err.message : String(err),
        });
        return NextResponse.json(
            { error: "Falha interna ao processar o upload do arquivo." },
            { status: 500 },
        );
    }
}
