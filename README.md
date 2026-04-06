# Fluxo+

Aplicação web para **MEIs e pequenos comércios**: produtos, clientes, vendas com baixa de estoque, relatórios, alertas de estoque baixo e usuários com perfis **Admin** e **Operador**.

Stack: **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth + Postgres + RLS).

## Arquitetura (resumo)

- **`src/app/(main)/`**: área autenticada (layout com sidebar + `AppShell` que valida sessão e perfil).
- **`src/app/login/`**: login (Supabase Auth).
- **`src/lib/supabase/`**: clientes browser e servidor (`@supabase/ssr`).
- **`src/lib/auth/`**: leitura do perfil (`profiles`) e checagem de admin.
- **`src/components/`**: UI reutilizável e shell (sidebar, topbar).
- **`src/proxy.ts`** (Next.js 16+): renovação de sessão e bloqueio de rotas privadas (substitui o antigo `middleware.ts` no Edge).
- **`supabase/schema.sql`**: modelo completo, triggers, RLS e funções `finalize_sale` / `cancel_sale`.

## Banco de dados (Supabase)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o arquivo **`supabase/schema.sql`** inteiro.
3. Crie o primeiro usuário em **Authentication → Users** (ou pela página de cadastro do Supabase) e confirme o e-mail se necessário.
4. Torne esse usuário administrador:

```sql
update public.profiles
set role = 'admin', full_name = 'Administrador'
where id = 'COLE_AQUI_O_UUID_DO_AUTH_USERS';
```

5. (Opcional) Ajuste dados de teste com comentários em **`supabase/seed.sql`**.

### Regras de negócio no banco

- **RN01 / RN02**: `finalize_sale` valida estoque e baixa dentro da mesma transação.
- **RN03**: `cancel_sale` estorna estoque em vendas **concluídas** (somente **admin**); rascunhos podem ser cancelados pelo dono ou admin.
- **RN04**: estoque baixo = `control_stock` e `stock_quantity <= minimum_stock` (filtro na UI).
- **RN05**: relatórios usam apenas vendas com `status = 'completed'`.

## Configuração local

```bash
cp .env.local.example .env.local
# Preencha URL, anon key e service role (para criar usuários na tela Admin).
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem variáveis de ambiente, o proxy redireciona para `/login` (modo degradado).

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
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint |

## Notas

- Se o SQL do Supabase reclamar da sintaxe do trigger (`execute function`), troque para `execute procedure` conforme a versão do Postgres do projeto.
- Rascunhos de venda são reutilizados na mesma aba via `sessionStorage` (`fluxo-draft-sale-id`) para reduzir lixo; use **Descartar rascunho** para cancelar.
