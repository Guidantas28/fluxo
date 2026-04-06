-- Fluxo+ — schema completo para Supabase (PostgreSQL)
-- Execute no SQL Editor do projeto Supabase ou via CLI: supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'operator');
create type public.payment_method as enum ('cash', 'pix', 'debit_card', 'credit_card', 'other');
create type public.sale_status as enum ('draft', 'completed', 'cancelled');
create type public.stock_movement_type as enum ('entry', 'exit', 'reversal', 'adjustment');

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'operator',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_active_idx on public.profiles (role, active);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Novo usuário em auth.users → linha em profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.user_role := 'operator';
begin
  if coalesce(new.raw_user_meta_data->>'role', '') in ('admin', 'operator') then
    r := (new.raw_user_meta_data->>'role')::public.user_role;
  end if;

  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    r,
    true
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null,
  description text,
  sale_price numeric(14, 2) not null default 0 check (sale_price >= 0),
  cost_price numeric(14, 2) not null default 0 check (cost_price >= 0),
  stock_quantity numeric(14, 3) not null default 0 check (stock_quantity >= 0),
  minimum_stock numeric(14, 3) not null default 0 check (minimum_stock >= 0),
  control_stock boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_sku_unique unique (sku)
);

create index products_name_lower_idx on public.products (lower(name));
create index products_active_idx on public.products (active);
create index products_low_stock_idx on public.products (stock_quantity, minimum_stock)
  where active = true and control_stock = true;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.prevent_product_delete_if_used()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.sale_items where product_id = old.id) then
    raise exception 'Não é possível excluir: produto possui itens de venda.';
  end if;
  if exists (select 1 from public.stock_movements where product_id = old.id) then
    raise exception 'Não é possível excluir: produto possui movimentações de estoque.';
  end if;
  return old;
end;
$$;

create trigger products_prevent_delete_if_used
  before delete on public.products
  for each row execute function public.prevent_product_delete_if_used();

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  document text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_name_lower_idx on public.clients (lower(name));
create index clients_phone_idx on public.clients (phone);
create index clients_email_lower_idx on public.clients (lower(email));

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sales
-- ---------------------------------------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  user_id uuid not null references auth.users (id),
  total_amount numeric(14, 2) not null default 0 check (total_amount >= 0),
  payment_method public.payment_method not null default 'cash',
  status public.sale_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_created_at_idx on public.sales (created_at desc);
create index sales_status_idx on public.sales (status);
create index sales_user_id_idx on public.sales (user_id);
create index sales_client_id_idx on public.sales (client_id);
create index sales_payment_method_idx on public.sales (payment_method);

create trigger sales_set_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sale_items
-- ---------------------------------------------------------------------------
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id),
  product_name_snapshot text not null,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity numeric(14, 3) not null check (quantity > 0),
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

-- ---------------------------------------------------------------------------
-- stock_movements
-- ---------------------------------------------------------------------------
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id),
  sale_id uuid references public.sales (id) on delete set null,
  movement_type public.stock_movement_type not null,
  quantity numeric(14, 3) not null,
  reason text,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index stock_movements_product_id_idx on public.stock_movements (product_id);
create index stock_movements_sale_id_idx on public.stock_movements (sale_id);
create index stock_movements_created_at_idx on public.stock_movements (created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);

-- ---------------------------------------------------------------------------
-- Funções auxiliares (RLS / RPC)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid and p.active = true and p.role = 'admin'
  );
$$;

create or replace function public.has_active_profile(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p where p.id = uid and p.active = true
  );
$$;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = uid and p.active = true and p.role in ('admin', 'operator')
  );
$$;

-- Finaliza venda: valida estoque, baixa, movimentos, audit (RN01–RN02)
create or replace function public.finalize_sale(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  it record;
  prod record;
  v_total numeric(14, 2) := 0;
  v_sale_user uuid;
  v_status public.sale_status;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  if not public.has_active_profile(v_uid) or not public.is_staff(v_uid) then
    raise exception 'Sem permissão';
  end if;

  select s.user_id, s.status
    into v_sale_user, v_status
  from public.sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception 'Venda não encontrada';
  end if;

  if v_status is distinct from 'draft' then
    raise exception 'Venda já finalizada ou cancelada';
  end if;

  if v_sale_user is distinct from v_uid and not public.is_admin(v_uid) then
    raise exception 'Venda pertence a outro usuário';
  end if;

  -- Validação de estoque (RN01)
  for it in
    select si.* from public.sale_items si where si.sale_id = p_sale_id
  loop
    select * into prod from public.products where id = it.product_id for update;
    if not found then
      raise exception 'Produto não encontrado';
    end if;
    if prod.control_stock and prod.stock_quantity < it.quantity then
      raise exception 'Estoque insuficiente para "%" (disponível: %)', prod.name, prod.stock_quantity;
    end if;
  end loop;

  -- Baixa de estoque (RN02)
  for it in
    select si.* from public.sale_items si where si.sale_id = p_sale_id
  loop
    select * into prod from public.products where id = it.product_id for update;
    if prod.control_stock then
      update public.products
        set stock_quantity = stock_quantity - it.quantity,
            updated_at = now()
      where id = it.product_id;

      insert into public.stock_movements (
        product_id, sale_id, movement_type, quantity, reason, created_by
      ) values (
        it.product_id,
        p_sale_id,
        'exit'::public.stock_movement_type,
        it.quantity,
        'Baixa por venda',
        v_uid
      );
    end if;
  end loop;

  select coalesce(sum(subtotal), 0) into v_total
  from public.sale_items
  where sale_id = p_sale_id;

  update public.sales
    set total_amount = v_total,
        status = 'completed'::public.sale_status,
        updated_at = now()
  where id = p_sale_id;

  insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
  values (
    v_uid,
    'finalize_sale',
    'sale',
    p_sale_id,
    jsonb_build_object('total_amount', v_total)
  );

  return jsonb_build_object('ok', true, 'total_amount', v_total);
end;
$$;

-- Cancelamento: rascunho (dono ou admin) sem estorno; finalizada só admin com estorno (RN03)
create or replace function public.cancel_sale(p_sale_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_status public.sale_status;
  v_sale_user uuid;
  it record;
  prod record;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  if not public.has_active_profile(v_uid) or not public.is_staff(v_uid) then
    raise exception 'Sem permissão';
  end if;

  select s.status, s.user_id into v_status, v_sale_user
  from public.sales s
  where s.id = p_sale_id
  for update;

  if not found then
    raise exception 'Venda não encontrada';
  end if;

  if v_status = 'cancelled'::public.sale_status then
    raise exception 'Venda já cancelada';
  end if;

  if v_status = 'draft'::public.sale_status then
    if v_sale_user is distinct from v_uid and not public.is_admin(v_uid) then
      raise exception 'Sem permissão para cancelar este rascunho';
    end if;
    update public.sales set status = 'cancelled'::public.sale_status, updated_at = now() where id = p_sale_id;
    insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
    values (v_uid, 'cancel_sale_draft', 'sale', p_sale_id, '{}'::jsonb);
    return jsonb_build_object('ok', true, 'mode', 'draft');
  end if;

  if v_status = 'completed'::public.sale_status then
    if not public.is_admin(v_uid) then
      raise exception 'Somente administrador pode cancelar venda finalizada';
    end if;

    for it in select * from public.sale_items where sale_id = p_sale_id
    loop
      select * into prod from public.products where id = it.product_id for update;
      if prod.control_stock then
        update public.products
          set stock_quantity = stock_quantity + it.quantity,
              updated_at = now()
        where id = it.product_id;

        insert into public.stock_movements (
          product_id, sale_id, movement_type, quantity, reason, created_by
        ) values (
          it.product_id,
          p_sale_id,
          'reversal'::public.stock_movement_type,
          it.quantity,
          'Estorno por cancelamento de venda',
          v_uid
        );
      end if;
    end loop;

    update public.sales set status = 'cancelled'::public.sale_status, updated_at = now() where id = p_sale_id;

    insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
    values (v_uid, 'cancel_sale_completed', 'sale', p_sale_id, '{}'::jsonb);

    return jsonb_build_object('ok', true, 'mode', 'completed');
  end if;

  raise exception 'Estado de venda inválido';
end;
$$;

revoke all on function public.finalize_sale(uuid) from public;
grant execute on function public.finalize_sale(uuid) to authenticated;

revoke all on function public.cancel_sale(uuid) from public;
grant execute on function public.cancel_sale(uuid) to authenticated;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

revoke all on function public.has_active_profile(uuid) from public;
grant execute on function public.has_active_profile(uuid) to authenticated;

revoke all on function public.is_staff(uuid) from public;
grant execute on function public.is_staff(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.clients enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.audit_logs enable row level security;

-- profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin(auth.uid()));

create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_admin_update"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- products: leitura equipe; escrita só admin
create policy "products_select_staff"
  on public.products for select
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

create policy "products_insert_admin"
  on public.products for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

create policy "products_update_admin"
  on public.products for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "products_delete_admin"
  on public.products for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- clients: admin e operador
create policy "clients_select_staff"
  on public.clients for select
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

create policy "clients_insert_staff"
  on public.clients for insert
  to authenticated
  with check (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

create policy "clients_update_staff"
  on public.clients for update
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()))
  with check (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

create policy "clients_delete_staff"
  on public.clients for delete
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

-- sales
create policy "sales_select_staff"
  on public.sales for select
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

create policy "sales_insert_staff"
  on public.sales for insert
  to authenticated
  with check (
    public.has_active_profile(auth.uid())
    and public.is_staff(auth.uid())
    and user_id = auth.uid()
  );

create policy "sales_update_staff"
  on public.sales for update
  to authenticated
  using (
    public.has_active_profile(auth.uid())
    and public.is_staff(auth.uid())
    and (
      user_id = auth.uid()
      or public.is_admin(auth.uid())
    )
  )
  with check (
    public.has_active_profile(auth.uid())
    and public.is_staff(auth.uid())
    and (
      user_id = auth.uid()
      or public.is_admin(auth.uid())
    )
  );

create policy "sales_delete_admin"
  on public.sales for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- sale_items
create policy "sale_items_select_staff"
  on public.sale_items for select
  to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and public.has_active_profile(auth.uid())
        and public.is_staff(auth.uid())
    )
  );

create policy "sale_items_insert_draft_owner_or_admin"
  on public.sale_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.status = 'draft'
        and public.is_staff(auth.uid())
        and public.has_active_profile(auth.uid())
        and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "sale_items_update_draft_owner_or_admin"
  on public.sale_items for update
  to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.status = 'draft'
        and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.status = 'draft'
        and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "sale_items_delete_draft_owner_or_admin"
  on public.sale_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_items.sale_id
        and s.status = 'draft'
        and (s.user_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

-- stock_movements: leitura equipe; escrita apenas via RPC (definer) — nega direto
create policy "stock_movements_select_staff"
  on public.stock_movements for select
  to authenticated
  using (public.has_active_profile(auth.uid()) and public.is_staff(auth.uid()));

-- audit_logs: somente admin leitura; inserts pela função definer já bypassam RLS do app
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------------
-- Grants (padrão API Supabase)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- ---------------------------------------------------------------------------
-- Comentários
-- ---------------------------------------------------------------------------
comment on table public.profiles is 'Perfis vinculados a auth.users; role admin | operator';
comment on function public.finalize_sale(uuid) is 'RN01/RN02: valida estoque e baixa ao concluir venda';
comment on function public.cancel_sale(uuid) is 'RN03: cancela rascunho ou estorna estoque se finalizada (admin)';
