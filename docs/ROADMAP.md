# Roadmap de Desenvolvimento — PromoCuts

Este documento define o roteiro de implementacao do **PromoCuts**, organizado em fases sequenciais. Ele serve como guia permanente para a equipe, permitindo rastrear o progresso do desenvolvimento, retomar trabalhos interrompidos e alinhar esforcos entre colaboradores.

---

## 1. Visao Geral de Progresso

| Fase        | Descricao                                                                  |   Status    |
| :---------- | :------------------------------------------------------------------------- | :---------: |
| **Fase 1**  | Fundacao do Projeto e Tooling                                              | `Concluido` |
| **Fase 2**  | Motor de Embeds e Utilitarios de Dominio                                   | `Concluido` |
| **Fase 3**  | Autenticacao, Middleware e Seguranca                                       | `Concluido` |
| **Fase 4**  | Painel Administrativo e White-Label                                        | `Concluido` |
| **Fase 5**  | Vitrine Publica Mobile-First e Desktop Grid                                | `Concluido` |
| **Fase 6**  | Telemetria de Afiliados e Conversao                                        | `Concluido` |
| **Fase 7**  | Cache Serverless, Cabecalhos Defensivos e Verificacao Final                | `Concluido` |
| **Fase 8**  | Automacao de Ofertas, Suporte Multi-Loja e Monitoramento                   | `Concluido` |
| **Fase 9**  | Hub Central do Criador (Bio Links, Streamers e Métricas)                   | `Concluido` |
| **Fase 10** | Segurança Avançada e Redes Privadas (Tailscale e Backups)                  | `Pendente`  |
| **Fase 11** | Internacionalização (i18n), Multi-Idiomas (next-intl) e Localização Global | `Pendente`  |
| **Fase 12** | PromoCuts 100% Self-Hosted (Docker Compose, Supabase Local e Redis)        | `Pendente`  |

---

## 2. Detalhamento das Fases

### Fase 1: Fundacao do Projeto e Tooling

Objetivo: Configurar a base tecnica da aplicacao, dependencias de producao, compiladores e conexao tipada com o banco de dados.

- [x] Criar o arquivo `package.json` com dependencias principais (Next.js 15, React 19, Lucide React, Supabase SDKs, utilitarios de classe).
- [x] Configurar o compilador TypeScript em `tsconfig.json`.
- [x] Configurar o Next.js em `next.config.ts` com geracao em modo standalone (`output: 'standalone'`) e permissao de dominios de imagens remotas.
- [x] Configurar o Tailwind CSS v4 em `src/app/globals.css` utilizando `@import "tailwindcss";` e declarando as variaveis semanticas na diretiva `@theme`.
- [x] Implementar a funcao auxiliar de combinacao de classes `cn()` em `src/lib/utils.ts`.
- [x] Implementar o gerenciador de temas (modo claro, modo escuro e sistema) com script anti-FOUC no cabeçalho e cache em `localStorage`.
- [x] Criar os clientes do Supabase para o lado cliente e lado servidor (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` e `src/lib/supabase/admin.ts`).
- [x] Implementar utilitario de ambiente e logger defensivo em `src/lib/logger.ts` controlado pela flag `isDev` (`IS_DEV === 'true' || process.env.NODE_ENV === 'development'`).
- [x] Definir as tipagens estritas do banco de dados em `src/types/database.ts` em total conformidade com `docs/DATABASE.md` (incluindo cores primária e secundária para modos claro e escuro).

---

### Fase 2: Motor de Embeds e Utilitarios de Dominio

Objetivo: Implementar o algoritmo central de parsing de URLs e geracao de embeds nativos sem armazenamento proprio de midia.

- [x] Desenvolver o analisador de URLs em `src/lib/embeds/parser.ts`:
    - [x] Reconhecimento e extracao de IDs do TikTok (URLs padrao, URLs mobile e URLs curtas).
    - [x] Reconhecimento e extracao de IDs do Instagram Reels (URLs diretas de post e reel).
    - [x] Reconhecimento e extracao de IDs do YouTube Shorts (URLs de shorts, links com watch e URLs encurtadas).
    - [x] Geracao segura de markup e URLs de embed sem cookies desnecessarios (youtube-nocookie).
- [x] Refatorar o motor de reprodutores de vídeo para o Padrão Strategy (`src/lib/embeds/strategies.ts`):
    - [x] Suporte unificado e desacoplado a TikTok, Instagram Reels, YouTube Shorts, Bilibili, Pinterest, Twitch Clips e Vimeo.
    - [x] Criação da migração incremental `supabase/migrations/008_flexible_video_platforms.sql` flexibilizando a coluna `platform` para `VARCHAR(50)`.
    - [x] Autodetecção inteligente de URLs e resolução dinâmica de badges nos componentes e telas administrativas.
- [x] Criar utilitarios de formatacao numerica e de moeda em Real brasileiro (`src/lib/formatters.ts`).
- [x] Criar rotina de testes unitarios para garantir que URLs invalidas ou manipuladas sejam rejeitadas com seguranca.

---

### Fase 3: Autenticacao, Middleware e Seguranca

Objetivo: Estabelecer as quatro barreiras de seguranca para isolar o painel administrativo.

- [x] Implementar o middleware defensivo em `src/middleware.ts`:
    - [x] Filtro de rede/IP para rotas `/admin/*` baseado em `ADMIN_ALLOWED_IPS` (suporte a IPs individuais e faixas CIDR).
    - [x] Validacao de sessao ativa via Supabase Auth.
    - [x] Checagem estrita da identidade do usuario logado contra a variavel `ADMIN_EMAIL`.
    - [x] Bloqueio HTTP 403 Forbidden para usuarios nao autorizados.
    - [x] Redirecionamento amigavel de usuarios anonimos para `/admin/login`.
- [x] Criar a tela de login administrativo em `src/app/admin/login/page.tsx` com envio de Magic Link via Supabase Auth.
- [x] Criar a rota de callback em `src/app/auth/callback/route.ts` para confirmacao da troca de sessao no servidor.

---

### Fase 4: Painel Administrativo e White-Label

Objetivo: Entregar a interface de gestao de conteudo e personalizacao visual do sistema.

- [x] Desenvolver o layout administrativo base em `src/app/admin/layout.tsx` com navegacao densa e segura.
- [x] Criar o modulo de gestao de categorias em `src/app/admin/categories/`:
    - [x] Tabela com listagem, ordem de exibicao e status.
    - [x] Formulario de criacao e edicao com seletor de icones da Lucide React.
    - [x] Server Actions de mutacao utilizando a chave service_role com validacao de entrada.
- [x] Criar o modulo de catalogo de produtos em `src/app/admin/products/`:
    - [x] Listagem de produtos com precos, cupons e lojas parceiras.
    - [x] Formulario de cadastro com validacao defensiva de URLs de afiliado.
- [x] Criar o modulo de curadoria de videos em `src/app/admin/videos/`:
    - [x] Cadastro por colagem de URL publica com deteccao automatica de plataforma.
    - [x] Vinculacao de multiplos produtos recomendados com ordenacao manual.
    - [x] Controles de publicacao (`is_published`) e destaque (`is_featured`).
- [x] Criar o modulo de customizacao visual em `src/app/admin/settings/`:
    - [x] Configuracao de identidade (nome, slogan, descricao e rodape).
    - [x] Seletor visual de paleta dual-theme (cores primaria e secundaria para modo claro e modo escuro).
    - [x] Gestao de ativos visuais (logo principal, icone mobile e favicon) para modos claro e escuro: componente hibrido com suporte a upload direto (Supabase Storage bucket `site-assets` ou volume local) e insercao de URLs externas (estritamente PNG ou SVG com fallbacks automaticos).
    - [x] Redes sociais da vitrine.
    - [x] Disparo de revalidacao instantanea de cache via `revalidatePath('/', 'layout')`.

---

### Fase 5: Vitrine Publica Mobile-First e Desktop Grid

Objetivo: Construir a experiencia de alta conversao para os visitantes em dispositivos moveis e computadores.

- [x] Implementar o layout raiz em `src/app/layout.tsx`:
    - [x] Injecao dinamica de variaveis CSS de marca (`--brand-primary` e `--brand-secondary`) resolvidas conforme o tema ativo (modo claro ou modo escuro).
    - [x] Script leve de deteccao de tema para carregar a preferencia sem flash de tela.
    - [x] Geracao dinamica de metadados de SEO, Open Graph e favicons com media queries (`prefers-color-scheme`) em `generateMetadata`.
- [x] Criar o cabecalho publico com exibicao de logo adaptavel ao tema ativo (com fallback automatico da escura para a clara), botao de alternancia de tema (claro/escuro/sistema) e navegacao basica.
- [x] Criar a barra de selecao de categorias com rolagem horizontal suave e sincronizacao de URL (`/` e `/c/[slug]`).
- [x] Desenvolver o feed mobile vertical com rolagem magnetica (`scroll-snap`):
    - [x] Estrutura vertical adaptada para viewport completa (`h-dvh`).
    - [x] Componente reprodutor com renderizacao lazy do iframe correspondente a plataforma.
    - [x] Miniatura antecipada para evitar telas em branco durante carregamento de redes externas.
- [x] Construir o painel inferior de produtos (Bottom Drawer):
    - [x] Exibicao do produto vinculado ao corte com imagem otimizada.
    - [x] Precos alinhados com tipografia tabular (`tabular-nums font-mono text-brand-primary`).
    - [x] Botao de cupom com acao de copia imediata e feedback visual.
    - [x] Botao primario de compra direcionando para a loja parceira em nova aba protegida.
- [x] Adaptar a visualizacao para telas desktop em formato de grade (grid 9:16).
- [x] Desenvolver a pagina individual de corte em `src/app/v/[slug]/page.tsx` para compartilhamento direto.

---

### Fase 6: Telemetria de Afiliados e Conversao

Objetivo: Monitorar engajamento e cliques de saida de forma leve e sem violacao de privacidade.

- [x] Implementar a Route Handler `/api/track-click`:
    - [x] Recebimento dos identificadores `product_id` e `video_id`.
    - [x] Validacao estrita e truncamento de cabecalhos (user agent ate 512 caracteres e referrer ate 1024 caracteres).
    - [x] Gravacao assincrona no banco de dados.
- [x] Vincular o disparo assincrono de telemetria aos cliques nos botoes de compra e cupom na vitrine publica.

---

### Fase 7: Cache Serverless, Cabecalhos Defensivos e Verificacao Final

Objetivo: Consolidar a arquitetura plug-and-play serverless, implementar cache em memoria resiliente com Upstash Redis, cabecalhos de seguranca nativos no Next.js e assegurar 100% de estabilidade e qualidade do codigo.

- [x] Executar checagem estatica de tipos com `npx tsc --noEmit`.
- [x] Executar analise estatica de codigo com `npm run lint`.
- [x] Compilar a aplicacao com `npm run build` para a borda serverless na Vercel.
- [x] Remover infraestrutura legada de conteineres e scripts Docker (`Dockerfile`, `compose`, `Nginx`, `scripts/`).
- [x] Implementar modulo de cache serverless Upstash Redis (`@upstash/redis`) com fallback gracioso e transparente.
- [x] Migrar cabecalhos defensivos de seguranca (CSP, X-Frame-Options, nosniff) diretamente para `next.config.ts`.
- [x] Expandir suite de testes unitarios automatizados (`tests/security-audit.test.ts` e `tests/cache.test.ts`) totalizando 115 testes passando com 0 falhas.

---

### Fase 8: Automacao de Ofertas, Suporte Multi-Loja e Monitoramento

Objetivo: Maximizar a conversao de vendas permitindo multiplas lojas parceiras por produto, autopreenchimento de dados por link e monitoramento automatizado de integridade de ofertas sem custos adicionais.

- [x] Modelar suporte a multiplos links afiliados por produto:
    - [x] Permitir que um mesmo produto possua multiplos links de lojas parceiras (Amazon, Shopee, Mercado Livre, AliExpress, etc.) com precos e cupons individuais.
    - [x] Atualizar o formulario administrativo de produtos para gerenciar a lista de lojas parceiras por produto.
    - [x] Adaptar o `ProductCard` e `ProductDrawer` na vitrine publica para exibir seletores ou botoes comparativos de lojas ("Comprar na Amazon", "Comprar na Shopee", etc.).
    - [x] Manter a telemetria `/api/track-click` registrando a loja parceira especifica selecionada no clique.
- [x] Implementar extrator leve de metadados Open Graph:
    - [x] Endpoint utilitario para inspecionar URLs de produtos e extrair titulo (`og:title`), imagem (`og:image`) e preco sugerido (`og:price:amount`).
    - [x] Botao de autopreenchimento no formulario de produtos ao colar o link de afiliado.
- [x] Criar rotina de verificacao de links em segundo plano (Vercel Cron Job):
    - [x] Verificacao periodica de integridade (HTTP status, deteccao de pagina 404 ou produto esgotado).
    - [x] Indicadores visuais de alerta no painel administrativo para ofertas que necessitam de revisao.

---

### Fase 9: Hub Central do Criador (Bio Links, Streamers e Dashboard de Métricas)

Objetivo: Transformar o PromoCuts no hub central soberano e descentralizado do criador de conteúdo, integrando links tradicionais de bio (Twitch, Kick, Discord, lives, comunidades, redes sociais e doações com crachás de destaque) à vitrine de cortes, e disponibilizando um painel visual gráfico de métricas e conversão no painel administrativo sem custos adicionais.

- [x] Modelar suporte a links de bio e comunidades no banco de dados:
    - [x] Criação da tabela `public.bio_links` (`id`, `title`, `url`, `icon`, `badge_text`, `is_active`, `is_highlighted`, `display_order`, `clicks_count`, `created_at`, `updated_at`).
    - [x] Habilitar Row Level Security (RLS) com leitura pública para links com `is_active = true` e escrita restrita à chave de serviço do servidor.
    - [x] Criar a migração incremental versionada `supabase/migrations/005_bio_links_and_analytics.sql`.
- [x] Módulo Administrativo de Bio Links (`/admin/bio-links`):
    - [x] Interface de cadastro com seletor de ícones representativos (Twitch, Kick, YouTube, Discord, Telegram, WhatsApp, PIX/Apoia-se e links externos).
    - [x] Controles de destaque visual (crachás configuráveis como "AO VIVO", "GRUPO VIP", "COMUNIDADE") e ativação instantânea.
    - [x] Reordenação manual de prioridade de exibição.
    - [x] Server Actions autenticadas de criação, edição, remoção e ordenação de links.
- [x] Integração Visual na Vitrine Pública (Mobile-First e Desktop):
    - [x] Componente superior retrátil de perfil com avatar, biografia do criador e gaveta de Bio Links com animação suave e crachás pulsantes.
    - [x] Coexistência fluida entre a seção de Bio Links e o feed vertical de cortes com produtos afiliados.
    - [x] Rastreamento de telemetria anônima nos cliques de bio links (`/api/track-click`) com suporte a contagem individual.
    - [x] Página pública dedicada de Bio Links (`/links` e `/bio`) no formato de agregador open-source com metadados Open Graph e cartão de conversão para a vitrine.
    - [x] Botão de acesso rápido a Bio Links no cabeçalho superior (`PublicHeader`), visível em smartphones e computadores.
    - [x] Garantia de resiliência com Upstash Redis estritamente opcional (fallback transparente para Supabase).
- [x] Personalização Visual e Design Avançado de Bio Links (`/admin/bio-links`):
    - [x] Aba dedicada "Personalização & Design" com gestão de fotos de perfil para Modo Claro e Modo Escuro via upload direto e URL.
    - [x] Cascata inteligente e universal de avatar (`Foto Bio -> Ícone Mobile -> Logo Principal -> Favicon -> Letra Inicial`).
    - [x] Cartaz da Vitrine de Cortes configurável em 3 modos: Destaque Amplo (`banner`), Compacto na Lista (`compact`) ou Oculto (`hidden`).
    - [x] Widget flutuante de QR Code no desktop em SVG puro determinístico (`src/lib/qrcode.ts`, zero dependências npm).
    - [x] Botão nativo de compartilhamento (Web Share API com fallback para cópia rápida no clipboard com feedback visual).
    - [x] Layout vertical centralizado no desktop inspirado no Linktree, com rodapé direcionando ao repositório GitHub open-source.
    - [x] Migração versionada `supabase/migrations/006_bio_links_customization.sql` e atualização de `site_settings`.
- [x] Dashboard Visual de Métricas no Painel Administrativo (`/admin/metrics`):
    - [x] Cartões de indicadores-chave de desempenho (KPIs): total de cliques em produtos, total de cliques em bio links e taxa de engajamento diária/semanal.
    - [x] Gráficos visuais responsivos e leves (sem introduzir custos ou bibliotecas pesadas de terceiros):
        - [x] Evolução temporal de cliques nos últimos 7 e 30 dias.
        - [x] Distribuição percentual de cliques por loja parceira (Amazon, Shopee, Mercado Livre, etc.).
        - [x] Ranking dos cortes de vídeo e produtos com maior volume de conversão.
        - [x] Ranking de cliques por rede social de origem (Instagram, TikTok, YouTube, tráfego direto).
        - [x] Ranking de cliques por Bio Link (Twitch, Discord, Telegram, etc.).
    - [x] Filtro temporal flexível (Hoje, Últimos 7 dias, Últimos 30 dias e Período completo).
- [x] Padrão Strategy de Redes Sociais e Rota Administrativa Dedicada (`/admin/social`):
    - [x] Migração incremental `supabase/migrations/007_brand_social_links.sql` criando a tabela `brand_social_links` com carga automática dos dados pré-existentes de `site_settings`.
    - [x] Catálogo amplo com 30+ plataformas populares do mercado (YouTube, TikTok, Twitch, Kick, Instagram, Reddit, Bluesky, Spotify, YouTube Music, Steam, Apoia-se, Buy Me a Coffee, Amazon Store, etc.) no Padrão Strategy (`src/lib/social/strategies.ts`).
    - [x] Unificação conceitual de "Website / Blog" e "Link Externo" sob a estratégia única `"link"`, preservando retrocompatibilidade para o identificador legado `"site"`.
    - [x] Autodetecção inteligente de plataformas ao colar URLs e combobox pesquisável com autocompletar instantâneo no modal de cadastro e edição (`SocialLinkDialog`).
    - [x] Vetores canônicos oficiais da indústria (Padrão Simple Icons 24x24 px em SVG puro) para PIX (geometria do Banco Central), YouTube Music, WhatsApp, Telegram, Patreon, Ko-fi e redes complementares, com suporte a favicons dinâmicos para links web externos via Google Favicon Service.
    - [x] Otimização de performance com seletor memoizado (`BioLinkIconSelector`) mantendo 60 FPS estáveis na digitação de títulos e URLs no modal.
    - [x] Controle granular e independente de exibição: sinalizadores `show_in_storefront` (cabeçalho da vitrine) e `show_in_bio` (perfil da página de bio links).
    - [x] Nova rota `/admin/social` com reordenação sequencial, toggles diretos de visibilidade e diálogo de cadastro/edição.
    - [x] Desacoplamento e simplificação de `/admin/settings` substituindo inputs engessados por link direto para o gerenciador.

---

### Fase 10: Segurança Avançada e Redes Privadas (Tailscale Guard e Backups)

Objetivo: Elevar a postura defensiva do PromoCuts a padrões corporativos de infraestrutura, permitindo restringir o acesso ao painel administrativo exclusivamente através de VPNs privadas (Tailscale Exit Nodes, WireGuard, OPNsense/pfSense) com gestão visual e backups autônomos.

- [ ] Gestão Visual de Rede Privada no Painel (`/admin/settings`):
    - [ ] Interruptor "Modo VPN / Tailscale Guard" para ativar e desativar o bloqueio de rede sem necessidade de reimplantação na Vercel.
    - [ ] Detecção de IP em tempo real: botão "Vincular meu IP / Exit Node atual" que captura o endereço público da conexão ativa e o salva na lista de autorizados.
    - [ ] Suporte a múltiplos IPs e blocos CIDR para administradores com mais de um nó de saída ou rede residencial/escritório.
    - [ ] Armazenamento defensivo das faixas autorizadas no banco de dados com leitura em cache na borda (Edge / Redis / memória).
- [ ] Mecanismo de Recuperação de Emergência (_Emergency Bypass Token_):
    - [ ] Geração de token criptográfico temporário de uso único (One-Time Token) exibido no terminal ou configurado via variável para desbloqueio caso o administrador perca o acesso ao nó de saída da VPN.
- [ ] Exportação e Backups Periódicos Automatizados:
    - [ ] Endpoint seguro ou Cron Job para gerar backups em arquivo JSON/SQL com envio para e-mail ou download manual no painel.
    - [ ] Guia prático de implantação de Tailscale Exit Node no OPNsense, pfSense e Linux para administradores do PromoCuts.

---

### Fase 11: Internacionalização (i18n), Multi-Idiomas (next-intl) e Localização Global

Objetivo: Tornar o PromoCuts uma plataforma globalmente acessível e internacionalizada, permitindo que criadores e visitantes utilizem a vitrine e o painel em Português (`pt-BR`) ou Inglês (`en-US`) com detecção automática pelo navegador, fallback gerenciável no painel administrativo e suporte nativo ao Next.js App Router via biblioteca oficial `next-intl`.

- [ ] Infraestrutura e Dicionários de Tradução (`next-intl`):
    - [ ] Instalação e configuração do pacote `next-intl` compatível com o Next.js App Router e Server Components.
    - [ ] Criação dos arquivos estruturados de localização: `src/locales/pt-BR.json` e `src/locales/en-US.json`.
    - [ ] Configuração de tipagem estrita com TypeScript (`IntlMessages` em declaração global) para validação de integridade de chaves em tempo de compilação.
- [ ] Configuração de Idiomas no Banco de Dados e Painel (`/admin/settings`):
    - [ ] Migração do banco estendendo `site_settings`: colunas `default_locale` ('pt-BR' ou 'en-US') e `supported_locales` (array de idiomas autorizados na vitrine).
    - [ ] Interface visual no painel administrativo para escolha do idioma padrão da plataforma e ativação seletiva de idiomas suportados.
    - [ ] Server Action autenticada para atualização das preferências com revalidação de cache.
- [ ] Detecção Automática e Alternância na Vitrine:
    - [ ] Middleware para detecção de preferência de linguagem via cabeçalho `Accept-Language` e persistência em cookie (`promocuts-locale`).
    - [ ] Seletor sutil e acessível de idioma no cabeçalho público (`PublicHeader`).
    - [ ] Fallback transparente para o idioma principal definido pelo criador caso o idioma do visitante não seja suportado.
- [ ] Tradução Integral dos Módulos:
    - [ ] Vitrine pública: feed de vídeos, gaveta de produtos, comparador multi-loja, botões de cópia de cupom, pílulas de categorias, perfil do criador e rodapé.
    - [ ] Painel administrativo: navegação, gestão de categorias, vídeos, produtos, bio links, métricas e configurações.
    - [ ] Tratamento de mensagens de feedback, modais de diálogo e metadados de SEO (Open Graph e descrições).
- [ ] Documentação Técnica Bilingue:
    - [ ] Criação do `README.en.md` com apresentação, guia de início rápido e instruções de deploy para a comunidade global do GitHub.

---

### Fase 12: PromoCuts 100% Self-Hosted (Docker Compose, Supabase Local e Redis Autônomo)

Objetivo: Permitir a implantação e execução do PromoCuts com total soberania e custo zero em servidores próprios (VPS, homelab ou servidores dedicados), eliminando qualquer dependência de plataformas gerenciadas em nuvem através de uma orquestração unificada com Docker Compose.

- [ ] Orquestração Completa via Docker Compose (`docker-compose.yml`):
    - [ ] Configuração do serviço PostgreSQL 17 oficial com extensões necessárias (`pgcrypto`, `uuid-ossp`).
    - [ ] Configuração do serviço Supabase Studio e PostgREST local para gestão autônoma de dados e autenticação sem provedor externo.
    - [ ] Configuração do serviço Redis 8 autônomo para cache em memória local.
    - [ ] Configuração do contêiner da aplicação PromoCuts com `Dockerfile` otimizado em múltiplos estágios para Next.js App Router (modo standalone).
- [ ] Automação de Inicialização e Migrações Locais:
    - [ ] Scripts de inicialização autônoma (`scripts/selfhost-init.sh` e `scripts/selfhost-init.ps1`) para gerar segredos de ambiente, inicializar os contêineres e aplicar migrações sequenciais automaticamente.
    - [ ] Configuração de volumes persistentes para dados do banco (`postgres_data`), uploads locais e cache.
- [ ] Proxy Reverso e Certificados TLS/SSL Automáticos:
    - [ ] Template integrado de Caddy ou Nginx com HTTPS automático (Let's Encrypt) para exposição segura da aplicação em VPS.
    - [ ] Arquivo universal de configuração de ambiente `.env.selfhost.example`.
- [ ] Documentação de Implantação Soberana:
    - [ ] Guia passo a passo `docs/SELF_HOSTING.md` para execução em distribuições Linux (Ubuntu, Debian), Raspberry Pi, Unraid e Synology.

