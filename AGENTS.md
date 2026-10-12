# Diretrizes e Contexto do Repositorio — PromoCuts

Este documento estabelece o contexto permanente, a arquitetura e as regras operacionais especificas do repositorio **PromoCuts** para orientar o trabalho de agentes de inteligencia artificial e desenvolvedores.

---

## 1. Resumo Executivo

### Proposito do Sistema

O **PromoCuts** e um agregador open-source voltado para conversao de videos curtos verticais (TikTok, Instagram Reels e YouTube Shorts) integrados diretamente a produtos recomendados em programas de afiliados (Amazon, Shopee, Mercado Livre, AliExpress, entre outros). O projeto foi concebido sob tres premissas fundamentais:

- **Custo Operacional Zero:** Utilizacao exclusiva de planos gratuitos (Vercel e Supabase), eliminando custos de CDN e armazenamento por meio de embeds nativos das plataformas.
- **Alta Conversao Mobile-First:** Feed vertical com rolagem fluida (_scroll-snap_), pílulas de categorias dinamicas, cards de produtos integrados e acao rapida de copia de cupons.
- **Facilidade de Replicacao:** Deploy com 1 clique e configuracao orientada a poucas variaveis de ambiente.

### Stack Tecnologica

- **Frontend e Fullstack:** Next.js (App Router, Server Actions, TypeScript)
- **Estilizacao Visual:** Tailwind CSS v4
- **Banco de Dados e Autenticacao:** Supabase (PostgreSQL, Supabase Auth via Magic Link, Row Level Security)
- **Icones:** Lucide React
- **Hospedagem:** Vercel

### Arquitetura Geral

O sistema e composto pelas seguintes camadas:

1. **Camada de Cliente:** Interface responsiva adaptavel entre feed mobile-first com scroll vertical e grid de cartao no desktop.
2. **Camada de Borda e Roteamento (Vercel / Next.js):**
    - Middleware de protecao que valida sessoes de autenticacao e restringe o painel `/admin` ao endereco configurado em `ADMIN_EMAIL`.
    - Rotas publicas para navegacao geral (`/`), filtros por categoria (`/c/[slug]`) e visualizacao individual (`/v/[slug]`).
    - Rota administrativa fechada (`/admin/*`) para gestao de categorias, videos e produtos afiliados.
    - Endpoint leve `/api/track-click` para telemetria anonima de cliques em links de afiliados.
3. **Motor de Embeds Nativos:** Modulo utilitario (`lib/embeds/parser.ts`) responsavel por extrair IDs de URLs e gerar iframes oficiais de TikTok, Instagram Reels e YouTube Shorts sob demanda, sem download ou processamento de arquivos `.mp4`.
4. **Camada de Dados e Seguranca (Supabase / PostgreSQL):**
    - Row Level Security (RLS) habilitada em todas as tabelas.
    - Consultas publicas liberadas apenas para conteudo com `is_published = true`.
    - Operacoes de mutacao administrativas restritas ao servidor via `SUPABASE_SERVICE_ROLE_KEY` apos validacao de sessao.

---

## 2. Fontes Primarias de Verdade

A pasta `docs/` e o arquivo `README.md` constituem as **fontes primarias e oficiais de verdade** sobre regras de negocio, arquitetura, modelagem de dados e procedimentos operacionais deste repositorio.

Estrutura da documentacao tecnica:

- **`README.md`**: Visao geral do produto, recursos principais, stack, instalacao local, deploy na Vercel e termos da licenca.
- **`docs/ARCHITECTURE.md`**: Principios de arquitetura, diagramas Mermaid do sistema, funcionamento detalhado do motor de embeds, modelo de seguranca em tres barreiras e especificacoes de interface.
- **`docs/DATABASE.md`**: Diagrama Entidade-Relacionamento (ERD), dicionario completo de tabelas e colunas, enums, triggers e politicas de Row Level Security (RLS).
- **`docs/DEPLOYMENT.md`**: Guia passo a passo de configuracao de infraestrutura gratuita no Supabase e na Vercel.
- **`docs/ROADMAP.md`**: Roteiro sequencial de implementacao e acompanhamento do progresso das fases do projeto.

---

## 3. Instrucoes Obrigatorias para Agentes

Ao atuar neste projeto, o agente deve seguir rigorosamente as instrucoes abaixo:

1. **Consulta Previa Mandatoria:** Antes de propor refatoracoes, criar novos modulos, alterar o esquema do banco de dados ou responder a questionamentos sobre regras de negocio, o agente **deve sempre consultar a pasta `docs/` e o `README.md`**.
2. **Alinhamento com o Modelo de Dados:** Nenhuma alteracao em entidades ou consultas deve desrespeitar os esquemas documentados em `docs/DATABASE.md` e implementados em `supabase/migrations/`.
3. **Preservacao do Custo Zero:** Nunca introduzir dependencias, servicos externos pagos, armazenamento proprio de midia (buckets S3/R2 para arquivos de video) ou processamento de video no servidor.
4. **Seguranca e Autorizacao:** Nunca enfraquecer o fluxo de protecao de `/admin`. Toda mutacao de dados deve validar a identidade contra `ADMIN_EMAIL` e utilizar a `SUPABASE_SERVICE_ROLE_KEY` estritamente no lado do servidor (Server Actions / Route Handlers). Jamais expor a chave de servico ao cliente.
5. **Atualizacao Continua da Documentacao:** Sempre que uma nova funcionalidade, tabela, rota ou variavel de ambiente for criada ou alterada, a documentacao correspondente em `docs/` e `README.md` deve ser atualizada em sincronia.
6. **Padroes de Codigo e Estilo:**
    - Adotar estritamente **Tailwind CSS v4** para toda a estilizacao, evitando CSS avulso ou bibliotecas de CSS-in-JS.
    - Manter comunicacao limpa, profissional e **sem emojis** em qualquer arquivo, comentario de codigo, commit ou mensagem.
7. **Rigor Gramatical, Acentuação e Pontuação (Português Culto):**
    - Todo e qualquer texto produzido pelo agente em língua portuguesa — incluindo respostas no chat, documentações técnicas (`docs/`, `README.md`, `AGENTS.md`), comentários de código, mensagens de commit, textos de interface, rótulos e notificações — **deve obrigatoriamente utilizar acentuação gráfica correta e pontuação precisa**.
    - É expressamente proibido omitir acentos (como agudos, circunflexos, crases e tis) ou negligenciar regras de pontuação (vírgulas, pontos finais, ponto e vírgula, concordância nominal e verbal) sob pretexto de simplificação ou comodidade técnica.
8. **Desenvolvimento Guiado pelo Roadmap (Uma Fase por Chat):** O desenvolvimento do projeto deve seguir estritamente o `docs/ROADMAP.md`. Cada sessao de chat e dedicada a exatamente **uma fase**, englobando planejamento, implementacao, verificacao e sincronizacao mandatoria da documentacao antes de transitar para a proxima fase.
9. **Proibicao de Exposicao da Stack e Termos Tecnicos no Frontend:** E estritamente proibido exibir nomes de tecnologias da stack (como Node.js, Next.js, Tailwind CSS, Supabase, PostgreSQL, Docker, Vercel, etc.), jargoes de desenvolvimento ou termos tecnicos de infraestrutura e seguranca fora de contexto (ex: "Fase 2", "service_role", "CIDR", "Magic Link", "super seguro", "VPN Guard", variaveis como `ADMIN_EMAIL`) em qualquer parte visual ou textual voltada ao usuario final ou administrador (interfaces, cards, botoes, modais, formularios, rodapes ou mensagens de feedback). Toda comunicacao na interface deve ser limpa, profissional, focada exclusivamente no valor do produto para o usuario e no fluxo operacional do negocio. A unica mencao tecnica permitida no frontend e o link discreto para o repositorio no GitHub ("GitHub").
10. **Estratégia de Branches e Isolamento de Ambientes:**
    - A branch `main` é reservada estritamente para versões estáveis em produção.
    - O desenvolvimento ativo e a homologação de novas fases ocorrem na branch `develop` (vinculada ao ambiente de Preview da Vercel e à base Supabase Dev).
    - É proibido realizar commits diretos na `main` durante o desenvolvimento de novas fases; a mesclagem para a `main` deve ocorrer somente após a conclusão, verificação e documentação completas da fase.
11. **Desacoplamento Textual de Plataformas e Lojas Externas na Interface:**
    - É estritamente proibido citar nomes de plataformas de vídeo (como TikTok, Reels, Shorts, etc.) ou lojas e marketplaces externos (como Amazon, Shopee, etc.) em títulos de páginas, descrições funcionais gerais, subtítulos, caixas de diálogo, textos de orientação ou estados vazios (*empty states*).
    - A interface deve descrever exclusivamente a função e o fluxo operacional do sistema (ex.: "Gestão de Vídeos", "Gerencie publicações de vídeo e vincule produtos recomendados aos cortes", "Adicione seu primeiro vídeo colando o link da publicação").
    - Plataformas e lojas são tratadas estritamente como adaptadores desacoplados ao ecossistema; seus nomes e identificadores só podem ser apresentados dentro de seus respectivos adaptadores, seletores/filtros de opções suportadas, recipientes informativos dedicados ou badges identificadoras de itens já cadastrados.

---

## 4. Metodologia de Execucao por Fases (Roadmap-Driven)

Para manter previsibilidade, qualidade de codigo e rastreabilidade historica, o desenvolvimento e conduzido sob o seguinte protocolo operacional:

### Escopo e Delimitacao por Sessao

- Cada sessao de chat deve focar exclusivamente em **uma unica fase** descrita no arquivo `docs/ROADMAP.md`.
- Nao devem ser antecipadas tarefas de fases futuras enquanto a fase atual nao for completamente concluida, validada e documentada.

### Ciclo Operacional da Fase

1. **Planejamento:**
    - Analisar os itens da fase vigente no `docs/ROADMAP.md`.
    - Cruzar os requisitos com `docs/ARCHITECTURE.md`, `docs/DATABASE.md` e `README.md` para assegurar conformidade arquitetural e premissas tecnicas.
2. **Implementacao:**
    - Desenvolver componentes, rotas, utilitarios, tipos ou scripts previstos estritamente para o escopo da fase.
    - Manter premissas fundamentais (custo operacional zero, seguranca das chaves, Tailwind CSS v4).
3. **Verificacao e Testes:**
    - Executar checagens estaticas e de integridade (`npx tsc --noEmit`, linters ou testes unitarios cabiveis).
    - Assegurar que o sistema compila sem quebras ou regressoes.
4. **Sincronizacao de Documentacao:**
    - Atualizar `docs/ROADMAP.md`: marcar os checkboxes dos itens finalizados (`[x]`) e atualizar o status da fase na tabela geral (de `Pendente` para `Concluido`).
    - Atualizar a documentacao tecnica (`README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DEPLOYMENT.md`) se novas rotas, tipos, componentes, tabelas ou variaveis de ambiente foram adicionados ou modificados.
5. **Encerramento da Fase:**
    - Apresentar resumo conciso e objetivo das entregas da fase.
    - Confirmar a prontidao para iniciar a fase seguinte em uma nova sessao de chat.

---

## 5. Mapeamento da Estrutura do Repositorio

| Diretorio / Arquivo    | Finalidade Principal                                                                                                                                                                                                                                                              |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/`                | Documentação técnica detalhada (`ARCHITECTURE.md`, `DATABASE.md`, `DEPLOYMENT.md`, `ROADMAP.md`).                                                                                                                                                                                 |
| `scripts/`             | Utilitários operacionais e de automação, incluindo o executor de migrações no deploy (`scripts/migrate.mjs`) e exportador de carga (`scripts/export-seed.mjs`).                                                                                                                      |
| `supabase/`            | Esquema unificado consolidado (`supabase/schema.sql`) e scripts versionados de evolução (`supabase/migrations/`).                                                                                                                                                                 |
| `.agents/`             | Configuração de skills e ferramentas para agentes no projeto (`skills.json`).                                                                                                                                                                                                     |
| `.env.example`         | Template universal de variáveis de ambiente para Vercel e Supabase (com Upstash Redis e migrações opcionais).                                                                                                                                                                       |
| `README.md`            | Apresentação pública, instruções de início rápido e deploy em 1 clique.                                                                                                                                                                                                           |
| `.github/`             | Workflows de CI/CD para GitHub Actions (qualidade de código e migrações Supabase).                                                                                                                                                                                                |
| `public/`              | Arquivos estáticos servidos publicamente e pasta de uploads locais (`public/uploads`).                                                                                                                                                                                            |
| `src/app/`             | App Router: páginas públicas (`/`, `/c/[slug]`, `/v/[slug]`), painel administrativo (`/admin`, `/admin/categories`, `/admin/products`, `/admin/videos`, `/admin/settings`, `/admin/bio-links`, `/admin/metrics`, `/admin/login`), APIs (`/api/admin/upload`, `/api/admin/extract-og`, `/api/cron/check-offers`, `/api/track-click`) e rota de callback (`/auth/callback`). |
| `src/components/`      | Componentes modulares de UI organizados em `public/` (Feed, VideoPlayer, ProductCard, ProductDrawer, Header, CategoryPills, CreatorProfile), `ui/` (CategoryIcon) e `Theme`.                                                                                                                      |
| `src/lib/`             | Utilitários de domínio, parsers de embeds (`lib/embeds/parser.ts`), analytics (`lib/analytics.ts`), cache (`lib/cache/redis.ts`), configurações (`lib/settings.ts`), segurança (`lib/security/`), telemetria, logger e clientes Supabase (`client.ts`, `server.ts`, `admin.ts`, `middleware.ts`).                 |
| `src/middleware.ts`    | Middleware defensivo com as quatro barreiras de segurança (VPN/IP, sessão Supabase, whitelist de e-mail e redirecionamento).                                                                                                                                                      |
| `src/types/`           | Tipos TypeScript compartilhados e definições do banco de dados (`types/database.ts`).                                                                                                                                                                                             |

---

## 6. Comandos Comuns de Desenvolvimento

### Configuração Inicial

```bash
# Copiar arquivo de configuração de ambiente
cp .env.example .env.local

# Instalar dependências do projeto
npm install
```

### Execução Local

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Compilar para produção (executa scripts/migrate.mjs e next build)
npm run build

# Executar a versão compilada em produção
npm run start
```

### Qualidade e Verificação

```bash
# Executar testes unitários automatizados
npm run test

# Executar verificação estática e linter
npm run lint

# Executar verificação de tipos do TypeScript
npx tsc --noEmit
```

### Banco de Dados (Supabase)

O gerenciamento de esquema e migrações do banco de dados opera sob três opções:

1. **Automático no Deploy (Vercel):** Se `DATABASE_URL` estiver configurada, o script `scripts/migrate.mjs` é executado antes do `next build`, descobrindo e aplicando incrementalmente todas as migrações de `supabase/migrations/` e registrando o histórico na tabela `_promocuts_migrations`.
2. **Esquema Consolidado Único:** Para inicialização manual em um único comando no SQL Editor do Supabase, utilize o arquivo idempotente [`supabase/schema.sql`](supabase/schema.sql).
3. **Migrações Incrementais Sequenciais:** Aplicadas manualmente pelo SQL Editor conforme necessário:
   - `supabase/migrations/001_initial_schema.sql` (estrutura inicial, enums, triggers, branding e RLS).
   - `supabase/migrations/002_add_categories.sql` (ajustes e extensões incrementais de categorias).
   - `supabase/migrations/003_add_site_settings.sql` (configurações de marca, cores e personalização).
   - `supabase/migrations/004_multi_store_and_link_monitoring.sql` (tabela de links multi-loja, histórico de preços e monitoramento).
   - `supabase/migrations/005_bio_links_and_analytics.sql` (tabelas de bio links, eventos de cliques, gatilho atômico de incremento e RLS).
   - `supabase/migrations/006_bio_links_customization.sql` (personalização avançada de bio links, fotos de perfil claro/escuro, cartaz da vitrine e widget QR Code).
   - `supabase/migrations/007_brand_social_links.sql` (redes sociais da marca no padrão strategy com controle independente de vitrine e bio).
   - `supabase/migrations/008_flexible_video_platforms.sql` (flexibilização da coluna platform na tabela videos para o padrão strategy de reprodutores de vídeo).


