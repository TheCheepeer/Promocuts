-- ==============================================================================
-- PromoCuts: Migração Inicial do Banco de Dados Endurecida (Supabase / PostgreSQL)
-- Arquivo: supabase/migrations/001_initial_schema.sql
-- ==============================================================================

-- 1. Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos enumerados
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_platform') THEN
        CREATE TYPE video_platform AS ENUM ('tiktok', 'reels', 'shorts');
    END IF;
END$$;

-- 3. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Vídeos / Cortes
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    platform video_platform NOT NULL,
    original_url TEXT NOT NULL CHECK (original_url ~* '^https?://'),
    platform_video_id VARCHAR(100) NOT NULL,
    thumbnail_url TEXT CHECK (thumbnail_url IS NULL OR thumbnail_url ~* '^https?://'),
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    order_weight INT NOT NULL DEFAULT 0,
    views_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Produtos Afiliados com Validação Estrita de URLs
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL CHECK (image_url ~* '^https?://'),
    affiliate_url TEXT NOT NULL CHECK (affiliate_url ~* '^https?://'),
    regular_price NUMERIC(10, 2) CHECK (regular_price IS NULL OR regular_price >= 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
    coupon_code VARCHAR(100),
    store_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Tabela de Associação (Vídeos <-> Produtos)
CREATE TABLE IF NOT EXISTS public.video_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_video_product UNIQUE(video_id, product_id)
);

-- 7. Tabela de Métricas Anônimas de Cliques de Afiliados com Proteção contra DoS
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(512) CHECK (user_agent IS NULL OR length(user_agent) <= 512),
    referrer VARCHAR(1024) CHECK (referrer IS NULL OR length(referrer) <= 1024)
);

-- 8. Tabela de Configurações do Sistema e Customização de Marca (Singleton)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name VARCHAR(100) NOT NULL DEFAULT 'PromoCuts',
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
    social_instagram VARCHAR(255),
    social_tiktok VARCHAR(255),
    social_youtube VARCHAR(255),
    footer_text TEXT DEFAULT 'PromoCuts — Todos os direitos reservados.',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Função e Triggers com search_path Seguro para Atualização de updated_at
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

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_videos_updated_at ON public.videos;
CREATE TRIGGER set_videos_updated_at
    BEFORE UPDATE ON public.videos
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 10. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON public.videos(is_published, order_weight DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_slug ON public.videos(slug);
CREATE INDEX IF NOT EXISTS idx_videos_platform ON public.videos(platform);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON public.videos(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_video_products_video_id ON public.video_products(video_id);
CREATE INDEX IF NOT EXISTS idx_video_products_product_id ON public.video_products(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_product_id ON public.affiliate_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at DESC);

-- 11. Ativação de Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 12. Políticas de Acesso Público (Leitura anônima para itens públicos)

-- Configurações Gerais: Acesso público para aplicar cores, logos, favicon e títulos
DROP POLICY IF EXISTS "Public read access for site_settings" ON public.site_settings;
CREATE POLICY "Public read access for site_settings"
    ON public.site_settings FOR SELECT
    TO anon, authenticated
    USING (true);

-- Categorias: Todas as categorias são públicas para popular abas e filtros
DROP POLICY IF EXISTS "Public read access for categories" ON public.categories;
CREATE POLICY "Public read access for categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (true);

-- Vídeos: Apenas registros marcados como publicados são visíveis ao público
DROP POLICY IF EXISTS "Public read access for published videos" ON public.videos;
CREATE POLICY "Public read access for published videos"
    ON public.videos FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- Produtos: Visíveis se estiverem associados a pelo menos um vídeo publicado
DROP POLICY IF EXISTS "Public read access for active products" ON public.products;
CREATE POLICY "Public read access for active products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.video_products vp
            INNER JOIN public.videos v ON v.id = vp.video_id
            WHERE vp.product_id = public.products.id AND v.is_published = true
        )
    );

-- Associações: Visíveis para vídeos publicados
DROP POLICY IF EXISTS "Public read access for published video_products" ON public.video_products;
CREATE POLICY "Public read access for published video_products"
    ON public.video_products FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.videos v
            WHERE v.id = public.video_products.video_id AND v.is_published = true
        )
    );

-- Métricas: Inserção protegida validando integridade do produto e limite de campos
DROP POLICY IF EXISTS "Public insert access for click tracking" ON public.affiliate_clicks;
CREATE POLICY "Public insert access for click tracking"
    ON public.affiliate_clicks FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = public.affiliate_clicks.product_id
        )
        AND (user_agent IS NULL OR length(user_agent) <= 512)
        AND (referrer IS NULL OR length(referrer) <= 1024)
    );

-- 13. Carga Inicial de Configurações do Sistema
INSERT INTO public.site_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
