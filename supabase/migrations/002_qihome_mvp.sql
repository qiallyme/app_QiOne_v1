-- QiHome MVP: ledger + settlements + chores
begin;

-- =========
-- Money
-- =========
create table if not exists qione.qihome_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  unique (tenant_id, name)
);

create table if not exists qione.qihome_expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  date date not null,
  amount_cents int not null check (amount_cents > 0),
  category_id uuid references qione.qihome_categories(id),
  paid_by uuid not null references auth.users(id),
  memo text,
  receipt_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists qione.qihome_expense_shares (
  expense_id uuid not null references qione.qihome_expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_cents int not null check (share_cents >= 0),
  primary key (expense_id, user_id)
);

create table if not exists qione.qihome_settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  date date not null,
  from_user uuid not null references auth.users(id),
  to_user uuid not null references auth.users(id),
  amount_cents int not null check (amount_cents > 0),
  memo text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- =========
-- Chores
-- =========
create table if not exists qione.qihome_chores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  title text not null,
  frequency text not null default 'weekly', -- daily/weekly/monthly/custom
  points int not null default 1,
  is_active boolean not null default true
);

create table if not exists qione.qihome_chore_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references qione.tenants(id) on delete cascade,
  chore_id uuid not null references qione.qihome_chores(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  due_date date not null,
  status text not null default 'open' check (status in ('open','done','skipped')),
  done_at timestamptz
);

-- =========
-- Balance view (net per user)
-- net = shares_owed - paid + settlements_sent - settlements_received
-- positive => user owes; negative => user is owed
create or replace view qione.v_qihome_member_balances as
with shares as (
  select e.tenant_id, s.user_id, sum(s.share_cents)::bigint as shares_owed
  from qione.qihome_expense_shares s
  join qione.qihome_expenses e on e.id = s.expense_id
  group by e.tenant_id, s.user_id
),
paid as (
  select tenant_id, paid_by as user_id, sum(amount_cents)::bigint as paid_total
  from qione.qihome_expenses
  group by tenant_id, paid_by
),
sent as (
  select tenant_id, from_user as user_id, sum(amount_cents)::bigint as sent_total
  from qione.qihome_settlements
  group by tenant_id, from_user
),
received as (
  select tenant_id, to_user as user_id, sum(amount_cents)::bigint as recv_total
  from qione.qihome_settlements
  group by tenant_id, to_user
),
members as (
  select tenant_id, user_id
  from qione.tenant_members
  where status = 'active'
)
select
  m.tenant_id,
  m.user_id,
  coalesce(sh.shares_owed, 0) as shares_owed,
  coalesce(p.paid_total, 0) as paid_total,
  coalesce(se.sent_total, 0) as settlements_sent,
  coalesce(r.recv_total, 0) as settlements_received,
  (coalesce(sh.shares_owed, 0)
   - coalesce(p.paid_total, 0)
   + coalesce(se.sent_total, 0)
   - coalesce(r.recv_total, 0)) as net_cents
from members m
left join shares sh on sh.tenant_id = m.tenant_id and sh.user_id = m.user_id
left join paid p on p.tenant_id = m.tenant_id and p.user_id = m.user_id
left join sent se on se.tenant_id = m.tenant_id and se.user_id = m.user_id
left join received r on r.tenant_id = m.tenant_id and r.user_id = m.user_id;

-- =========
-- RLS
-- =========
alter table qione.qihome_categories enable row level security;
alter table qione.qihome_expenses enable row level security;
alter table qione.qihome_expense_shares enable row level security;
alter table qione.qihome_settlements enable row level security;
alter table qione.qihome_chores enable row level security;
alter table qione.qihome_chore_assignments enable row level security;

-- Categories: read if can read qihome; mutate if write
create policy "qihome_categories_read"
on qione.qihome_categories
for select
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read'));

create policy "qihome_categories_write"
on qione.qihome_categories
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'))
with check (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'));

-- Expenses: read if can read; insert/update/delete if write (creator or admin)
create policy "qihome_expenses_read"
on qione.qihome_expenses
for select
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read'));

create policy "qihome_expenses_write"
on qione.qihome_expenses
for insert
to authenticated
with check (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write')
  and created_by = auth.uid()
);

create policy "qihome_expenses_update_delete"
on qione.qihome_expenses
for update
to authenticated
using (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write')
  and (created_by = auth.uid() or qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'admin'))
)
with check (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write')
);

create policy "qihome_expenses_delete"
on qione.qihome_expenses
for delete
to authenticated
using (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write')
  and (created_by = auth.uid() or qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'admin'))
);

-- Shares: read if can read; write if write
create policy "qihome_shares_read"
on qione.qihome_expense_shares
for select
to authenticated
using (
  exists (
    select 1
    from qione.qihome_expenses e
    where e.id = expense_id
      and qione.has_module_access(e.tenant_id, 'qihome', auth.uid(), 'read')
  )
);

create policy "qihome_shares_write"
on qione.qihome_expense_shares
for all
to authenticated
using (
  exists (
    select 1
    from qione.qihome_expenses e
    where e.id = expense_id
      and qione.has_module_access(e.tenant_id, 'qihome', auth.uid(), 'write')
  )
)
with check (
  exists (
    select 1
    from qione.qihome_expenses e
    where e.id = expense_id
      and qione.has_module_access(e.tenant_id, 'qihome', auth.uid(), 'write')
  )
);

-- Settlements: read if read; write if write
create policy "qihome_settlements_read"
on qione.qihome_settlements
for select
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read'));

create policy "qihome_settlements_write"
on qione.qihome_settlements
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'))
with check (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write')
  and created_by = auth.uid()
);

-- Chores: read if read; write if write
create policy "qihome_chores_read"
on qione.qihome_chores
for select
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read'));

create policy "qihome_chores_write"
on qione.qihome_chores
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'))
with check (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'));

-- Assignments: read if read; write if write (or self mark done if read)
create policy "qihome_assignments_read"
on qione.qihome_chore_assignments
for select
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read'));

create policy "qihome_assignments_write_admin"
on qione.qihome_chore_assignments
for all
to authenticated
using (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'))
with check (qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'write'));

create policy "qihome_assignments_self_mark_done"
on qione.qihome_chore_assignments
for update
to authenticated
using (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read')
  and user_id = auth.uid()
)
with check (
  qione.has_module_access(tenant_id, 'qihome', auth.uid(), 'read')
  and user_id = auth.uid()
);

-- Seed default categories (optional)
insert into qione.qihome_categories (tenant_id, name)
select t.id, v.name
from qione.tenants t
cross join (values ('Rent'),('Utilities'),('Groceries'),('Household'),('Medical'),('Transport')) as v(name)
where t.type = 'home'
on conflict do nothing;

commit;
