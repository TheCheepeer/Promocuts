# Guia de Implantação e Deploy — PromoCuts

Este guia detalha os dois caminhos suportados para colocar o **PromoCuts** em produção:

1. **Opção A (Nuvem Serverless — 100% Gratuito):** Deploy com 1 clique na Vercel utilizando Supabase Cloud e Upstash Redis opcional.
2. **Opção B (Self-Hosted / Docker):** Execução independente em servidor ou VPS própria com contêineres Docker, PostgreSQL 18.6, Redis, Single Sign-On (SSO) e isolamento de acesso via VPN.

---

## Opção A: Nuvem Serverless (Vercel + Supabase)

### 1. Visão Geral da Infraestrutura Gratuita

| Serviço      | Função                                      | Limites do Plano Gratuito                           |    Custo    |
| :----------- | :------------------------------------------ | :-------------------------------------------------- | :---------: |
| **Vercel**   | Hospedagem Next.js, Edge Functions e CDN    | 100 GB de largura de banda/mês, builds ilimitados   | **R$ 0,00** |
| **Supabase** | Banco PostgreSQL e Autenticação de Usuários | 500 MB de armazenamento, 50.000 usuários ativos/mês | **R$ 0,00** |
| **Upstash**  | Redis Serverless (Rate Limit e Cache)       | 10.000 comandos diários (opcional)                  | **R$ 0,00** |
| **Embeds**   | Hospedagem e tráfego de vídeo dos cortes    | Tráfego absorvido por TikTok, Instagram e YouTube   | **R$ 0,00** |

### 2. Passo 1: Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita.
2. Clique em **New Project**, defina o nome e uma senha forte. Escolha a região mais próxima do seu público (`sa-east-1` para São Paulo).
3. No menu lateral, acesse **SQL Editor**.
4. Abra o arquivo local [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql), cole o conteúdo e execute clicando em **Run**.
5. Em **Authentication** > **URL Configuration**, cadastre seu domínio de produção no campo **Site URL** e adicione a URL de callback em **Redirect URLs**:
    ```text
    https://seu-dominio.vercel.app/api/auth/callback
    ```

### 3. Passo 2: Coletar as Chaves de Conexão

No painel do Supabase, acesse **Project Settings** > **API** e anote:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Passo 3: Deploy na Vercel

Inicie o deploy clicando no botão abaixo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%20e%20e-mail%20do%20administrador&project-name=promocuts&repo-name=promocuts)

Preencha as variáveis de ambiente solicitadas pelo assistente e conclua a criação do projeto.

### 5. Passo 4: Automação CI/CD no GitHub Actions (Opcional)

O repositório possui fluxos de integração e entrega contínua pré-configurados em `.github/workflows/`:

1. **Qualidade de Código (`ci.yml`):**
    - Executado automaticamente a cada `push` e `pull_request` na branch `main`.
    - Executa checagem de tipos estrita (`tsc --noEmit`) e linter. Não requer nenhuma variável secreta.

2. **Deploy Automático de Migrações (`migrations.yml`):**
    - Executado quando arquivos da pasta `supabase/migrations/` forem modificados na branch `main`.
    - Para habilitar no seu repositório GitHub, adicione os segredos em **Settings > Secrets and variables > Actions**:
        - `SUPABASE_PROJECT_ID`: ID do projeto no Supabase (ex: `jxblaxfwbiijkdwnneqw`).
        - `SUPABASE_DB_PASSWORD`: Senha do banco PostgreSQL definida na criação.
        - `SUPABASE_ACCESS_TOKEN`: Token pessoal gerado em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
    - **Cláusula Defensiva:** Caso os segredos não estejam configurados (como em forks de terceiros ou deploys rápidos de clientes), o fluxo é ignorado de forma limpa, sem gerar falhas de build.

---

## Opção B: Self-Hosted com Docker (PostgreSQL 18.6, SSO e VPN)

Esta modalidade oferece soberania total sobre a infraestrutura, permitindo rodar a aplicação em VPS (Hetzner, DigitalOcean, Linode), servidores dedicados ou homelab doméstico.

### 1. Pré-requisitos do Servidor

- Sistema operacional Linux (Ubuntu 22.04 LTS ou superior recomendado).
- [Docker](https://docs.docker.com/engine/install/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados.
- Porta 80/443 liberada (ou uso de túnel privado).

### 2. Passo a Passo de Instalação

#### 1. Clonar o repositório no servidor

```bash
git clone https://github.com/TheCheepeer/Promocuts.git
cd Promocuts
```

#### 2. Configurar o arquivo de variáveis de ambiente

Copie o template de ambiente Docker para `.env`:

```bash
cp .env.example.docker .env
```

Edite o arquivo `.env` ajustando os parâmetros:

```env
# E-mail com permissao administrativa
ADMIN_EMAIL=seu-email@dominio.com

# URL publica ou interna do sistema
NEXT_PUBLIC_APP_URL=https://promocuts.seu-dominio.com

# Chave secreta de sessao (gerar com: openssl rand -base64 32)
AUTH_SECRET=sua-chave-criptografica-aleatoria

# Modo de desenvolvimento e depuracao de logs (true ou false)
IS_DEV=false

# Credenciais do PostgreSQL 18.6 (Apenas rede interna backend)
POSTGRES_DB=promocuts
POSTGRES_USER=promocuts_user
POSTGRES_PASSWORD=senha-super-segura-do-banco

# Cache e Rate Limiting via Redis (100% Opcional)
# O sistema funciona plenamente sem Redis tanto na Vercel quanto no Docker.
# Se desejar habilitar no Docker com autenticacao segura por senha:
# REDIS_PASSWORD=senha-super-segura-do-redis
```

#### 3. Configurar Single Sign-On (SSO) no Painel `/admin` (Opcional)

Para habilitar autenticação com Google Workspace, GitHub ou OIDC corporativo:

```env
SSO_PROVIDER=google
SSO_CLIENT_ID=seu-client-id.apps.googleusercontent.com
SSO_CLIENT_SECRET=seu-client-secret
```

_Regra de segurança:_ Mesmo com o SSO ativado, apenas a conta com o e-mail exato definido em `ADMIN_EMAIL` terá o acesso liberado ao painel `/admin`. Qualquer outro usuário do provedor receberá 403 Forbidden.

#### 4. Configurar Acesso Exclusivo por VPN (Opcional)

Para blindar o painel administrativo contra a internet aberta, defina as faixas de IP da sua VPN no arquivo `.env`:

```env
# Exemplo para Tailscale (100.64.0.0/10) e WireGuard / Rede Interna (10.0.0.0/8):
ADMIN_ALLOWED_IPS=100.64.0.0/10,10.0.0.0/8,127.0.0.1
```

Quando configurado, qualquer requisição para a rota `/admin/*` originada fora dessas faixas de rede é descartada instantaneamente com código HTTP 403 Forbidden.

#### 5. Iniciar os Contêineres

Suba todos os serviços em segundo plano:

```bash
docker compose up -d
```

O comando irá:

1. Compilar a imagem da aplicação Next.js Standalone com hardening de permissões e healthcheck.
2. Iniciar o contêiner `postgres:18.6-alpine` na rede interna privada (`backend-network`, marcada como `internal: true`) aplicando automaticamente os scripts SQL em `supabase/migrations/`.
3. Iniciar o contêiner `redis:8-alpine` na rede interna privada (serviço 100% opcional, com autenticação por senha se configurado).
4. Iniciar o contêiner `promocuts-nginx` na rede pública (`frontend-network`), atuando como ponto único de entrada na porta `80` com cabeçalhos de segurança e rate limiting ativo. O Nginx não possui rota de rede para o banco de dados nem para o Redis, garantindo defesa em profundidade.

Para verificar a saúde dos serviços:

```bash
docker compose ps
docker compose logs -f app
```

---

## Atualizações e Manutenção

### No Modelo Nuvem (Vercel)

- Atualizações de código são aplicadas automaticamente a cada _push_ no branch principal do GitHub.
- Novas migrações SQL devem ser executadas no SQL Editor do Supabase.

### No Modelo Docker

Para atualizar a aplicação e migrações no servidor:

```bash
git pull origin main
docker compose build --no-cache app
docker compose up -d
```
