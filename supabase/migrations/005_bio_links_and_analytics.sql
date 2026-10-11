-- ==============================================================================
-- PromoCuts — Migração 005: Bio Links, Comunidades e Histórico de Métricas
-- ==============================================================================

-- 1. Criação da Tabela de Bio Links e Comunidades
CREATE TABLE IF NOT EXISTS public.bio_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    url TEXT NOT NULL CHECK (url ~* '^https?://'),
    icon VARCHAR(50),
    badge_text VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_highlighted BOOLEAN NOT NULL DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    clicks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Trigger de Atualização Automática de updated_at para bio_links
DROP TRIGGER IF EXISTS set_bio_links_updated_at ON public.bio_links;
CREATE TRIGGER set_bio_links_updated_at
    BEFORE UPDATE ON public.bio_links
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 3. Criação da Tabela de Telemetria Histórica de Cliques em Bio Links
CREATE TABLE IF NOT EXISTS public.bio_link_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bio_link_id UUID NOT NULL REFERENCES public.bio_links(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent VARCHAR(512) CHECK (user_agent IS NULL OR length(user_agent) <= 512),
    referrer VARCHAR(1024) CHECK (referrer IS NULL OR length(referrer) <= 1024)
);

-- 4. Função e Trigger para Incremento Automático do Contador clicks_count
CREATE OR REPLACE FUNCTION public.handle_bio_link_click_increment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.bio_links
    SET clicks_count = clicks_count + 1
    WHERE id = NEW.bio_link_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_bio_link_clicks ON public.bio_link_clicks;
CREATE TRIGGER trg_increment_bio_link_clicks
    AFTER INSERT ON public.bio_link_clicks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_bio_link_click_increment();

-- 5. Índices de Alta Performance
CREATE INDEX IF NOT EXISTS idx_bio_links_is_active ON public.bio_links(is_active, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_bio_link_clicks_bio_link_id ON public.bio_link_clicks(bio_link_id);
CREATE INDEX IF NOT EXISTS idx_bio_link_clicks_created_at ON public.bio_link_clicks(created_at DESC);

-- 6. Habilitação de Row Level Security (RLS)
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_link_clicks ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de Acesso
DROP POLICY IF EXISTS "Public read access for active bio_links" ON public.bio_links;
CREATE POLICY "Public read access for active bio_links"
    ON public.bio_links FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "Public insert access for bio link click tracking" ON public.bio_link_clicks;
CREATE POLICY "Public insert access for bio link click tracking"
    ON public.bio_link_clicks FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bio_links b
            WHERE b.id = public.bio_link_clicks.bio_link_id AND b.is_active = true
        )
        AND (user_agent IS NULL OR length(user_agent) <= 512)
        AND (referrer IS NULL OR length(referrer) <= 1024)
    );

