-- ==============================================================================
-- PromoCuts — Migração 007: Redes Sociais da Marca e Controle de Visibilidade
-- ==============================================================================

-- 1. Criação da Tabela de Redes Sociais Oficiais da Marca
CREATE TABLE IF NOT EXISTS public.brand_social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(50) NOT NULL,
    url TEXT NOT NULL CHECK (url ~* '^https?://'),
    show_in_storefront BOOLEAN NOT NULL DEFAULT true,
    show_in_bio BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger de Atualização Automática de updated_at para brand_social_links
DROP TRIGGER IF EXISTS set_brand_social_links_updated_at ON public.brand_social_links;
CREATE TRIGGER set_brand_social_links_updated_at
    BEFORE UPDATE ON public.brand_social_links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_brand_social_links_order 
    ON public.brand_social_links(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_brand_social_links_active 
    ON public.brand_social_links(is_active, show_in_storefront, show_in_bio);

-- 4. Row Level Security (RLS)
ALTER TABLE public.brand_social_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on active brand_social_links" ON public.brand_social_links;
CREATE POLICY "Allow public read on active brand_social_links"
    ON public.brand_social_links
    FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Allow full access to service_role on brand_social_links" ON public.brand_social_links;
CREATE POLICY "Allow full access to service_role on brand_social_links"
    ON public.brand_social_links
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Migração Idempotente de Dados Existentes de site_settings
DO $$
DECLARE
    v_instagram TEXT;
    v_tiktok TEXT;
    v_youtube TEXT;
    v_order INT := 0;
BEGIN
    -- Busca os links cadastrados na configuração única da vitrine
    SELECT social_instagram, social_tiktok, social_youtube
    INTO v_instagram, v_tiktok, v_youtube
    FROM public.site_settings
    LIMIT 1;

    -- Migração do Instagram (se preenchido e ainda não migrado)
    IF v_instagram IS NOT NULL AND trim(v_instagram) <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM public.brand_social_links WHERE platform = 'instagram') THEN
            INSERT INTO public.brand_social_links (
                platform,
                url,
                show_in_storefront,
                show_in_bio,
                display_order,
                is_active
            ) VALUES (
                'instagram',
                CASE 
                    WHEN v_instagram ~* '^https?://' THEN v_instagram
                    ELSE 'https://instagram.com/' || regexp_replace(v_instagram, '^@', '')
                END,
                true,
                true,
                v_order,
                true
            );
            v_order := v_order + 1;
        END IF;
    END IF;

    -- Migração do TikTok (se preenchido e ainda não migrado)
    IF v_tiktok IS NOT NULL AND trim(v_tiktok) <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM public.brand_social_links WHERE platform = 'tiktok') THEN
            INSERT INTO public.brand_social_links (
                platform,
                url,
                show_in_storefront,
                show_in_bio,
                display_order,
                is_active
            ) VALUES (
                'tiktok',
                CASE 
                    WHEN v_tiktok ~* '^https?://' THEN v_tiktok
                    ELSE 'https://tiktok.com/@' || regexp_replace(v_tiktok, '^@', '')
                END,
                true,
                true,
                v_order,
                true
            );
            v_order := v_order + 1;
        END IF;
    END IF;

    -- Migração do YouTube (se preenchido e ainda não migrado)
    IF v_youtube IS NOT NULL AND trim(v_youtube) <> '' THEN
        IF NOT EXISTS (SELECT 1 FROM public.brand_social_links WHERE platform = 'youtube') THEN
            INSERT INTO public.brand_social_links (
                platform,
                url,
                show_in_storefront,
                show_in_bio,
                display_order,
                is_active
            ) VALUES (
                'youtube',
                CASE 
                    WHEN v_youtube ~* '^https?://' THEN v_youtube
                    ELSE 'https://youtube.com/' || regexp_replace(v_youtube, '^@', '')
                END,
                true,
                true,
                v_order,
                true
            );
        END IF;
    END IF;
END $$;
