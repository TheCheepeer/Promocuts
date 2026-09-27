# PromoCuts

> **Agregador open-source de vídeos curtos e links de afiliados de alta conversão, desenhado para custo zero de operação e deploy com 1 clique.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%20e%20e-mail%20do%20administrador&project-name=promocuts&repo-name=promocuts)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)
![License](https://img.shields.io/badge/License-PolyForm_Noncommercial-red?style=flat-square)

---

## Sobre o Projeto

O **PromoCuts** é uma plataforma que conecta vídeos curtos virais (**TikTok, Instagram Reels e YouTube Shorts**) diretamente a produtos recomendados em programas de afiliados (Amazon, Shopee, Mercado Livre, AliExpress e outros).

Foi concebido como uma solução completa de **renda passiva** e um **projeto estruturado de portfólio**, priorizando engenharia de software limpa, segurança rigorosa e despesa zero de infraestrutura.

---

## Principais Recursos

- **Vitrine Pública Mobile-First:** Feed de alta conversão otimizado para navegação rápida por toque, com rolagem fluida (_scroll-snap_) em smartphones e modo de catálogo responsivo no desktop.
- **Feed Geral e Categorização Temática:** Descoberta rápida de reviews por meio de barra de navegação com pílulas ("Todos", "Tecnologia", "Casa & Cozinha", etc.), com alternância imediata de nichos e rotas amigáveis.
- **Embeds Nativos (Zero Custo de Tráfego e Armazenamento):** Nenhum arquivo `.mp4` é armazenado no servidor. Os reprodutores utilizam iframes oficiais do TikTok, Instagram e YouTube, eliminando custos de CDN e armazenamento de vídeo.
- **Cards de Produtos Acoplados:** Cada corte exibe os produtos recomendados com foto, título, preço promocional, lojas parceiras e botões de compra imediatos com tags `rel="noopener noreferrer sponsored"`.
- **Cópia Instantânea de Cupom:** Botão com um toque para copiar códigos promocionais para a área de transferência, acompanhado de feedback tátil e visual.
- **Customização Total de Marca (White-Label):** Controle completo da identidade visual pelo painel `/admin/settings` — troca de cores primárias e secundárias do tema, substituição de logotipo e favicon, definição do nome do site, slogan e metadados de SEO, tudo refletido dinamicamente na vitrine pública sem necessidade de novo deploy.
- **Portabilidade Total e Self-Hosting (Docker):** Sem aprisionamento de fornecedor. Rode em nuvem gratuita ou em VPS própria com Docker Compose, Nginx Gateway (porta 80 com SSL na nuvem), PostgreSQL 18.6, Redis 8 opcional, autenticação SSO e proteção de acesso administrativo isolada por VPN (Tailscale / WireGuard).
- **Painel Administrativo Seguro (`/admin`):** Interface fechada para cadastro ágil de categorias, links e produtos. Acesso restrito exclusivamente ao endereço em `ADMIN_EMAIL` com suporte a Magic Link ou SSO corporativo e bloqueio opcional por faixas de IP de VPN.
- **Banco de Dados Plug and Play:** Script SQL de inicialização em [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) com tabelas indexadas, dados padrão de branding e regras de Row Level Security (RLS) prontas.
- **Métricas Anônimas:** Monitoramento leve de cliques em links de afiliados sem coleta de dados pessoais e sem dependência de serviços externos pagos.

---

## Stack Tecnológica

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Estilização Visual:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Gateway & Proxy Reverso:** [Nginx](https://nginx.org/) (Porta 80 com SSL gerenciado na nuvem)
- **Banco de Dados Relacional:** [PostgreSQL 18.6](https://www.postgresql.org/) / [Supabase](https://supabase.com/)
- **Autenticação:** Supabase Auth (Magic Link) ou Single Sign-On (Google, GitHub, OIDC)
- **Cache & Rate Limiting:** [Redis 8](https://redis.io/) (Upstash Serverless ou Docker Alpine)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Hospedagem & Deploy:** [Vercel](https://vercel.com/) (100% Free Tier) ou Contêineres Docker (VPS / Homelab)

---

## Documentação Técnica

Para entender a arquitetura em detalhes, consulte a documentação dedicada na pasta [`docs/`](docs/):

- [**Arquitetura do Sistema**](docs/ARCHITECTURE.md): Estrutura de software, motor de embeds nativos, sistema de customização visual, modelo de segurança e contêineres.
- [**Modelagem de Dados**](docs/DATABASE.md): Diagrama Entidade-Relacionamento, dicionário de campos e políticas de Row Level Security.
- [**Guia de Implantação e Deploy**](docs/DEPLOYMENT.md): Passo a passo para subir na Vercel com Supabase ou com Docker Compose e PostgreSQL 18.6.

---

## Opções de Implantação

### Opção 1: Deploy na Vercel (1 Clique — Custo Zero)

1. Clique no botão abaixo:

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%20e%20e-mail%20do%20administrador&project-name=promocuts&repo-name=promocuts)

2. Conecte sua conta do GitHub e preencha as variáveis de ambiente solicitadas.
3. Clique em **Deploy**. Sua aplicação estará em produção em cerca de 2 minutos.

### Opção 2: Deploy com Docker Compose (Self-Hosted / VPS)

1. Clone o repositório e crie o arquivo de ambiente:
    ```bash
    git clone https://github.com/TheCheepeer/Promocuts.git
    cd Promocuts
    cp .env.example .env
    ```
2. Edite o `.env` informando seu `ADMIN_EMAIL`, chave `AUTH_SECRET` e senhas do PostgreSQL 18.6.
3. Inicie os serviços com um único comando:
    ```bash
    docker compose up -d
    ```
    O contêiner `postgres:18.6-alpine` aplicará as migrações automaticamente no primeiro boot e a aplicação estará acessível através do Nginx Gateway na porta `80`. Todos os serviços internos permanecem isolados na rede privada do Docker.

---

## Início Rápido (Desenvolvimento Local)

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 20 ou superior
- Instância do Supabase ou Docker com PostgreSQL 18.6

### 1. Clonar o repositório

```bash
git clone https://github.com/TheCheepeer/Promocuts.git
cd Promocuts
```

### 2. Configurar as variáveis de ambiente

Copie o modelo de variáveis:

```bash
cp .env.example .env.local
```

Edite `.env.local` com as configurações do seu banco e `ADMIN_EMAIL`.

### 3. Instalar dependências e rodar o servidor

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador para ver a vitrine pública ou acesse [http://localhost:3000/admin](http://localhost:3000/admin) para entrar no painel administrativo.

---

## Licença

Este projeto é distribuído sob os termos da licença **PolyForm Noncommercial License 1.0.0**.

- **Permitido:** Uso pessoal, estudo, experimentação e modificações no código.
- **Proibido:** Venda direta, redistribuição comercial ou empacotamento deste software como um produto pago fechado.

Consulte o arquivo [`LICENSE`](LICENSE) para ler o texto integral da licença.
