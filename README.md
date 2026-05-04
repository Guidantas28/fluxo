# Fluxo+

Aplicação web para **MEIs e pequenos comércios**: produtos, clientes, vendas com baixa de estoque, relatórios, alertas de estoque baixo e usuários com perfis **Admin** e **Operador**.

Stack: **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth + Postgres + RLS).

---

## Executar a aplicação no seu computador

Siga a ordem abaixo. Tudo roda em **localhost**; o banco e a autenticação ficam no **Supabase** (nuvem).

### Pré-requisitos

| Ferramenta | Observação |
|------------|------------|
| **Git** | Para clonar o repositório. |
| **Node.js** | Use **20 LTS** ou superior (recomendado **20.9+** ou **22**), com **npm** incluso. Confira: `node -v` e `npm -v`. |
| **Conta Supabase** | Gratuita em [supabase.com](https://supabase.com). Você vai criar um projeto e colar URL/chaves no `.env.local`. |

Não é necessário instalar Postgres localmente: o app usa o Postgres do projeto Supabase.

### 1. Obter o código

```bash
git clone <URL_DO_REPOSITORIO>.git
cd fluxo
```

(Substitua `<URL_DO_REPOSITORIO>` pela URL HTTPS ou SSH do seu fork ou repositório oficial.)

### 2. Instalar dependências

Na pasta raiz do projeto (onde está o `package.json`):

```bash
npm install
```

Aguarde o fim da instalação. Se aparecer aviso de *lockfile* ou *peer dependencies*, em geral pode seguir; em caso de erro, apague `node_modules` e rode `npm install` de novo.

### 3. Criar o projeto no Supabase e aplicar o schema

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie um **novo projeto** (nome, senha do banco e região à sua escolha). Espere o provisionamento terminar.
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Abra no seu computador o arquivo **`supabase/schema.sql`** deste repositório, copie **todo** o conteúdo, cole no editor e execute (**Run**). Deve concluir sem erro (tabelas, triggers, RLS, funções `finalize_sale` / `cancel_sale`, etc.).
4. *(Opcional)* No **SQL Editor**, você pode executar trechos de **`supabase/seed.sql`** se quiser dados de exemplo (leia os comentários no arquivo antes).

O schema cria a tabela **`public.profiles`** e o trigger que, ao criar um usuário em **`auth.users`**, insere a linha correspondente em **`profiles`** (papel padrão **operador**).

### 4. Variáveis de ambiente

1. Na raiz do projeto, copie o exemplo:

   ```bash
   cp .env.local.example .env.local
   ```

   No **Windows** (PowerShell ou CMD), se `cp` não existir:

   ```bash
   copy .env.local.example .env.local
   ```

2. No painel Supabase: **Project Settings** (ícone de engrenagem) → **API**.
3. Preencha o arquivo **`.env.local`** (nunca commite este arquivo; ele já está no `.gitignore`):

| Variável | Onde obter | Uso |
|----------|------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** em API | Obrigatória. URL do projeto. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon public** em API | Obrigatória. Chave pública para o browser e rotas seguras com RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** em API (revelar com cuidado) | Opcional para uso básico; **obrigatória** apenas se for usar a tela **Equipe** para criar usuários pela API (`POST /api/admin/users`). **Não** exponha em repositório público nem no frontend. |

Salve o arquivo. Sem `NEXT_PUBLIC_*` válidas, o app sobe, mas o fluxo de login/sessão não funciona de forma útil (o proxy tende a redirecionar para `/login`).

### 5. Autenticação e e-mail (desenvolvimento)

- **Confirmação de e-mail**: em **Authentication** → **Providers** → **Email**, desative temporariamente *Confirm email* se quiser cadastrar e entrar sem abrir o link de confirmação durante os testes.
- **Cadastro pela aplicação**: existe rota pública **`/cadastro`**, que cria usuário como **operador** (metadata). Depois um admin pode alterar o papel no banco ou você promove o primeiro usuário via SQL (próximo passo).

### 6. Primeiro usuário e administrador

Você precisa de **pelo menos um** usuário em **Authentication → Users** (convite pelo dashboard, ou cadastro em `/cadastro`, ou criação manual).

O UUID do usuário aparece na lista de usuários do Auth ou em **Table Editor** → `auth.users`.

Torne esse usuário **administrador** executando no **SQL Editor** (troque o UUID):

```sql
update public.profiles
set role = 'admin', full_name = 'Administrador'
where id = 'COLE_AQUI_O_UUID_DO_AUTH_USERS';
```

Sem essa linha, o usuário permanece **operador** (válido para quase tudo, exceto gestão de usuários e algumas exclusões).

### 7. Subir o servidor de desenvolvimento

Na raiz do projeto:

```bash
npm run dev
```

Abra o navegador em **[http://localhost:3000](http://localhost:3000)**.

- A raiz `/` redireciona para **`/dashboard`** se estiver logado, ou fluxo de auth conforme o proxy.
- Faça login em **`/login`**. Se criou conta em **`/cadastro`**, use o mesmo e-mail e senha.

Para parar o servidor: no terminal, **Ctrl+C**.

### 8. Conferência rápida

| Passo | Resultado esperado |
|--------|---------------------|
| `npm install` | Sem erros fatais. |
| `schema.sql` no Supabase | Tabelas `products`, `clients`, `sales`, `profiles`, etc. |
| `.env.local` preenchido | Login carrega; após entrar, dashboard acessível. |
| Admin no SQL | Menu **Equipe** (`/users`) e criação de usuários via API, se configurou `SUPABASE_SERVICE_ROLE_KEY`. |

### 9. Build e execução “tipo produção” na máquina

```bash
npm run build
npm run start
```

Por padrão o servidor de produção local usa a porta **3000** (a menos que defina `PORT` no ambiente).

### 10. Problemas comuns

| Sintoma | O que verificar |
|---------|------------------|
| Erro ao instalar pacotes | Versão do Node (20+). Limpar `node_modules` e `package-lock.json` só em último caso. |
| Login não funciona / sessão estranha | `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` corretas, sem aspas extras ou espaços. Reinicie `npm run dev` após alterar `.env.local`. |
| “relation does not exist” ou erro de RLS | `schema.sql` foi executado por completo no projeto certo? |
| Cadastro não envia e-mail | Desative confirmação de e-mail em dev (passo 5) ou use o link recebido. |
| Porta 3000 em uso | `npx kill-port 3000` ou rode `PORT=3001 npm run dev` (Unix). No Windows PowerShell: `$env:PORT=3001; npm run dev`. |
| Tela Equipe / criar usuário falha | Defina `SUPABASE_SERVICE_ROLE_KEY` no `.env.local` e reinicie o servidor. |

### 11. Lint

```bash
npm run lint
```

---

## Arquitetura (resumo)

- **`src/app/(main)/`**: área autenticada (layout com sidebar + `AppShell` que valida sessão e perfil).
- **`src/app/login/`** e **`/cadastro`**: autenticação (Supabase Auth).
- **`src/lib/supabase/`**: clientes browser e servidor (`@supabase/ssr`).
- **`src/lib/auth/`**: leitura do perfil (`profiles`) e checagem de admin.
- **`src/components/`**: UI reutilizável e shell (sidebar, topbar).
- **`src/proxy.ts`**: renovação de sessão e bloqueio de rotas privadas (Next.js 16+).
- **`supabase/schema.sql`**: modelo completo, triggers, RLS e funções `finalize_sale` / `cancel_sale`.

## Regras de negócio no banco

- **RN01 / RN02**: `finalize_sale` valida estoque e baixa dentro da mesma transação.
- **RN03**: `cancel_sale` estorna estoque em vendas **concluídas** (somente **admin**); rascunhos podem ser cancelados pelo dono ou admin.
- **RN04**: estoque baixo = `control_stock` e `stock_quantity <= minimum_stock` (filtro na UI).
- **RN05**: relatórios usam apenas vendas com `status = 'completed'`.

## Perfis

| | Admin | Operador |
|---|--------|----------|
| Produtos (CRUD / excluir) | sim | só leitura |
| Clientes | sim | sim |
| Vendas | sim | sim |
| Relatórios | sim | sim |
| Estoque baixo | sim | sim |
| Usuários | sim | não |

## API administrativa

- **`POST /api/admin/users`**: cria usuário no Auth + perfil (exige `SUPABASE_SERVICE_ROLE_KEY` e sessão admin).

## Comandos

| Comando | Descrição |
|--------|------------|
| `npm run dev` | Desenvolvimento (hot reload). |
| `npm run build` | Build de produção. |
| `npm run start` | Servidor após `build`. |
| `npm run lint` | ESLint. |

## Notas

- Se o SQL do Supabase reclamar da sintaxe do trigger (`execute function`), troque para `execute procedure` conforme a versão do Postgres do projeto.
- Rascunhos de venda são reutilizados na mesma aba via `sessionStorage` (`fluxo-draft-sale-id`) para reduzir lixo; use **Descartar rascunho** para cancelar.
