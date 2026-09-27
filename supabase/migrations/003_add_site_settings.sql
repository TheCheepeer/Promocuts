-- ==============================================================================
-- PromoCuts: Migração 003 - Configurações Gerais do Sistema e Customização de Marca
-- Arquivo: supabase/migrations/003_add_site_settings.sql
-- ==============================================================================

-- 1. Criação da Tabela de Configurações do Site (Padrão Singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name VARCHAR(100) NOT NULL DEFAULT 'PromoCuts',
    site_tagline VARCHAR(255) DEFAULT 'Cortes virais e recomendações de produtos afiliados',
    site_description TEXT DEFAULT 'Encontre os melhores achadinhos e promoções em vídeos curtos das principais lojas parceiras.',
    primary_color VARCHAR(20) NOT NULL DEFAULT '#10B981',
    secondary_color VARCHAR(20) NOT NULL DEFAULT '#6366F1',
    logo_url TEXT,
    logo_icon_url TEXT,
    favicon_url TEXT,
    social_instagram VARCHAR(255),
    social_tiktok VARCHAR(255),
    social_youtube VARCHAR(255),
    footer_text TEXT DEFAULT 'PromoCuts — Todos os direitos reservados.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger de Atualização Automática de updated_at para site_settings
DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Ativação de Row Level Security (RLS) para site_settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 4. Política de Leitura Pública de Configurações
DROP POLICY IF EXISTS "Public read access for site_settings" ON public.site_settings;
CREATE POLICY "Public read access for site_settings"
    ON public.site_settings FOR SELECT
    TO anon, authenticated
    USING (true);

-- 5. Inserção do Registro Singleton Inicial Padrão
INSERT INTO public.site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
