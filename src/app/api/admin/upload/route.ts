import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEmailAuthorized } from "@/lib/security/auth";
import { logger } from "@/lib/logger";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
                    error: "Formato de arquivo invalido. Sao permitidos arquivos PNG (.png), JPEG (.jpg, .jpeg), WebP (.webp) ou SVG (.svg).",
                },
                { status: 400 },
            );
        }

        // 4. Validacao de tamanho
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: "O arquivo excede o limite maximo permitido de 5 MB.",
                },
                { status: 400 },
            );
        }

        let ext = "png";
        if (file.type === "image/svg+xml") {
            ext = "svg";
        } else if (file.type === "image/jpeg" || file.type === "image/jpg") {
            ext = "jpg";
        } else if (file.type === "image/webp") {
            ext = "webp";
        }
        const uniqueId = crypto.randomUUID().slice(0, 12);
        const fileName = `asset-${Date.now()}-${uniqueId}.${ext}`;
        const buffer = Buffer.from(await file.arrayBuffer());

        // 5. Tentativa de upload no Supabase Storage (bucket 'site-assets')
        try {
            const adminDb = createAdminClient();
            let storageResult = await adminDb.storage
                .from("site-assets")
                .upload(fileName, buffer, {
                    contentType: file.type,
                    upsert: true,
                });

            // Se o bucket 'site-assets' nao existir, tenta cria-lo automaticamente como publico
            if (
                storageResult.error &&
                (storageResult.error.message?.toLowerCase().includes("bucket") ||
                    storageResult.error.message?.toLowerCase().includes("not found"))
            ) {
                logger.info(
                    "Bucket 'site-assets' nao encontrado. Tentando cria-lo automaticamente no Supabase Storage...",
                );
                try {
                    const { error: createBucketError } =
                        await adminDb.storage.createBucket("site-assets", {
                            public: true,
                            fileSizeLimit: MAX_FILE_SIZE,
                            allowedMimeTypes: ALLOWED_MIME_TYPES,
                        });

                    if (!createBucketError) {
                        storageResult = await adminDb.storage
                            .from("site-assets")
                            .upload(fileName, buffer, {
                                contentType: file.type,
                                upsert: true,
                            });
                    }
                } catch (createErr) {
                    logger.warn(
                        "Nao foi possivel criar bucket site-assets automaticamente",
                        {
                            erro:
                                createErr instanceof Error
                                    ? createErr.message
                                    : String(createErr),
                        },
                    );
                }
            }

            if (!storageResult.error && storageResult.data) {
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

            if (storageResult.error) {
                logger.warn("Supabase Storage retornou erro ao gravar arquivo", {
                    erro: storageResult.error.message,
                });
            }
        } catch (storageErr) {
            logger.warn("Falha ao comunicar com o Supabase Storage", {
                erro:
                    storageErr instanceof Error
                        ? storageErr.message
                        : String(storageErr),
            });
        }

        // Em ambientes serverless (Vercel), o sistema de arquivos local e estritamente somente-leitura.
        // Nao devemos tentar fs.mkdir/fs.writeFile pois causara EROFS (500).
        if (process.env.VERCEL || process.env.NODE_ENV === "production") {
            return NextResponse.json(
                {
                    error:
                        "Nao foi possivel gravar no Supabase Storage. Crie o bucket publico 'site-assets' no painel do Supabase (Storage > New bucket) para habilitar uploads.",
                },
                { status: 502 },
            );
        }

        // 6. Fallback para armazenamento em disco local apenas em desenvolvimento local (localhost)
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
