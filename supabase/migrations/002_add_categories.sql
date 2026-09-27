-- ==============================================================================
-- PromoCuts: Migração 002 - Adição de Categorias e Feed Geral
-- Arquivo: supabase/migrations/002_add_categories.sql
-- ==============================================================================

-- 1. Criação da Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Adição da Chave Estrangeira em Vídeos (Cortes de Review)
ALTER TABLE public.videos 
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 3. Adição da Chave Estrangeira em Produtos
ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 4. Trigger de Atualização Automática de updated_at para Categorias
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Índices de Otimização para Consultas e Filtros
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON public.categories(display_order ASC);
CREATE INDEX IF NOT EXISTS idx_videos_category_id ON public.videos(category_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- 6. Ativação de Row Level Security (RLS) para Categorias
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 7. Política de Leitura Pública de Categorias
DROP POLICY IF EXISTS "Public read access for categories" ON public.categories;
CREATE POLICY "Public read access for categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (true);
