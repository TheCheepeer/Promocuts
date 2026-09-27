# Guia de Deploy Zero Custo — PromoCuts

Este guia orienta o processo completo para colocar o **PromoCuts** em produção sem custos financeiros, utilizando exclusivamente os planos gratuitos da **Vercel** e do **Supabase**.

---

## 1. Visão Geral da Infraestrutura Gratuita

| Serviço      | Função                                      | Limites do Plano Gratuito                           |    Custo    |
| :----------- | :------------------------------------------ | :-------------------------------------------------- | :---------: |
| **Vercel**   | Hospedagem Next.js, Edge Functions e CDN    | 100 GB de largura de banda/mês, builds ilimitados   | **R$ 0,00** |
| **Supabase** | Banco PostgreSQL e Autenticação de Usuários | 500 MB de armazenamento, 50.000 usuários ativos/mês | **R$ 0,00** |
| **Embeds**   | Hospedagem e tráfego de vídeo dos cortes    | Tráfego absorvido por TikTok, Instagram e YouTube   | **R$ 0,00** |

---

## 2. Passo 1: Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e entre com sua conta (ou crie uma gratuitamente via GitHub).
2. Clique em **New Project** (Novo Projeto).
3. Preencha o nome do projeto (exemplo: `promocuts-prod`) e defina uma senha forte para o banco de dados.
4. Escolha a região mais próxima do seu público (para o Brasil, selecione `sa-east-1 (São Paulo)`).
5. Clique em **Create new project** e aguarde cerca de dois minutos enquanto o banco é provisionado.

### Aplicar as Tabelas e Segurança

1. No menu lateral do Supabase, clique em **SQL Editor**.
2. Clique em **New Query** (Nova Consulta).
3. Copie o conteúdo completo do arquivo [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql).
4. Cole no editor e clique no botão **Run**. O resultado exibirá `Success. No rows returned`.

### Configurar Redirecionamento de Autenticação

1. No menu lateral, acesse **Authentication** > **URL Configuration**.
2. No campo **Site URL**, informe o domínio da sua aplicação (exemplo: `https://meu-promocuts.vercel.app` ou `http://localhost:3000` em testes locais).
3. Na seção **Redirect URLs**, adicione a URL de callback:
    ```
    https://meu-promocuts.vercel.app/api/auth/callback
    ```
4. Salve as alterações.

---

## 3. Passo 2: Coletar as Chaves de Conexão

No painel do Supabase, acesse **Project Settings** (ícone de engrenagem) > **API**:

Copie os três valores indicados abaixo:

- **Project URL:** Salve como `NEXT_PUBLIC_SUPABASE_URL`
- **Project API Keys (`anon` / `public`):** Salve como `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Project API Keys (`service_role` / `secret`):** Salve como `SUPABASE_SERVICE_ROLE_KEY` _(nunca compartilhe publicamente)_

---

## 4. Passo 3: Deploy com 1 Clique na Vercel

Você pode iniciar o deploy imediatamente clicando no botão abaixo:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FTheCheepeer%2FPromocuts&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,ADMIN_EMAIL,NEXT_PUBLIC_APP_URL&envDescription=Variaveis%20de%20conexao%20do%20Supabase%20e%20e-mail%20do%20administrador&project-name=promocuts&repo-name=promocuts)

### Preenchimento das Variáveis no Assistente da Vercel:

Ao ser redirecionado para a Vercel, o assistente solicitará cinco variáveis de ambiente:

| Variável                        | Exemplo de Valor                 | Descrição                             |
| :------------------------------ | :------------------------------- | :------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xyzcompany.supabase.co` | URL do seu projeto no Supabase        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...`                  | Chave pública anônima do Supabase     |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhbGciOi...`                  | Chave secreta de serviço do Supabase  |
| `ADMIN_EMAIL`                   | `seu-email@gmail.com`            | E-mail exclusivo do dono da instância |
| `NEXT_PUBLIC_APP_URL`           | `https://promocuts.vercel.app`   | URL de produção gerada pela Vercel    |

Clique em **Deploy** e aguarde cerca de um a dois minutos até a conclusão da compilação.

---

## 5. Passo 4: Primeiro Acesso ao Painel Administrativo

1. Acesse `https://seu-dominio.vercel.app/admin`.
2. O sistema solicitará o seu e-mail.
3. Digite exatamente o mesmo endereço configurado na variável `ADMIN_EMAIL`.
4. Você receberá um _Magic Link_ seguro em sua caixa de entrada.
5. Ao clicar no link, sua sessão será autenticada e você entrará no painel `/admin` para cadastrar seus primeiros vídeos e produtos parceiros.

---

## 6. Passo 5: Atualizações e Manutenção

- Quando novas funcionalidades forem adicionadas ao repositório no GitHub, a Vercel executará um novo deploy automaticamente.
- Caso haja novas migrations no diretório `supabase/migrations/`, basta executar as novas instruções no SQL Editor do Supabase.
