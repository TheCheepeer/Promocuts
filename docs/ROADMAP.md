# Roadmap de Desenvolvimento — PromoCuts

Este documento define o roteiro de implementacao do **PromoCuts**, organizado em fases sequenciais. Ele serve como guia permanente para a equipe, permitindo rastrear o progresso do desenvolvimento, retomar trabalhos interrompidos e alinhar esforcos entre colaboradores.

---

## 1. Visao Geral de Progresso

| Fase       | Descricao                                   |   Status   |
| :--------- | :------------------------------------------ | :--------: |
| **Fase 1** | Fundacao do Projeto e Tooling               | `Pendente` |
| **Fase 2** | Motor de Embeds e Utilitarios de Dominio    | `Pendente` |
| **Fase 3** | Autenticacao, Middleware e Seguranca        | `Pendente` |
| **Fase 4** | Painel Administrativo e White-Label         | `Pendente` |
| **Fase 5** | Vitrine Publica Mobile-First e Desktop Grid | `Pendente` |
| **Fase 6** | Telemetria de Afiliados e Conversao         | `Pendente` |
| **Fase 7** | Dockerizacao, Testes e Verificacao Final    | `Pendente` |

---

## 2. Detalhamento das Fases

### Fase 1: Fundacao do Projeto e Tooling

Objetivo: Configurar a base tecnica da aplicacao, dependencias de producao, compiladores e conexao tipada com o banco de dados.

- [ ] Criar o arquivo `package.json` com dependencias principais (Next.js 15, React 19, Lucide React, Supabase SDKs, utilitarios de classe).
- [ ] Configurar o compilador TypeScript em `tsconfig.json`.
- [ ] Configurar o Next.js em `next.config.ts` com geracao em modo standalone (`output: 'standalone'`) e permissao de dominios de imagens remotas.
- [ ] Configurar o Tailwind CSS v4 em `app/globals.css` utilizando `@import "tailwindcss";` e declarando as variaveis semanticas na diretiva `@theme`.
- [ ] Implementar a funcao auxiliar de combinacao de classes `cn()` em `lib/utils.ts`.
- [ ] Implementar o gerenciador de temas (modo claro, modo escuro e sistema) com script anti-FOUC no cabeçalho e cache em `localStorage`.
- [ ] Criar os clientes do Supabase para o lado cliente e lado servidor (`lib/supabase/client.ts`, `lib/supabase/server.ts` e `lib/supabase/admin.ts`).
- [ ] Definir as tipagens estritas do banco de dados em `types/database.ts` em total conformidade com `docs/DATABASE.md` (incluindo cores primária e secundária para modos claro e escuro).

---

### Fase 2: Motor de Embeds e Utilitarios de Dominio

Objetivo: Implementar o algoritmo central de parsing de URLs e geracao de embeds nativos sem armazenamento proprio de midia.

- [ ] Desenvolver o analisador de URLs em `lib/embeds/parser.ts`:
    - [ ] Reconhecimento e extracao de IDs do TikTok (URLs padrao, URLs mobile e URLs curtas).
    - [ ] Reconhecimento e extracao de IDs do Instagram Reels (URLs diretas de post e reel).
    - [ ] Reconhecimento e extracao de IDs do YouTube Shorts (URLs de shorts, links com watch e URLs encurtadas).
    - [ ] Geracao segura de markup e URLs de embed sem cookies desnecessarios (youtube-nocookie).
- [ ] Criar utilitarios de formatacao numerica e de moeda em Real brasileiro (`lib/formatters.ts`).
- [ ] Criar rotina de testes unitarios para garantir que URLs invalidas ou manipuladas sejam rejeitadas com seguranca.

---

### Fase 3: Autenticacao, Middleware e Seguranca

Objetivo: Estabelecer as quatro barreiras de seguranca para isolar o painel administrativo.

- [ ] Implementar o middleware defensivo em `middleware.ts`:
    - [ ] Filtro de rede/IP para rotas `/admin/*` baseado em `ADMIN_ALLOWED_IPS` (suporte a IPs individuais e faixas CIDR).
    - [ ] Validacao de sessao ativa via Supabase Auth.
    - [ ] Checagem estrita da identidade do usuario logado contra a variavel `ADMIN_EMAIL`.
    - [ ] Bloqueio HTTP 403 Forbidden para usuarios nao autorizados.
    - [ ] Redirecionamento amigavel de usuarios anonimos para `/admin/login`.
- [ ] Criar a tela de login administrativo em `app/admin/login/page.tsx` com envio de Magic Link via Supabase Auth.
- [ ] Criar a rota de callback em `app/auth/callback/route.ts` para confirmacao da troca de sessao no servidor.

---

### Fase 4: Painel Administrativo e White-Label

Objetivo: Entregar a interface de gestao de conteudo e personalizacao visual do sistema.

- [ ] Desenvolver o layout administrativo base em `app/admin/layout.tsx` com navegacao densa e segura.
- [ ] Criar o modulo de gestao de categorias em `app/admin/categories/`:
    - [ ] Tabela com listagem, ordem de exibicao e status.
    - [ ] Formulario de criacao e edicao com seletor de icones da Lucide React.
    - [ ] Server Actions de mutacao utilizando a chave service_role com validacao de entrada.
- [ ] Criar o modulo de catalogo de produtos em `app/admin/products/`:
    - [ ] Listagem de produtos com precos, cupons e lojas parceiras.
    - [ ] Formulario de cadastro com validacao defensiva de URLs de afiliado.
- [ ] Criar o modulo de curadoria de videos em `app/admin/videos/`:
    - [ ] Cadastro por colagem de URL publica com deteccao automatica de plataforma.
    - [ ] Vinculacao de multiplos produtos recomendados com ordenacao manual.
    - [ ] Controles de publicacao (`is_published`) e destaque (`is_featured`).
- [ ] Criar o modulo de customizacao visual em `app/admin/settings/`:
    - [ ] Configuracao de identidade (nome, slogan, descricao e rodape).
    - [ ] Seletor visual de paleta dual-theme (cores primaria e secundaria para modo claro e modo escuro).
    - [ ] Gestao de ativos visuais (logo principal, icone mobile e favicon) para modos claro e escuro: componente hibrido com suporte a upload direto (Supabase Storage bucket `site-assets` ou volume local) e insercao de URLs externas (estritamente PNG ou SVG com fallbacks automaticos).
    - [ ] Redes sociais da vitrine.
    - [ ] Disparo de revalidacao instantanea de cache via `revalidatePath('/', 'layout')`.

---

### Fase 5: Vitrine Publica Mobile-First e Desktop Grid

Objetivo: Construir a experiencia de alta conversao para os visitantes em dispositivos moveis e computadores.

- [ ] Implementar o layout raiz em `app/layout.tsx`:
    - [ ] Injecao dinamica de variaveis CSS de marca (`--brand-primary` e `--brand-secondary`) resolvidas conforme o tema ativo (modo claro ou modo escuro).
    - [ ] Script leve de deteccao de tema para carregar a preferencia sem flash de tela.
    - [ ] Geracao dinamica de metadados de SEO, Open Graph e favicons com media queries (`prefers-color-scheme`) em `generateMetadata`.
- [ ] Criar o cabecalho publico com exibicao de logo adaptavel ao tema ativo (com fallback automatico da escura para a clara), botao de alternancia de tema (claro/escuro/sistema) e navegacao basica.
- [ ] Criar a barra de selecao de categorias com rolagem horizontal suave e sincronizacao de URL (`/` e `/c/[slug]`).
- [ ] Desenvolver o feed mobile vertical com rolagem magnetica (`scroll-snap`):
    - [ ] Estrutura vertical adaptada para viewport completa (`h-dvh`).
    - [ ] Componente reprodutor com renderizacao lazy do iframe correspondente a plataforma.
    - [ ] Miniatura antecipada para evitar telas em branco durante carregamento de redes externas.
- [ ] Construir o painel inferior de produtos (Bottom Drawer):
    - [ ] Exibicao do produto vinculado ao corte com imagem otimizada.
    - [ ] Precos alinhados com tipografia tabular (`tabular-nums font-mono text-brand-primary`).
    - [ ] Botao de cupom com acao de copia imediata e feedback visual.
    - [ ] Botao primario de compra direcionando para a loja parceira em nova aba protegida.
- [ ] Adaptar a visualizacao para telas desktop em formato de grade (grid 9:16).
- [ ] Desenvolver a pagina individual de corte em `app/v/[slug]/page.tsx` para compartilhamento direto.

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
