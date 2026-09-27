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
    PRODUCTS ||--o{ AFFILIATE_CLICKS : "recebe cliques"
    VIDEOS ||--o{ AFFILIATE_CLICKS : "origina cliques"

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
        video_platform platform
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
| `platform`          | `video_platform` | Não  | —                    | Enum restrito: `'tiktok'`, `'reels'` ou `'shorts'`        |
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

Armazena o catálogo de itens recomendados com links de afiliados.

| Coluna           | Tipo            | Nulo | Padrão               | Descrição                                           |
| :--------------- | :-------------- | :--: | :------------------- | :-------------------------------------------------- |
| `id`             | `UUID`          | Não  | `uuid_generate_v4()` | Identificador único do produto                      |
| `category_id`    | `UUID`          | Sim  | `NULL`               | Categoria do produto (ON DELETE SET NULL)           |
| `name`           | `VARCHAR(255)`  | Não  | —                    | Nome comercial do produto                           |
| `description`    | `TEXT`          | Sim  | `NULL`               | Detalhes curtos ou diferencial do produto           |
| `image_url`      | `TEXT`          | Não  | —                    | URL da imagem do produto (hospedada na loja ou CDN) |
| `affiliate_url`  | `TEXT`          | Não  | —                    | Link de redirecionamento com código de comissão     |
| `regular_price`  | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço original do item (para exibição de desconto)  |
| `discount_price` | `NUMERIC(10,2)` | Sim  | `NULL`               | Preço final com desconto ativo                      |
| `currency`       | `VARCHAR(10)`   | Não  | `'BRL'`              | Código da moeda (padrão: real brasileiro)           |
| `coupon_code`    | `VARCHAR(100)`  | Sim  | `NULL`               | Código promocional para cópia rápida                |
| `store_name`     | `VARCHAR(100)`  | Não  | —                    | Nome da loja (ex: "Amazon", "Shopee", "AliExpress") |
| `created_at`     | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora de inclusão                             |
| `updated_at`     | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora da última atualização                   |

---

### 2.4 Tabela `public.video_products`

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

### 2.5 Tabela `public.affiliate_clicks`

Registros anônimos de engajamento para cálculo de métricas de conversão com mitigação ativa contra DoS.

| Coluna       | Tipo            | Nulo | Padrão               | Descrição                                                       |
| :----------- | :-------------- | :--: | :------------------- | :-------------------------------------------------------------- |
| `id`         | `UUID`          | Não  | `uuid_generate_v4()` | Identificador do evento                                         |
| `product_id` | `UUID`          | Não  | —                    | Referência ao produto clicado (ON DELETE CASCADE)               |
| `video_id`   | `UUID`          | Sim  | `NULL`               | Referência ao vídeo de onde partiu o clique                     |
| `created_at` | `TIMESTAMPTZ`   | Não  | `NOW()`              | Data e hora do clique                                           |
| `user_agent` | `VARCHAR(512)`  | Sim  | `NULL`               | Informação do navegador/dispositivo (limitado a 512 caracteres) |
| `referrer`   | `VARCHAR(1024)` | Sim  | `NULL`               | Origem da requisição (limitado a 1024 caracteres)               |

---

### 2.6 Tabela `public.site_settings`

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
| `favicon_url_light`     | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para favicon tema claro (`media="(prefers-color-scheme: light)"`)      |
| `favicon_url_dark`      | `TEXT`         | Sim  | `NULL`                                                              | Referência a PNG ou SVG para favicon tema escuro (`media="(prefers-color-scheme: dark)"`)      |
| `social_instagram`      | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o perfil da marca no Instagram                                              |
| `social_tiktok`         | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o perfil da marca no TikTok                                                 |
| `social_youtube`        | `VARCHAR(255)` | Sim  | `NULL`                                                              | Link opcional para o canal no YouTube                                                          |
| `footer_text`           | `TEXT`         | Sim  | `'PromoCuts — Todos os direitos reservados.'`                       | Mensagem de rodapé e direitos autorais                                                         |
| `created_at`            | `TIMESTAMPTZ`  | Não  | `NOW()`                                                             | Data e hora de criação                                                                         |
| `updated_at`            | `TIMESTAMPTZ`  | Não  | `NOW()`                                                             | Data e hora da última atualização (via trigger com search_path seguro)                         |

---

## 3. Políticas de Segurança (Row Level Security - RLS)

Todas as tabelas possuem a opção `ROW LEVEL SECURITY` estritamente ativada:

1. **Leitura Pública de Configurações do Site:**
    - A tabela `site_settings` possui leitura pública liberada (`USING (true)`), permitindo que qualquer visitante carregue imediatamente as cores, logos, favicon e títulos customizados.
2. **Leitura Pública de Categorias:**
    - Todas as categorias podem ser consultadas publicamente (`USING (true)`) para popular o feed geral e as barras de navegação.
3. **Leitura Pública de Vídeos:**
    - Apenas registros com `is_published = true` podem ser lidos por conexões anônimas.
4. **Leitura Pública de Produtos:**
    - Produtos só são listados para o público se estiverem atrelados a pelo menos um vídeo com `is_published = true`.
5. **Escrita Restrita:**
    - Operações de `INSERT`, `UPDATE` e `DELETE` nas tabelas principais (`site_settings`, `categories`, `videos`, `products`, `video_products`) são bloqueadas para o papel anônimo (`anon`).
    - Elas são realizadas pelas Server Actions autenticadas do Next.js via chave de serviço (`service_role`), após validação estrita da sessão de e-mail do administrador.
6. **Registro de Métricas Anônimas Endurecido contra DoS:**
    - A tabela `affiliate_clicks` permite a operação de `INSERT` pelo público (`anon` e `authenticated`) com validação defensiva estrita no `WITH CHECK`: o produto deve existir ativamente na base e os comprimentos de `user_agent` (<= 512) e `referrer` (<= 1024) são rigorosamente limitados, eliminando riscos de esgotamento de disco (Storage DoS).
7. **Mitigação de Search Path Hijacking:**
    - A função trigger `handle_updated_at` opera sob o modelo `SECURITY DEFINER` com `SET search_path = public`, impedindo interceptação de esquemas por usuários não confiáveis.

---

## 4. Como Aplicar as Migrações

1. Acesse o [Painel do Supabase](https://supabase.com/dashboard).
2. Selecione o projeto desejado ou crie um novo gratuitamente.
3. No menu lateral esquerdo, clique no ícone **SQL Editor** (ícone de terminal/código).
4. Para instalações novas, abra o arquivo local [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql) do projeto.
5. Para bancos de dados existentes criados antes da categorização, execute o arquivo complementar [`supabase/migrations/002_add_categories.sql`](../supabase/migrations/002_add_categories.sql).
6. Para bancos de dados existentes que necessitam do módulo de customização e branding, execute o arquivo complementar [`supabase/migrations/003_add_site_settings.sql`](../supabase/migrations/003_add_site_settings.sql).
7. Copie todo o conteúdo, cole na janela do SQL Editor e clique no botão **Run** (Executar).
8. O retorno exibirá `Success. No rows returned`, confirmando que todas as tabelas, tipos, funções, triggers e políticas de segurança foram criados.
