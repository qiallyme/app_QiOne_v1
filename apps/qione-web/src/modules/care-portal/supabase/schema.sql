-- Create the schema
CREATE SCHEMA IF NOT EXISTS qihealth;

-- Core table
create table qihealth.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  dob date,
  notes text,
  created_at timestamp default now()
);

-- MEDICAL

create table qihealth.conditions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id) on delete cascade,
  name text,
  status text, -- active, resolved
  notes text,
  created_at timestamp default now()
);

create table qihealth.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id) on delete cascade,
  name text,
  dose text,
  frequency text,
  route text,
  prescriber text,
  active boolean default true,
  notes text,
  created_at timestamp default now()
);

create table qihealth.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid references qihealth.medications(id) on delete cascade,
  given_at timestamp,
  given_by text,
  status text, -- given / skipped / refused
  notes text
);

create table qihealth.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id) on delete cascade,
  type text, -- BP, oxygen, glucose
  value text,
  recorded_at timestamp default now(),
  notes text
);

create table qihealth.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id) on delete cascade,
  provider text,
  location text,
  appointment_time timestamp,
  reason text,
  outcome text,
  next_steps text
);

-- OPERATIONS

create table qihealth.tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id) on delete cascade,
  title text,
  due_at timestamp,
  recurring boolean,
  status text default 'pending',
  notes text
);

create table qihealth.incidents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id),
  incident_time timestamp,
  type text,
  description text
);

create table qihealth.inventory_items (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id),
  name text,
  quantity int,
  reorder_threshold int,
  notes text
);

-- CONTACTS

create table qihealth.contacts (
  id uuid primary key default gen_random_uuid(),
  name text,
  role text, -- doctor, pharmacy, caseworker
  phone text,
  email text,
  address text,
  notes text
);

-- DOCUMENT VAULT (Drive bridge)

create table qihealth.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references qihealth.patients(id),
  title text,
  category text, -- legal, insurance, medical
  drive_file_id text,
  drive_link text,
  notes text,
  uploaded_at timestamp default now()
);
