-- ==============================================================================
-- Migracao 006: Customizacao Visual de Bio Links e Foto de Perfil Dedicada
-- Repositorio: PromoCuts
-- Descricao: Adiciona campos de personalizacao visual do agregador de Bio Links
--             a tabela public.site_settings (fotos claro/escuro, exibicao do
--             cartaz da vitrine, ativacao de QR Code, cores e biografia dedicadas).
-- ==============================================================================

ALTER TABLE public.site_settings
    ADD COLUMN IF NOT EXISTS bio_avatar_url_light TEXT NULL,
    ADD COLUMN IF NOT EXISTS bio_avatar_url_dark TEXT NULL,
    ADD COLUMN IF NOT EXISTS bio_show_storefront_banner VARCHAR(20) NOT NULL DEFAULT 'banner',
    ADD COLUMN IF NOT EXISTS bio_show_qrcode BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS bio_title VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS bio_description TEXT NULL,
    ADD COLUMN IF NOT EXISTS bio_primary_color_light VARCHAR(20) NULL,
    ADD COLUMN IF NOT EXISTS bio_primary_color_dark VARCHAR(20) NULL;

-- Adiciona restricao de verificacao para opcoes validas do cartaz da vitrine
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_site_settings_bio_storefront_banner'
    ) THEN
        ALTER TABLE public.site_settings
            ADD CONSTRAINT chk_site_settings_bio_storefront_banner
            CHECK (bio_show_storefront_banner IN ('banner', 'compact', 'hidden'));
    END IF;
END $$;
