-- QiOne core: tenants + modules + RBAC + membership + launcher visibility
-- Safe defaults: browser uses anon key; all access controlled via RLS.

begin;

-- Create schema
create schema if not exists qione;

-- Grant usage
grant usage on schema qione to authenticated, anon;
alter default privileges in schema qione grant all on tables to authenticated, anon;
alter default privileges in schema qione grant all on sequences to authenticated, anon;
alter default privileges in schema qione grant all on functions to authenticated, anon;

-- Extensions
create extension if not exists "pgcrypto";

-- =========
-- Core tables
-- =========

create table if not exists qione.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('home','business','client')),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists qione.tenant_members (
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','invited','disabled')),
  display_name text,
  joined_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Global module catalog (one row per module key)
create table if not exists qione.modules (
  key text primary key,
  name text not null,
  description text,
  icon text,
  route text not null,
  is_active boolean not null default true
);

-- Which modules are enabled for a tenant
create table if not exists qione.tenant_modules (
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  module_key text not null references qione.modules(key) on delete cascade,
  is_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  primary key (tenant_id, module_key)
);

-- Tenant-local roles
create table if not exists qione.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  name text not null,
  rank int not null default 100,
  unique (tenant_id, name)
);

-- Member-role mapping (many-to-many)
create table if not exists qione.member_roles (
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references qione.roles(id) on delete cascade,
  primary key (tenant_id, user_id, role_id)
);

-- RBAC per module (per tenant)
create table if not exists qione.module_role_access (
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  module_key text not null references qione.modules(key) on delete cascade,
  role_id uuid not null references qione.roles(id) on delete cascade,
  access text not null check (access in ('none','read','write','admin')),
  primary key (tenant_id, module_key, role_id)
);

-- Optional per-user module assignment override (feature flag)
create table if not exists qione.member_module_assignments (
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null references qione.modules(key) on delete cascade,
  assigned boolean not null default true,
  primary key (tenant_id, user_id, module_key)
);

-- =========
-- Helper functions (security definer)
-- =========

create or replace function qione.is_tenant_member(p_tenant uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = qione
as $$
  select exists (
    select 1 from qione.tenant_members tm
    where tm.tenant_id = p_tenant
      and tm.user_id = p_user
      and tm.status = 'active'
  );
$$;

-- Returns best access level for a user in a tenant/module via roles + optional assignment override
-- priority: admin > write > read > none
create or replace function qione.module_access_level(p_tenant uuid, p_module text, p_user uuid)
returns text
language plpgsql
stable
security definer
set search_path = qione
as $$
declare
  v_enabled boolean;
  v_assigned boolean;
  v_level text := 'none';
begin
  -- module must be enabled for tenant
  select coalesce(is_enabled, false)
    into v_enabled
  from qione.tenant_modules
  where tenant_id = p_tenant and module_key = p_module;

  if not v_enabled then
    return 'none';
  end if;

  if not qione.is_tenant_member(p_tenant, p_user) then
    return 'none';
  end if;

  -- assignment override (if row exists and assigned=false, it blocks; if assigned=true, it allows)
  select mma.assigned into v_assigned
  from qione.member_module_assignments mma
  where mma.tenant_id = p_tenant and mma.user_id = p_user and mma.module_key = p_module;

  if v_assigned is not null and v_assigned = false then
    return 'none';
  end if;

  -- compute best role-based access
  with access_rows as (
    select mra.access
    from qione.member_roles mr
    join qione.module_role_access mra
      on mra.tenant_id = mr.tenant_id
     and mra.role_id = mr.role_id
     and mra.module_key = p_module
    where mr.tenant_id = p_tenant
      and mr.user_id = p_user
  )
  select
    case
      when exists (select 1 from access_rows where access = 'admin') then 'admin'
      when exists (select 1 from access_rows where access = 'write') then 'write'
      when exists (select 1 from access_rows where access = 'read') then 'read'
      else 'none'
    end
  into v_level;

  -- if user has explicit assignment true but no role mapping, allow read by default
  if v_level = 'none' and v_assigned = true then
    v_level := 'read';
  end if;

  return v_level;
end;
$$;

create or replace function qione.has_module_access(p_tenant uuid, p_module text, p_user uuid, p_min text)
returns boolean
language plpgsql
stable
security definer
set search_path = qione
as $$
declare
  lvl text;
  minv int;
  lv int;
begin
  lvl := qione.module_access_level(p_tenant, p_module, p_user);

  -- map levels
  minv := case p_min when 'read' then 1 when 'write' then 2 when 'admin' then 3 else 999 end;
  lv   := case lvl   when 'read' then 1 when 'write' then 2 when 'admin' then 3 else 0 end;

  return lv >= minv;
end;
$$;

-- =========
-- Views
-- =========

-- What modules should show in launcher for a user in a tenant
create or replace view qione.v_launcher_modules as
select
  tm.tenant_id,
  tm.user_id,
  m.key as module_key,
  m.name,
  m.description,
  m.icon,
  m.route,
  qione.module_access_level(tm.tenant_id, m.key, tm.user_id) as access_level
from qione.tenant_members tm
join qione.tenant_modules tenm on tenm.tenant_id = tm.tenant_id and tenm.is_enabled = true
join qione.modules m on m.key = tenm.module_key and m.is_active = true
where tm.status = 'active';

-- =========
-- RLS
-- =========
alter table qione.tenants enable row level security;
alter table qione.tenant_members enable row level security;
alter table qione.modules enable row level security;
alter table qione.tenant_modules enable row level security;
alter table qione.roles enable row level security;
alter table qione.member_roles enable row level security;
alter table qione.module_role_access enable row level security;
alter table qione.member_module_assignments enable row level security;

-- Tenants: a user can see tenants they belong to
create policy "tenants_select_if_member"
on qione.tenants
for select
to authenticated
using (qione.is_tenant_member(id, auth.uid()));

-- Tenants: create allowed (creator becomes owner via app logic)
create policy "tenants_insert_self"
on qione.tenants
for insert
to authenticated
with check (created_by = auth.uid());

-- Tenant members: read if member of that tenant
create policy "tenant_members_select_if_member"
on qione.tenant_members
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

-- Tenant members: insert/update/delete restricted to admins of any enabled module 'core' (we’ll define core module)
-- For MVP, treat 'qione_admin' module as admin gate; you can tighten later.
-- If you don’t like this, move invites into a Worker with service role.
create policy "tenant_members_mutate_admin_only"
on qione.tenant_members
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Modules catalog: readable by all authenticated (or even anon if you want)
create policy "modules_select_all"
on qione.modules
for select
to authenticated
using (true);

-- Modules catalog: mutation locked down (do in SQL or service role)
create policy "modules_mutation_denied"
on qione.modules
for insert
to authenticated
with check (false);

create policy "modules_update_denied"
on qione.modules
for update
to authenticated
using (false);

create policy "modules_delete_denied"
on qione.modules
for delete
to authenticated
using (false);

-- Tenant modules: read if member; write if admin
create policy "tenant_modules_select_if_member"
on qione.tenant_modules
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

create policy "tenant_modules_mutate_admin_only"
on qione.tenant_modules
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Roles: read if member; write if admin
create policy "roles_select_if_member"
on qione.roles
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

create policy "roles_mutate_admin_only"
on qione.roles
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Member roles: read if member; write if admin
create policy "member_roles_select_if_member"
on qione.member_roles
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

create policy "member_roles_mutate_admin_only"
on qione.member_roles
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Module role access: read if member; write if admin
create policy "module_role_access_select_if_member"
on qione.module_role_access
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

create policy "module_role_access_mutate_admin_only"
on qione.module_role_access
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Member module assignments: read if member; write if admin
create policy "member_module_assignments_select_if_member"
on qione.member_module_assignments
for select
to authenticated
using (qione.is_tenant_member(tenant_id, auth.uid()));

create policy "member_module_assignments_mutate_admin_only"
on qione.member_module_assignments
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'))
with check (qione.has_module_access(tenant_id, 'qione_admin', auth.uid(), 'admin'));

-- Launcher view: expose via security barrier by RLS on base tables (ok)
-- (No RLS on views.)

-- =========
-- Seed module catalog
-- =========
insert into qione.modules (key, name, description, icon, route, is_active)
values
  ('qione_admin', 'QiOne Admin', 'Tenant settings, members, roles, modules', 'settings', '/t/:tenantId/settings', true),
  ('qihome', 'QiHome', 'Household: money, balances, chores', 'home', '/m/qihome', true)
on conflict (key) do nothing;

commit;
