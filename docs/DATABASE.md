# Modelagem e Dicionário do Banco de Dados — PromoCuts

Este documento documenta o esquema de banco de dados do **PromoCuts**, construído sobre o **PostgreSQL** gerenciado pelo **Supabase**.

---

## 1. Diagrama Entidade-Relacionamento (ERD)

```mermaid
erDiagram
    CATEGORIES ||--o{ VIDEOS : "classifica"
    CATEGORIES ||--o{ PRODUCTS : "classifica"
    VIDEOS ||--o{ VIDEO_PRODUCTS : "possui"
    PRODUCTS ||--o{ VIDEO_PRODUCTS : "pertence a"
    PRODUCTS ||--o{ PRODUCT_LINKS : "possui ofertas"
    PRODUCTS ||--o{ AFFILIATE_CLICKS : "recebe cliques"
    VIDEOS ||--o{ AFFILIATE_CLICKS : "origina cliques"
    PRODUCT_LINKS ||--o{ AFFILIATE_CLICKS : "registra clique"
    BIO_LINKS ||--o{ BIO_LINK_CLICKS : "recebe cliques"

    BRAND_SOCIAL_LINKS {
        uuid id PK
        varchar platform
        text url
        boolean show_in_storefront
        boolean show_in_bio
        int display_order
        boolean is_active
        timestamptz created_at
        timestamptz updated_at
    }

    BIO_LINKS {
        uuid id PK
        varchar title
        text url
        varchar icon
        varchar badge_text
        boolean is_active
        boolean is_highlighted
        int display_order
        int clicks_count
        timestamptz created_at
        timestamptz updated_at
    }

    BIO_LINK_CLICKS {
        uuid id PK
        uuid bio_link_id FK
        timestamptz created_at
        varchar user_agent
        varchar referrer
    }

    SITE_SETTINGS {
        int id PK
        varchar site_name
        varchar site_tagline
        text site_description
        varchar primary_color_light
        varchar secondary_color_light
        varchar primary_color_dark
        varchar secondary_color_dark
        text logo_url_light
        text logo_url_dark
        text logo_icon_url_light
        text logo_icon_url_dark
        text favicon_url_light
        text favicon_url_dark
        text bio_avatar_url_light
        text bio_avatar_url_dark
        varchar bio_show_storefront_banner
        boolean bio_show_qrcode
        varchar bio_title
        text bio_description
        varchar bio_primary_color_light
        varchar bio_primary_color_dark
        varchar social_instagram
        varchar social_tiktok
        varchar social_youtube
        text footer_text
        timestamptz created_at
        timestamptz updated_at
    }

    CATEGORIES {
        uuid id PK
        varchar name
        varchar slug UK
        varchar icon
        int display_order
        timestamptz created_at
        timestamptz updated_at
    }

    VIDEOS {
        uuid id PK
        uuid category_id FK
        varchar title
        varchar slug UK
        text description
        varchar platform
        text original_url
        varchar platform_video_id
        text thumbnail_url
        boolean is_published
        boolean is_featured
        int order_weight
        int views_count
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        varchar name
        text description
        text image_url
        text affiliate_url
        numeric regular_price
        numeric discount_price
        varchar currency
        varchar coupon_code
        varchar store_name
        timestamptz created_at
        timestamptz updated_at
    }

    PRODUCT_LINKS {
        uuid id PK
        uuid product_id FK
        varchar store_name
        text affiliate_url
        numeric regular_price
        numeric discount_price
        varchar coupon_code
        boolean is_available
        timestamptz last_checked_at
        int status_code
        int display_order
        timestamptz created_at
        timestamptz updated_at
    }

    VIDEO_PRODUCTS {
        uuid id PK
        uuid video_id FK
        uuid product_id FK
        int display_order
        timestamptz created_at
    }

    AFFILIATE_CLICKS {
        uuid id PK
        uuid product_id FK
        uuid video_id FK
        uuid link_id FK
        varchar store_name
        timestamptz created_at
        text user_agent
        text referrer
    }
```

---

## 2. Dicionário de Dados

### 2.1 Tabela `public.categories`

Armazena as categorias para classificação temática dos cortes de review e dos produtos recomendados.

| Coluna          | Tipo           | Nulo | Padrão               | Descrição                                               |
| :-------------- | :------------- | :--: | :------------------- | :------------------------------------------------------ |
| `id`            | `UUID`         | Não  | `uuid_generate_v4()` | Identificador único da categoria                        |
| `name`          | `VARCHAR(100)` | Não  | —                    | Nome legível da categoria (ex: "Tecnologia", "Casa")    |
| `slug`          | `VARCHAR(100)` | Não  | —                    | Identificador amigável na URL (`/c/tecnologia`)         |
| `icon`          | `VARCHAR(50)`  | Sim  | `NULL`               | Nome do ícone da biblioteca Lucide React (ex: `laptop`) |
| `display_order` | `INT`          | Não  | `0`                  | Ordem de aparição na barra de pílulas do feed           |
| `created_at`    | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data e hora de criação                                  |
| `updated_at`    | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data e hora da última atualização                       |

---

### 2.2 Tabela `public.videos`

Armazena as informações dos cortes de vídeo e os dados de incorporação.

| Coluna              | Tipo             | Nulo | Padrão               | Descrição                                                 |
| :------------------ | :--------------- | :--: | :------------------- | :-------------------------------------------------------- |
| `id`                | `UUID`           | Não  | `uuid_generate_v4()` | Identificador único do vídeo                              |
| `category_id`       | `UUID`           | Sim  | `NULL`               | Categoria temática do corte (ON DELETE SET NULL)          |
| `title`             | `VARCHAR(255)`   | Não  | —                    | Título amigável do corte para SEO e acessibilidade        |
| `slug`              | `VARCHAR(255)`   | Não  | —                    | Identificador amigável na URL (`/v/corte-slug`)           |
| `description`       | `TEXT`           | Sim  | `NULL`               | Descrição opcional ou resumo do conteúdo                  |
| `platform`          | `VARCHAR(50)`    | Não  | —                    | Identificador da plataforma no Padrão Strategy (`tiktok`, `reels`, `shorts`, `bilibili`, `pinterest`, `twitch`, `vimeo`) |
| `original_url`      | `TEXT`           | Não  | —                    | URL original informada no momento do cadastro             |
| `platform_video_id` | `VARCHAR(100)`   | Não  | —                    | ID extraído do vídeo na plataforma de origem              |
| `thumbnail_url`     | `TEXT`           | Sim  | `NULL`               | Miniatura alternativa para carregamento antecipado        |
| `is_published`      | `BOOLEAN`        | Não  | `true`               | Determina se o vídeo está visível na vitrine pública      |
| `is_featured`       | `BOOLEAN`        | Não  | `false`              | Destaque prioritário no topo do feed                      |
| `order_weight`      | `INT`            | Não  | `0`                  | Peso de ordenação manual (maior valor = maior prioridade) |
| `views_count`       | `INT`            | Não  | `0`                  | Contador aproximado de reproduções na plataforma          |
| `created_at`        | `TIMESTAMPTZ`    | Não  | `NOW()`              | Data e hora de criação do registro                        |
| `updated_at`        | `TIMESTAMPTZ`    | Não  | `NOW()`              | Data e hora da última alteração (via trigger)             |

---

### 2.3 Tabela `public.products`

Armazena o catálogo de itens recomendados com links de afiliados (mantendo compatibilidade direta para a loja principal).

| Coluna           | Tipo            | Nulo | Padrão               | Descrição                                                  |
| :--------------- | :-------------- | :--: | :------------------- | :--------------------------------------------------------- |
| `id`             | `UUID`          | Não  | `uuid_generate_v4()` | Identificador único do produto                             |
| `category_id`    | `UUID`          | Sim  | `NULL`               | Categoria do produto (ON DELETE SET NULL)                  |
| `name`           | `VARCHAR(255)`  | Não  | —                    | Nome comercial do produto                                  |
| `description`    | `TEXT`          | Sim  | `NULL`               | Detalhes curtos ou diferencial do produto                  |
| `image_url`      | `TEXT`          | Não  | —                    | URL da imagem do produto (hospedada na loja ou CDN)        |
| `affiliate_url`  | `TEXT`          | Não  | —                    | Link principal de redirecionamento com código de comissão  |
| `regular_price`  | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço original do item (para exibição de desconto)         |
| `discount_price` | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço final com desconto ativo                             |
| `currency`       | `VARCHAR(10)`   | Não  | `'BRL'`              | Código da moeda (padrão: real brasileiro)                  |
| `coupon_code`    | `VARCHAR(100)`  | Sim  | `NULL`               | Código promocional para cópia rápida                       |
| `store_name`     | `VARCHAR(100)`  | Não  | —                    | Nome da loja principal (ex: "Amazon", "Shopee")            |
| `created_at`     | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora de inclusão                                    |
| `updated_at`     | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora da última atualização                          |

---

### 2.4 Tabela `public.product_links`

Armazena múltiplas lojas parceiras e links afiliados associados a cada produto (suporte multi-loja e monitoramento de ofertas).

| Coluna            | Tipo            | Nulo | Padrão               | Descrição                                                   |
| :---------------- | :-------------- | :--: | :------------------- | :---------------------------------------------------------- |
| `id`              | `UUID`          | Não  | `uuid_generate_v4()` | Identificador único do link da oferta                       |
| `product_id`      | `UUID`          | Não  | —                    | Referência à tabela `public.products` (ON DELETE CASCADE)   |
| `store_name`      | `VARCHAR(100)`  | Não  | —                    | Nome da loja parceira (ex: "Amazon", "Shopee", "Kabum")     |
| `affiliate_url`   | `TEXT`          | Não  | —                    | URL de redirecionamento com código de afiliado              |
| `regular_price`   | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço regular nesta loja específica                         |
| `discount_price`  | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço com desconto nesta loja específica                    |
| `coupon_code`     | `VARCHAR(100)`  | Sim  | `NULL`               | Cupom específico para esta loja                             |
| `is_available`    | `BOOLEAN`       | Não  | `true`               | Status de integridade (falso se link quebrado ou 404)       |
| `last_checked_at` | `TIMESTAMPTZ`   | Sim  | `NULL`               | Data e hora da última verificação automatizada              |
| `status_code`     | `INT`           | Sim  | `NULL`               | Código de resposta HTTP obtido na última auditoria          |
| `display_order`   | `INT`           | Não  | `0`                  | Ordem de exibição da loja no seletor comparativo            |
| `created_at`      | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data de inclusão da oferta                                  |
| `updated_at`      | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data da última atualização (via trigger)                    |

---

### 2.5 Tabela `public.video_products`

Tabela de associação de muitos-para-muitos entre vídeos e produtos.

| Coluna          | Tipo          | Nulo | Padrão               | Descrição                                                 |
| :-------------- | :------------ | :--: | :------------------- | :-------------------------------------------------------- |
| `id`            | `UUID`        | Não  | `uuid_generate_v4()` | Identificador da relação                                  |
| `video_id`      | `UUID`        | Não  | —                    | Referência à tabela `public.videos` (ON DELETE CASCADE)   |
| `product_id`    | `UUID`        | Não  | —                    | Referência à tabela `public.products` (ON DELETE CASCADE) |
| `display_order` | `INT`         | Não  | `0`                  | Ordem de aparição do produto no card daquele vídeo        |
| `created_at`    | `TIMESTAMPTZ` | Não  | `NOW()`              | Data da associação                                        |

_Restrição:_ Chave única composta `UNIQUE(video_id, product_id)` para impedir associações duplicadas.

---

### 2.6 Tabela `public.affiliate_clicks`

Registros anônimos de engajamento para cálculo de métricas de conversão com suporte a identificação da loja e link específico.

| Coluna       | Tipo            | Nulo | Padrão               | Descrição                                                       |
| :----------- | :-------------- | :--: | :------------------- | :-------------------------------------------------------------- |
| `id`         | `UUID`          | Não  | `uuid_generate_v4()` | Identificador do evento                                         |
| `product_id` | `UUID`          | Não  | —                    | Referência ao produto clicado (ON DELETE CASCADE)               |
| `video_id`   | `UUID`          | Sim  | `NULL`               | Referência ao vídeo de onde partiu o clique                     |
| `link_id`    | `UUID`          | Sim  | `NULL`               | Referência ao link específico da loja (ON DELETE SET NULL)      |
| `store_name` | `VARCHAR(100)`  | Sim  | `NULL`               | Nome da loja parceira que recebeu o clique                      |
| `created_at` | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora do clique                                           |
| `user_agent` | `VARCHAR(512)`  | Sim  | `NULL`               | Informação do navegador/dispositivo (limitado a 512 caracteres) |
| `referrer`   | `VARCHAR(1024)` | Sim  | `NULL`               | Origem da requisição (limitado a 1024 caracteres)               |

---

### 2.7 Tabela `public.site_settings`

Armazena os parâmetros globais de customização de marca, cores, logotipos e metadados no padrão singleton (apenas 1 registro).

| Coluna                  | Tipo           | Nulo | Padrão                                                              | Descrição                                                                                      |
| :---------------------- | :------------- | :--: | :------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------- |
| `id`                    | `INT`          | Não  | `1`                                                                 | Identificador único singleton com restrição `CHECK (id = 1)`                                   |
| `site_name`             | `VARCHAR(100)` | Não  | `'PromoCuts'`                                                       | Nome exibido no navegador, cabeçalho e compartilhamento                                        |
| `site_tagline`          | `VARCHAR(255)` | Sim  | `'Cortes virais e recomendações de produtos afiliados'`             | Slogan ou frase de efeito complementar                                                         |
| `site_description`      | `TEXT`         | Sim  | `'Encontre os melhores achadinhos e promoções em vídeos curtos...'` | Meta description para SEO e buscadores                                                         |
| `primary_color_light`   | `VARCHAR(20)`  | Não  | `'#10B981'`                                                         | Cor primária no modo claro em hexadecimal estrito `CHECK (~* '^#[0-9A-Fa-f]{6}$')`             |
| `secondary_color_light` | `VARCHAR(20)`  | Não  | `'#6366F1'`                                                         | Cor secundária no modo claro em hexadecimal estrito `CHECK (~* '^#[0-9A-Fa-f]{6}$')`           |
| `primary_color_dark`    | `VARCHAR(20)`  | Não  | `'#10B981'`                                                         | Cor primária no modo escuro em hexadecimal estrito `CHECK (~* '^#[0-9A-Fa-f]{6}$')`            |
| `secondary_color_dark`  | `VARCHAR(20)`  | Não  | `'#6366F1'`                                                         | Cor secundária no modo escuro em hexadecimal estrito `CHECK (~* '^#[0-9A-Fa-f]{6}$')`          |
| `logo_url_light`        | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para logo clara (URL HTTPS, caminho local `/uploads/...` ou Data URI)  |
| `logo_url_dark`         | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para logo escura (fallback automático para `logo_url_light`)           |
| `logo_icon_url_light`   | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para ícone mobile no modo claro                                        |
| `logo_icon_url_dark`    | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para ícone mobile no modo escuro (fallback para `logo_icon_url_light`) |
| `favicon_url_light`           | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para favicon tema claro (`media="(prefers-color-scheme: light)"`)      |
| `favicon_url_dark`            | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para favicon tema escuro (`media="(prefers-color-scheme: dark)"`)      |
| `bio_avatar_url_light`        | `TEXT`         | Sim  | `NULL`                                                              | Foto de perfil dedicada para o Bio Links no modo claro (URL HTTPS ou `/uploads/...`)            |
| `bio_avatar_url_dark`         | `TEXT`         | Sim  | `NULL`                                                              | Foto de perfil dedicada para o Bio Links no modo escuro (fallback para tema claro ou logos)     |
| `bio_show_storefront_banner`  | `VARCHAR(20)`  | Não  | `'banner'`                                                          | Exibição do cartaz da vitrine no Bio Links (`'banner'`, `'compact'`, `'hidden'`)               |
| `bio_show_qrcode`             | `BOOLEAN`      | Não  | `true`                                                              | Habilita widget lateral desktop de QR Code gerado em SVG puro para leitura no celular           |
| `bio_title`                   | `VARCHAR(100)` | Sim  | `NULL`                                                              | Título opcional da página de links (fallback para `site_name`)                                  |
| `bio_description`             | `TEXT`         | Sim  | `NULL`                                                              | Biografia curta exibida no Bio Links (fallback para `site_tagline`)                             |
| `bio_primary_color_light`     | `VARCHAR(20)`  | Sim  | `NULL`                                                              | Cor primária opcional da página de links no modo claro (formato `#RRGGBB`)                      |
| `bio_primary_color_dark`      | `VARCHAR(20)`  | Sim  | `NULL`                                                              | Cor primária opcional da página de links no modo escuro (formato `#RRGGBB`)                     |
| `social_instagram`            | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o perfil da marca no Instagram                                              |
| `social_tiktok`         | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o perfil da marca no TikTok                                                 |
| `social_youtube`        | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o canal no YouTube                                                          |
| `footer_text`           | `TEXT`         | Sim  | `'PromoCuts — Todos os direitos reservados.'`                       | Mensagem de rodapé e direitos autorais                                                         |
| `created_at`            | `TIMESTAMPTZ`  | Não  | `NOW()`                                                             | Data e hora de criação                                                                         |
| `updated_at`            | `TIMESTAMPTZ`  | Não  | `NOW()`                                                             | Data e hora da última atualização (via trigger com search_path seguro)                         |

---

### 2.8 Tabela `public.bio_links` (Fase 9)

Armazena os links e comunidades do hub central do criador (Twitch, Kick, Discord, YouTube, Telegram, WhatsApp, PIX, Apoia-se, etc.) com crachás visuais e controles de destaque.

| Coluna           | Tipo           | Nulo | Padrão               | Descrição                                                                      |
| :--------------- | :------------- | :--: | :------------------- | :----------------------------------------------------------------------------- |
| `id`             | `UUID`         | Não  | `uuid_generate_v4()` | Identificador único do link                                                    |
| `title`          | `VARCHAR(100)` | Não  | —                    | Título amigável exibido no card de bio link                                    |
| `url`            | `TEXT`         | Não  | —                    | Endereço web de destino com validação `CHECK (url ~* '^https?://')`            |
| `icon`           | `VARCHAR(50)`  | Sim  | `NULL`               | Identificador da plataforma ou ícone (`twitch`, `kick`, `discord`, etc.)       |
| `badge_text`     | `VARCHAR(50)`  | Sim  | `NULL`               | Rótulo do crachá de destaque (ex: "AO VIVO", "GRUPO VIP", "COMUNIDADE")        |
| `is_active`      | `BOOLEAN`      | Não  | `true`               | Status de visibilidade na vitrine pública                                      |
| `is_highlighted` | `BOOLEAN`      | Não  | `false`              | Ativa efeito visual pulsante de atenção                                        |
| `display_order`  | `INT`          | Não  | `0`                  | Ordem de exibição na lista de links                                            |
| `clicks_count`   | `INT`          | Não  | `0`                  | Contador agregado acumulado de cliques                                         |
| `created_at`     | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data e hora de criação                                                         |
| `updated_at`     | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data da última modificação (via trigger)                                       |

---

### 2.9 Tabela `public.bio_link_clicks` (Fase 9)

Registros históricos individuais de cliques nos bio links para alimentação do painel temporal de métricas e conversão.

| Coluna        | Tipo            | Nulo | Padrão               | Descrição                                                       |
| :------------ | :-------------- | :--: | :------------------- | :-------------------------------------------------------------- |
| `id`          | `UUID`          | Não  | `uuid_generate_v4()` | Identificador do evento                                         |
| `bio_link_id` | `UUID`          | Não  | —                    | Referência à tabela `public.bio_links` (ON DELETE CASCADE)      |
| `created_at`  | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora do clique                                           |
| `user_agent`  | `VARCHAR(512)`  | Sim  | `NULL`               | Informação do navegador/dispositivo (limitado a 512 caracteres) |
| `referrer`    | `VARCHAR(1024)` | Sim  | `NULL`               | Origem da requisição / rede social (limitado a 1024 caracteres) |

---

### 2.10 Tabela `public.brand_social_links` (Fase 9)

Armazena as redes sociais e canais oficiais da marca utilizando o Padrão Strategy extensível, permitindo controle granular independente de exibição no cabeçalho da vitrine (`show_in_storefront`) e no perfil de bio links (`show_in_bio`).

| Coluna               | Tipo           | Nulo | Padrão               | Descrição                                                                      |
| :------------------- | :------------- | :--: | :------------------- | :----------------------------------------------------------------------------- |
| `id`                 | `UUID`         | Não  | `uuid_generate_v4()` | Identificador único do link da rede social                                     |
| `platform`           | `VARCHAR(50)`  | Não  | —                    | Identificador da plataforma no padrão strategy (`youtube`, `tiktok`, etc.)     |
| `url`                | `TEXT`         | Não  | —                    | Endereço completo ou formatado com validação `CHECK (url ~* '^https?://')`      |
| `show_in_storefront` | `BOOLEAN`      | Não  | `true`               | Se deve ser exibido nos ícones do cabeçalho da Vitrine pública                 |
| `show_in_bio`        | `BOOLEAN`      | Não  | `true`               | Se deve ser exibido na seção de redes do perfil da página de Bio Links         |
| `display_order`      | `INT`          | Não  | `0`                  | Ordem sequencial de exibição visual                                            |
| `is_active`          | `BOOLEAN`      | Não  | `true`               | Status de ativação geral do link                                               |
| `created_at`         | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data e hora de inclusão                                                        |
| `updated_at`         | `TIMESTAMPTZ`  | Não  | `NOW()`              | Data da última atualização (via trigger com search_path seguro)                |

---

## 3. Políticas de Segurança (Row Level Security - RLS)

Todas as tabelas possuem a opção `ROW LEVEL SECURITY` estritamente ativada:

1. **Leitura Pública de Configurações do Site:**
    - A tabela `site_settings` possui leitura pública liberada (`USING (true)`), permitindo que qualquer visitante carregue imediatamente as cores, logos, favicon e títulos customizados.
2. **Leitura Pública de Categorias:**
    - Todas as categorias podem ser consultadas publicamente (`USING (true)`) para popular o feed geral e as barras de navegação.
3. **Leitura Pública de Vídeos:**
    - Apenas registros com `is_published = true` podem ser lidos por conexões anônimas.
4. **Leitura Pública de Produtos e Links Multi-Loja:**
    - Produtos e seus registros filhos em `product_links` só são listados para o público se estiverem atrelados a pelo menos um vídeo com `is_published = true`.
5. **Leitura Pública de Bio Links:**
    - Apenas bio links com `is_active = true` podem ser lidos por conexões anônimas na vitrine pública.
6. **Leitura Pública de Redes Sociais da Marca (`brand_social_links`):**
    - Apenas redes com `is_active = true` podem ser lidas publicamente (`USING (is_active = true)`).
7. **Escrita Restrita:**
    - Operações de `INSERT`, `UPDATE` e `DELETE` nas tabelas principais (`site_settings`, `categories`, `videos`, `products`, `product_links`, `video_products`, `bio_links`, `brand_social_links`) são bloqueadas para o papel anônimo (`anon`).
    - Elas são realizadas pelas Server Actions autenticadas do Next.js via chave de serviço (`service_role`), após validação estrita da sessão de e-mail do administrador.
8. **Registro de Métricas Anônimas Endurecido contra DoS:**
    - As tabelas `affiliate_clicks` e `bio_link_clicks` permitem a operação de `INSERT` pelo público (`anon` e `authenticated`) com validação defensiva estrita no `WITH CHECK`: o alvo deve existir ativamente na base e os comprimentos de `user_agent` (<= 512) e `referrer` (<= 1024) são rigorosamente limitados, eliminando riscos de esgotamento de disco (Storage DoS).
8. **Sincronização Atômica de Contadores:**
    - O gatilho `trg_increment_bio_link_clicks` incrementa o contador `clicks_count` em `bio_links` sob o modelo `SECURITY DEFINER` de forma atômica no banco de dados.
9. **Mitigação de Search Path Hijacking:**
    - A função trigger `handle_updated_at` opera sob o modelo `SECURITY DEFINER` com `SET search_path = public`, impedindo interceptação de esquemas por usuários não confiáveis.

---

## 4. Como Aplicar as Migrações

O PromoCuts oferece três formas de aplicar e manter as migrações do banco de dados atualizadas:

### Método 1: Automático no Deploy (Recomendado — Zero Toque)

Ao preencher a variável de ambiente `DATABASE_URL` na Vercel (ou no arquivo `.env.local`), o pipeline de construção do Next.js executa o utilitário dinâmico [`scripts/migrate.mjs`](../scripts/migrate.mjs) automaticamente antes de compilar a aplicação (`node scripts/migrate.mjs && next build`).

- **Descoberta Dinâmica:** O script varre a pasta `supabase/migrations/` em ordem sequencial numérica natural, garantindo suporte imediato a quaisquer arquivos presentes e futuros (`001_...`, `002_...`, `005_...`, etc.).
- **Tabela de Controle:** Cria e gerencia a tabela interna `_promocuts_migrations` para registrar o histórico de arquivos já aplicados, impedindo reexecuções.
- **Segurança e Conexão:** Conecta-se diretamente ao banco PostgreSQL do Supabase com SSL obrigatório (`ssl: { rejectUnauthorized: false }`).
- **Degradação Graciosa:** Caso a variável `DATABASE_URL` não seja informada, o script registra um aviso no log e encerra com código de sucesso (0), permitindo que a compilação prossiga normalmente.

### Método 2: Manual com Arquivo Único Consolidado

Se optar por não fornecer a `DATABASE_URL` durante o deploy, é possível provisionar o banco de dados inteiro em um único comando:

1. Acesse o [Painel do Supabase](https://supabase.com/dashboard) e selecione o seu projeto.
2. No menu lateral esquerdo, clique no ícone **SQL Editor**.
3. Abra o arquivo unificado [`supabase/schema.sql`](../supabase/schema.sql) deste repositório, copie todo o seu conteúdo, cole na janela do editor e clique em **Run** (Executar).
4. O esquema consolidado é totalmente idempotente e provisiona todas as tabelas, tipos enumerados, índices de busca, gatilhos e políticas de segurança RLS de uma só vez.

### Método 3: Manual Incremental

Para atualizar projetos já existentes que possuam versões anteriores instaladas, aplique sequencialmente no SQL Editor apenas as migrações incrementais necessárias a partir da pasta [`supabase/migrations/`](../supabase/migrations/).

---

## 5. Clonagem de Dados para Ambiente de Desenvolvimento (`seed.sql`)

Para replicar exatamente as configurações de marca (`site_settings`), categorias cadastradas e histórico de migrações em um banco secundário de desenvolvimento (`promocuts-dev`):

1. Execute o utilitário de exportação local:
   ```bash
   node scripts/export-seed.mjs
   ```
2. O script se conectará à base de produção (usando a `DATABASE_URL` configurada), extrairá os registros atuais e gerará o arquivo local `supabase/seed.sql` (automaticamente ignorado pelo `.gitignore` para proteger dados privados).
3. No SQL Editor do novo projeto Supabase de desenvolvimento, execute primeiramente o [`supabase/schema.sql`](../supabase/schema.sql) e, em seguida, cole e execute o `supabase/seed.sql` gerado.

