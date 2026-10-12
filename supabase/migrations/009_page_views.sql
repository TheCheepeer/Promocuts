-- ==============================================================================
-- PromoCuts — Migração 009: Contagem de Visitas e Telemetria de Páginas Públicas
-- ==============================================================================
-- Registra visualizações de páginas (page views) na vitrine pública para enriquecer
-- as estatísticas do criador, excluindo estritamente rotas administrativas (/admin*).

-- 1. Criação da Tabela de Visualizações de Página (page_views)
CREATE TABLE IF NOT EXISTS public.page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    path VARCHAR(255) NOT NULL CHECK (path NOT LIKE '/admin%'),
    referrer VARCHAR(1024) CHECK (referrer IS NULL OR length(referrer) <= 1024),
    user_agent VARCHAR(512) CHECK (user_agent IS NULL OR length(user_agent) <= 512),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de Alta Performance para Agregações e Consultas Temporais
CREATE INDEX IF NOT EXISTS idx_page_views_created_at 
    ON public.page_views(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_views_path 
    ON public.page_views(path);

-- 3. Habilitação de Row Level Security (RLS)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso
DROP POLICY IF EXISTS "Public insert access for page views tracking" ON public.page_views;
CREATE POLICY "Public insert access for page views tracking"
    ON public.page_views FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        path NOT LIKE '/admin%'
        AND (user_agent IS NULL OR length(user_agent) <= 512)
        AND (referrer IS NULL OR length(referrer) <= 1024)
    );

DROP POLICY IF EXISTS "Deny public select access on page_views" ON public.page_views;
CREATE POLICY "Deny public select access on page_views"
    ON public.page_views FOR SELECT
    TO anon, authenticated
    USING (false);
