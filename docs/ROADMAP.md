# Roadmap de Desenvolvimento — PromoCuts

Este documento define o roteiro de implementacao do **PromoCuts**, organizado em fases sequenciais. Ele serve como guia permanente para a equipe, permitindo rastrear o progresso do desenvolvimento, retomar trabalhos interrompidos e alinhar esforcos entre colaboradores.

---

## 1. Visao Geral de Progresso

| Fase       | Descricao                                   |   Status    |
| :--------- | :------------------------------------------ | :---------: |
| **Fase 1** | Fundacao do Projeto e Tooling               | `Concluido` |
| **Fase 2** | Motor de Embeds e Utilitarios de Dominio    | `Concluido` |
| **Fase 3** | Autenticacao, Middleware e Seguranca        | `Concluido` |
| **Fase 4** | Painel Administrativo e White-Label         | `Concluido` |
| **Fase 5** | Vitrine Publica Mobile-First e Desktop Grid | `Concluido` |
| **Fase 6** | Telemetria de Afiliados e Conversao         | `Pendente`  |
| **Fase 7** | Dockerizacao, Testes e Verificacao Final    | `Pendente`  |

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

- [ ] Implementar a Route Handler `/api/track-click`:
    - [ ] Recebimento dos identificadores `product_id` e `video_id`.
    - [ ] Validacao estrita e truncamento de cabecalhos (user agent ate 512 caracteres e referrer ate 1024 caracteres).
    - [ ] Gravacao assincrona no banco de dados.
- [ ] Vincular o disparo assincrono de telemetria aos cliques nos botoes de compra e cupom na vitrine publica.

---

### Fase 7: Dockerizacao, Testes e Verificacao Final

Objetivo: Assegurar a estabilidade, qualidade do codigo e funcionamento dos conteineres.

- [ ] Executar checagem estatica de tipos com `npx tsc --noEmit`.
- [ ] Executar analise estatica de codigo com `npm run lint`.
- [ ] Compilar a aplicacao com `npm run build` e verificar a geracao de artefatos em `.next/standalone`.
- [ ] Validar a integracao completa de conteineres no `docker-compose.yml` (Nginx, App com volume persistente de uploads, PostgreSQL e Redis).
- [ ] Realizar testes de auditoria de seguranca garantindo que rotas administrativas estejam bloqueadas para acessos nao autorizados.
