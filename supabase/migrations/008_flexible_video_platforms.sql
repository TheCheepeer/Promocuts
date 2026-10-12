-- ==============================================================================
-- PromoCuts — Migração 008: Flexibilização da Coluna platform na Tabela videos
-- ==============================================================================
-- Transforma a coluna platform de video_platform (enum rígido) para VARCHAR(50),
-- permitindo suporte extensível ao Padrão Strategy sem quebras no banco de dados.

-- 1. Alteração do tipo da coluna platform preservando todos os dados existentes
ALTER TABLE public.videos 
    ALTER COLUMN platform TYPE VARCHAR(50) USING platform::text;

-- 2. Restrição defensiva de integridade (caracteres alfanuméricos em minúsculo, traço e sublinhado)
ALTER TABLE public.videos
    DROP CONSTRAINT IF EXISTS chk_videos_platform_format;

ALTER TABLE public.videos
    ADD CONSTRAINT chk_videos_platform_format 
    CHECK (platform ~* '^[a-z0-9_-]+$');

-- 3. Índice de alta performance para filtragem por plataforma
CREATE INDEX IF NOT EXISTS idx_videos_platform 
    ON public.videos(platform);

