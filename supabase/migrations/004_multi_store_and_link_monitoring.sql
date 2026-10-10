-- ==============================================================================
-- PromoCuts — Migração 004: Suporte Multi-Loja, Links de Afiliados e Monitoramento
-- ==============================================================================

-- 1. Criação da Tabela de Links de Afiliados Multi-Loja por Produto
CREATE TABLE IF NOT EXISTS public.product_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    store_name VARCHAR(100) NOT NULL,
    affiliate_url TEXT NOT NULL CHECK (affiliate_url ~* '^https?://'),
    regular_price NUMERIC(10, 2) CHECK (regular_price IS NULL OR regular_price >= 0),
    discount_price NUMERIC(10, 2) CHECK (discount_price IS NULL OR discount_price >= 0),
    coupon_code VARCHAR(100),
    is_available BOOLEAN NOT NULL DEFAULT true,
    last_checked_at TIMESTAMPTZ,
    status_code INT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger de Atualização Automática de updated_at para product_links
DROP TRIGGER IF EXISTS set_product_links_updated_at ON public.product_links;
CREATE TRIGGER set_product_links_updated_at
    BEFORE UPDATE ON public.product_links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Índices de Alta Performance para Busca e Auditoria
CREATE INDEX IF NOT EXISTS idx_product_links_product_id ON public.product_links(product_id, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_product_links_is_available ON public.product_links(is_available);
CREATE INDEX IF NOT EXISTS idx_product_links_last_checked ON public.product_links(last_checked_at);

-- 4. Migração Retrocompatível de Dados Preexistentes
-- Popula product_links a partir dos registros existentes na tabela products
INSERT INTO public.product_links (
    product_id,
    store_name,
    affiliate_url,
    regular_price,
    discount_price,
    coupon_code,
    display_order
)
SELECT 
    id,
    store_name,
    affiliate_url,
    regular_price,
    discount_price,
    coupon_code,
    0
FROM public.products p
WHERE NOT EXISTS (
    SELECT 1 FROM public.product_links pl WHERE pl.product_id = p.id
);

-- 5. Expansão da Tabela de Telemetria com Suporte a Link Específico e Loja
ALTER TABLE public.affiliate_clicks
    ADD COLUMN IF NOT EXISTS link_id UUID REFERENCES public.product_links(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS store_name VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_link_id ON public.affiliate_clicks(link_id);

-- 6. Configuração de Row Level Security (RLS) para product_links
ALTER TABLE public.product_links ENABLE ROW LEVEL SECURITY;

-- Leitura Pública de Links Ativos vinculados a Vídeos Publicados
DROP POLICY IF EXISTS "Public read access for active product_links" ON public.product_links;
CREATE POLICY "Public read access for active product_links"
    ON public.product_links FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.video_products vp
            INNER JOIN public.videos v ON v.id = vp.video_id
            WHERE vp.product_id = public.product_links.product_id AND v.is_published = true
        )
    );

-- Atualização da Política de Inserção de Telemetria com Suporte a link_id
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
        AND (store_name IS NULL OR length(store_name) <= 100)
    );

