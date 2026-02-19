-- 1. PROFILES (Extends Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  role text check (role in ('primary', 'secondary', 'viewer', 'provider')),
  created_at timestamptz default now()
);

-- 2. PATIENT STATUS & PROFILE (Singleton)
create table public.patient_status (
  id int primary key default 1,
  first_name text default 'Eleanor',
  last_name text default 'P.',
  dob date default '1948-04-12',
  blood_type text default 'A+',
  baseline_o2 int default 94,
  emergency_instructions text default 'Call Dr. Smith if O2 < 88% for more than 5 mins',
  dnr_status boolean default true,
  check (id = 1)
);

-- 3. MEDICAL HISTORY
create table public.medical_history (
  id uuid default gen_random_uuid() primary key,
  condition_name text not null,
  diagnosed_year text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. APPOINTMENTS (Calendar)
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  location text,
  appointment_at timestamptz not null,
  provider_name text,
  notes text,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- 5. CARE TASKS (To-Do)
create table public.care_tasks (
  id uuid default gen_random_uuid() primary key,
  task_name text not null,
  description text,
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references auth.users(id),
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now()
);

-- 6. MEDICATIONS
create table public.medications (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  dosage text,
  instructions text,
  schedule_time text check (schedule_time in ('Morning', 'Noon', 'Night', 'PRN')),
  stock_current int default 0,
  stock_threshold int default 5,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 7. OXYGEN & SUPPLIES
create table public.inventory_supplies (
  id uuid default gen_random_uuid() primary key,
  item_type text not null,
  quantity_full int default 0,
  quantity_empty int default 0,
  threshold_alert int default 2,
  supplier_contact text,
  updated_at timestamptz default now()
);

-- 8. CARE TIMELINE (The Audit Log)
create table public.care_timeline (
  id uuid default gen_random_uuid() primary key,
  event_type text not null, 
  title text not null,
  description text,
  value_numeric numeric,
  value_sub numeric,
  performed_at timestamptz default now(),
  logged_by uuid references auth.users(id)
);

-- SECURITY POLICIES
alter table public.profiles enable row level security;
alter table public.patient_status enable row level security;
alter table public.medical_history enable row level security;
alter table public.appointments enable row level security;
alter table public.care_tasks enable row level security;
alter table public.medications enable row level security;
alter table public.inventory_supplies enable row level security;
alter table public.care_timeline enable row level security;

-- Global Read for Family (Simplicity)
create policy "Authenticated Read" on public.patient_status for select using (true);
create policy "Authenticated Read" on public.medical_history for select using (true);
create policy "Authenticated Read" on public.appointments for select using (true);
create policy "Authenticated Read" on public.care_tasks for select using (true);
create policy "Authenticated Read" on public.medications for select using (true);
create policy "Authenticated Read" on public.inventory_supplies for select using (true);
create policy "Authenticated Read" on public.care_timeline for select using (true);

-- Global Write for Family
create policy "Authenticated Write" on public.care_timeline for insert with check (true);
create policy "Authenticated Write" on public.care_tasks for all using (true);
create policy "Authenticated Write" on public.appointments for all using (true);
create policy "Authenticated Write" on public.patient_status for update using (true);

-- SEED DATA
insert into public.patient_status (baseline_o2) values (94);
insert into public.inventory_supplies (item_type, quantity_full, quantity_empty)
values ('oxygen_tank', 4, 1), ('cannula', 5, 0);

insert into public.medical_history (condition_name, diagnosed_year, notes)
values 
  ('Hypertension', '2012', 'Managed with Lisinopril'),
  ('Type 2 Diabetes', '2015', 'Managed with Metformin and diet');

insert into public.care_tasks (task_name, description, priority)
values 
  ('Check O2 Tank Levels', 'Ensure at least 3 full tanks for overnight', 'high'),
  ('Prepare weekly pillbox', 'Fill Sunday morning', 'medium');
