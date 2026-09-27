-- ==============================================================================
-- PromoCuts: Migração 003 - Configurações Gerais do Sistema Endurecida
-- Arquivo: supabase/migrations/003_add_site_settings.sql
-- ==============================================================================

-- 1. Criação da Tabela de Configurações do Site (Padrão Singleton com Validação Estrita)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name VARCHAR(100) NOT NULL DEFAULT 'PromoCuts' CHECK (length(trim(site_name)) > 0),
    site_tagline VARCHAR(255) DEFAULT 'Cortes virais e recomendações de produtos afiliados',
    site_description TEXT DEFAULT 'Encontre os melhores achadinhos e promoções em vídeos curtos das principais lojas parceiras.',
    primary_color_light VARCHAR(20) NOT NULL DEFAULT '#10B981' CHECK (primary_color_light ~* '^#[0-9A-Fa-f]{6}$'),
    secondary_color_light VARCHAR(20) NOT NULL DEFAULT '#6366F1' CHECK (secondary_color_light ~* '^#[0-9A-Fa-f]{6}$'),
    primary_color_dark VARCHAR(20) NOT NULL DEFAULT '#10B981' CHECK (primary_color_dark ~* '^#[0-9A-Fa-f]{6}$'),
    secondary_color_dark VARCHAR(20) NOT NULL DEFAULT '#6366F1' CHECK (secondary_color_dark ~* '^#[0-9A-Fa-f]{6}$'),
    logo_url_light TEXT CHECK (logo_url_light IS NULL OR logo_url_light ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR logo_url_light ~* '^data:image/(png|svg\+xml);'),
    logo_url_dark TEXT CHECK (logo_url_dark IS NULL OR logo_url_dark ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR logo_url_dark ~* '^data:image/(png|svg\+xml);'),
    logo_icon_url_light TEXT CHECK (logo_icon_url_light IS NULL OR logo_icon_url_light ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR logo_icon_url_light ~* '^data:image/(png|svg\+xml);'),
    logo_icon_url_dark TEXT CHECK (logo_icon_url_dark IS NULL OR logo_icon_url_dark ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR logo_icon_url_dark ~* '^data:image/(png|svg\+xml);'),
    favicon_url_light TEXT CHECK (favicon_url_light IS NULL OR favicon_url_light ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR favicon_url_light ~* '^data:image/(png|svg\+xml);'),
    favicon_url_dark TEXT CHECK (favicon_url_dark IS NULL OR favicon_url_dark ~* '^(https?://|/).*\.(png|svg)(\?.*)?$' OR favicon_url_dark ~* '^data:image/(png|svg\+xml);'),
    social_instagram VARCHAR(255) CHECK (social_instagram IS NULL OR social_instagram ~* '^https?://|^@[a-zA-Z0-9_.]+$'),
    social_tiktok VARCHAR(255) CHECK (social_tiktok IS NULL OR social_tiktok ~* '^https?://|^@[a-zA-Z0-9_.]+$'),
    social_youtube VARCHAR(255) CHECK (social_youtube IS NULL OR social_youtube ~* '^https?://|^@[a-zA-Z0-9_.]+$'),
    footer_text TEXT DEFAULT 'PromoCuts — Todos os direitos reservados.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Função e Trigger com search_path Seguro para Atualização de updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

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
