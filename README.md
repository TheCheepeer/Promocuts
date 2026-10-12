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
- **Cards de Produtos Acoplados & Suporte Multi-Loja:** Cada corte exibe os produtos recomendados com comparador de lojas parceiras (Amazon, Shopee, Mercado Livre, AliExpress, etc.), permitindo que o visitante compare preços e cupons em tempo real antes de comprar.
- **Hub Central do Criador (Bio Links & Streamers):** Perfil retrátil e página pública dedicada (`/links` e `/bio`) inspirada no Linktree com cartaz de conversão para a vitrine, QR Code determinístico em SVG puro, crachás dinâmicos ("AO VIVO", "VIP", "DESCONTO") com efeito pulsante e ordenação instantânea.
- **Gerenciador de Redes Sociais no Padrão Strategy (`/admin/social`):** Gestão visual com mais de 30 plataformas populares (YouTube, TikTok, Twitch, Kick, Instagram, Reddit, Bluesky, Spotify, YouTube Music, PIX, etc.), autodetecção inteligente de URLs, combobox com autocompletar em tempo real, vetores canônicos oficiais (Simple Icons 24x24 px) e controle granular e independente de exibição no cabeçalho da vitrine e no perfil de bio links.
- **Autopreenchimento Inteligente de Produtos e Cortes:** Extração instantânea de metadados para produtos (título, foto, loja e preço sugerido) e para cortes de vídeo (captura automática de título e miniatura a partir do TikTok, YouTube Shorts e Instagram Reels), com opção de upload direto de miniaturas personalizadas (PNG, JPG, WebP) e proteção ativa contra ataques de SSRF.
- **Monitoramento Automatizado de Ofertas (Vercel Cron Job):** Auditoria diária de integridade em segundo plano que identifica links quebrados ou produtos esgotados (códigos 404/410) e sinaliza alertas no painel para revisão proativa do administrador.
- **Cópia Instantânea de Cupom:** Botão com um toque para copiar códigos promocionais para a área de transferência, acompanhado de feedback tátil e visual.
- **Customização Total de Marca (White-Label) & Modo Claro/Escuro:** Suporte nativo a modo claro e escuro (baseado no sistema com botão de alternância manual e persistência em cache), paleta de cores primária e secundária independentes para cada modo de visualização, controle completo de logotipo, favicon, slogan e metadados de SEO pelo painel `/admin/settings`, tudo refletido dinamicamente na vitrine pública sem necessidade de novo deploy.
- **Performance Extrema com Cache Serverless (Upstash Redis):** Integração nativa e resiliente com o Upstash Redis via HTTP/REST, entregando respostas da vitrine pública em milissegundos sem a complexidade de manter contêineres ou servidores dedicados.
- **Painel Administrativo Seguro (`/admin`):** Interface fechada para gestão de categorias, vídeos, produtos, bio links, redes sociais e configurações. Acesso restrito exclusivamente ao endereço em `ADMIN_EMAIL` com validação de sessão por Magic Link e bloqueio opcional por faixas de IP de VPN.
- **Dashboard Visual de Métricas e Conversão (`/admin/metrics`):** Visão analítica completa com gráficos vetoriais nativos em SVG (zero bibliotecas externas e custo zero), indicadores de saída para lojas parceiras, origens de tráfego, filtros por período e rankings de engajamento.
- **Banco de Dados Plug and Play:** Scripts SQL versionados em `supabase/migrations/` com tabelas indexadas, dados padrão de branding e regras de Row Level Security (RLS) prontas.
- **Métricas Anônimas e Telemetria:** Monitoramento leve de cliques em links de afiliados e bio links discriminando loja e plataforma específica, sem coleta de dados pessoais e sem dependência de serviços externos pagos.

---

## Stack Tecnológica

- **Framework Web:** [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Estilização Visual:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Banco de Dados Relacional:** [Supabase](https://supabase.com/) (PostgreSQL 17 com Row Level Security)
- **Autenticação:** Supabase Auth (Magic Link seguro)
- **Cache em Memória:** [Upstash Redis](https://upstash.com/) (Serverless REST via `@upstash/redis`)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Hospedagem & Deploy:** [Vercel](https://vercel.com/) (100% Free Tier)

---

## Documentação Técnica

Para entender a arquitetura em detalhes, consulte a documentação dedicada na pasta [`docs/`](docs/):

- [**Arquitetura do Sistema**](docs/ARCHITECTURE.md): Estrutura de software, motor de embeds nativos, sistema de customização visual, modelo de segurança e cache serverless.
- [**Modelagem de Dados**](docs/DATABASE.md): Diagrama Entidade-Relacionamento, dicionário de campos e políticas de Row Level Security.
- [**Guia de Implantação e Deploy**](docs/DEPLOYMENT.md): Passo a passo para subir na Vercel com Supabase e Upstash Redis.
- [**Roadmap de Desenvolvimento**](docs/ROADMAP.md): Acompanhamento das fases de desenvolvimento, tarefas e status de implementação.

---

## Implantação na Nuvem (1 Clique — Custo Zero)

1. Clique no botão abaixo para criar seu projeto diretamente na Vercel:

    [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL,DATABASE_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%2C%20e-mail%20do%20administrador%20e%20migracoes%20automaticas&project-name=promocuts&repo-name=promocuts)

2. Conecte sua conta do GitHub e preencha as variáveis de ambiente solicitadas (incluindo a `DATABASE_URL` para provisionamento automático do banco).
3. Clique em **Deploy**. As migrações do banco de dados serão aplicadas automaticamente e sua aplicação estará em produção em cerca de 2 minutos.
4. *(Opcional)* Para ativar o cache em memória ultra-rápido, adicione a integração do Upstash Redis no painel da Vercel ou cadastre as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.


---

## Início Rápido (Desenvolvimento Local)

### Pré-requisitos

- [Node.js](https://nodejs.org/) versão 20 ou superior
- Conta gratuita no [Supabase](https://supabase.com/)

### 1. Clonar o repositório

```bash
git clone https://github.com/TheCheepeer/Promocuts.git
cd Promocuts
```

### 2. Configurar as variáveis de ambiente

Copie o modelo de variáveis de ambiente:

```bash
cp .env.example .env.local
```

Edite `.env.local` informando as chaves do seu projeto Supabase e seu `ADMIN_EMAIL`. Para ativar logs detalhados e diagnósticos durante o desenvolvimento local, defina `IS_DEV=true`.

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
