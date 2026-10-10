# Guia de Implantação e Deploy — PromoCuts

Este guia detalha o processo para colocar o **PromoCuts** em produção utilizando a arquitetura recomendada: **100% plug-and-play, de custo zero e orientada a Serverless** (Vercel + Supabase Cloud + Upstash Redis).

---

## 1. Visão Geral da Infraestrutura Gratuita

| Serviço | Função | Limites do Plano Gratuito | Custo |
| :--- | :--- | :--- | :---: |
| **Vercel** | Hospedagem Next.js, Edge Functions e CDN | 100 GB de largura de banda/mês, builds ilimitados | **R$ 0,00** |
| **Supabase** | Banco PostgreSQL e Autenticação de Usuários | 500 MB de armazenamento, 50.000 usuários ativos/mês | **R$ 0,00** |
| **Upstash** | Redis Serverless (Cache REST em Memória) | 10.000 comandos diários (opcional) | **R$ 0,00** |
| **Embeds** | Hospedagem e tráfego de vídeo dos cortes | Tráfego absorvido por TikTok, Instagram e YouTube | **R$ 0,00** |

---

## 2. Passo a Passo de Implantação

### Passo 1: Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project**, defina o nome e uma senha forte. Escolha a região mais próxima do seu público (`sa-east-1` para São Paulo).
3. No menu lateral, acesse **SQL Editor**.
4. Abra o arquivo local [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql), cole o conteúdo e execute clicando em **Run**. Em seguida, aplique incrementalmente [`supabase/migrations/002_add_categories.sql`](../supabase/migrations/002_add_categories.sql) e [`supabase/migrations/003_add_site_settings.sql`](../supabase/migrations/003_add_site_settings.sql).
5. Em **Authentication** > **URL Configuration**, cadastre seu domínio de produção no campo **Site URL** e adicione as URLs de callback em **Redirect URLs**:
    ```text
    http://localhost:3000/auth/callback
    https://seu-dominio.vercel.app/auth/callback
    ```
6. Em **Storage** (opcional para upload em nuvem), crie um bucket público com o nome `site-assets` para hospedar logotipos e favicons personalizados enviados pelo painel `/admin/settings`. Caso prefira, o sistema também aceita URLs externas diretas de CDNs ou armazenamento local automático.

### Passo 2: Coletar as Chaves do Supabase

No painel do Supabase, acesse **Project Settings** > **API** e copie:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`

### Passo 3: Configurar o Upstash Redis (Opcional — Alta Performance)

Para ativar o cache em memória ultra-rápido (respostas da vitrine pública em menos de 5 ms):

1. Acesse [upstash.com](https://upstash.com) e crie uma conta gratuita.
2. Crie uma nova base de dados Redis selecionando a região compatível (ex: São Paulo ou US-East).
3. Na aba **Details** do banco, localize a seção **REST API** e copie:
   * `UPSTASH_REDIS_REST_URL`
   * `UPSTASH_REDIS_REST_TOKEN`

> [!NOTE]
> O módulo de cache do PromoCuts possui degradação graciosa (*graceful degradation*). Se você optar por não cadastrar as chaves do Upstash, a aplicação continuará funcionando perfeitamente através de consultas diretas ao Supabase.

### Passo 4: Deploy com 1 Clique na Vercel

Inicie o deploy clicando no botão abaixo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%20e%20e-mail%20do%20administrador&project-name=promocuts&repo-name=promocuts)

1. Conecte sua conta do GitHub.
2. Preencha as variáveis de ambiente solicitadas pelo assistente:
   * `ADMIN_EMAIL`: Seu e-mail autorizado para acesso exclusivo ao `/admin`.
   * `NEXT_PUBLIC_SUPABASE_URL`: URL da API do seu Supabase.
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública do Supabase.
   * `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta de serviço do Supabase.
   * `NEXT_PUBLIC_APP_URL`: URL base da aplicação (ex: `https://seu-projeto.vercel.app`).
   * `AUTH_SECRET`: Segredo criptográfico de 32 bytes (gerar com `openssl rand -base64 32`).
   * `UPSTASH_REDIS_REST_URL`: *(Opcional)* URL da API REST do Upstash.
   * `UPSTASH_REDIS_REST_TOKEN`: *(Opcional)* Token de autenticação da API REST do Upstash.
3. Clique em **Deploy**. Sua vitrine estará ativa e em produção em cerca de 2 minutos.

---

## 3. Automação CI/CD no GitHub Actions (Opcional)

O repositório possui fluxos de integração e entrega contínua pré-configurados em `.github/workflows/`:

1. **Qualidade de Código (`ci.yml`):**
    * Executado automaticamente a cada `push` e `pull_request` na branch `main`.
    * Executa checagem de tipos estrita (`tsc --noEmit`) e linter. Não requer segredos configurados.

2. **Deploy Automático de Migrações (`migrations.yml`):**
    * Executado quando arquivos da pasta `supabase/migrations/` forem modificados na branch `main`.
    * Para habilitar no seu repositório GitHub, adicione os segredos em **Settings > Secrets and variables > Actions**:
        * `SUPABASE_PROJECT_ID`: ID do projeto no Supabase (ex: `jxblaxfwbiijkdwnneqw`).
        * `SUPABASE_DB_PASSWORD`: Senha do banco PostgreSQL definida na criação.
        * `SUPABASE_ACCESS_TOKEN`: Token pessoal gerado em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).

---

## 4. Atualizações e Manutenção

* **Atualizações de código:** São aplicadas automaticamente a cada _push_ na branch `main` do GitHub pela integração nativa da Vercel.
* **Novas migrações SQL:** Devem ser aplicadas via SQL Editor do painel do Supabase ou automaticamente via GitHub Actions.
