create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'company', 'professor', 'admin');
create type public.application_status as enum ('pending', 'reviewing', 'accepted', 'rejected');
create type public.internship_status as enum ('pendiente', 'activo', 'completado', 'cancelado');
create type public.notification_status as enum ('unread', 'read', 'archived');

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role smallint not null check (role in (1, 2, 3)),
  legacy_firebase_uid text unique,
  photo_url text,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.firebase_user_mapping (
  firebase_uid text primary key,
  supabase_user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  university text not null default '',
  degree text not null default '',
  bio text not null default '',
  cv_url text,
  cv_file_name text,
  cv_public_id text,
  cv_updated_at timestamptz,
  cv_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  company_name text not null default '',
  sector text not null default '',
  contact_email text,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_locations (
  id text primary key,
  company_id uuid not null references public.company_profiles(user_id) on delete cascade,
  name text not null,
  city text not null,
  country text not null,
  latitude double precision,
  longitude double precision,
  location_type text not null default 'Office',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.professor_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  full_name text not null default '',
  contact_email text,
  phone text not null default '',
  education_area text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.offers (
  id text primary key default gen_random_uuid()::text,
  company_id uuid references public.users(id) on delete set null,
  company_name text not null default 'Empresa de InternHub',
  title text not null,
  category text not null default '',
  description text not null,
  responsibilities text[] not null default '{}',
  location text not null default '',
  location_id text,
  location_details jsonb,
  salary text not null default '',
  modality text not null default '',
  icon text not null default 'business_center',
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key default gen_random_uuid()::text,
  offer_id text not null references public.offers(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending',
  cover_letter text not null default '',
  availability text not null default '',
  available_from_date text not null default '',
  schedule_type text not null default '',
  cv_url text not null default '',
  cv_file_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (offer_id, student_id)
);

create table if not exists public.internships (
  id text primary key default gen_random_uuid()::text,
  application_id text references public.applications(id) on delete set null,
  student_id uuid not null references public.users(id) on delete cascade,
  company_id uuid references public.users(id) on delete set null,
  offer_id text references public.offers(id) on delete set null,
  professor_id uuid references public.users(id) on delete set null,
  status text not null default 'pendiente',
  start_date date,
  end_date date,
  required_hours numeric(8, 2),
  total_hours numeric(8, 2),
  completed_hours numeric(8, 2) not null default 0,
  tutor_company_name text not null default '',
  notes text not null default '',
  last_update timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (application_id),
  unique (offer_id, student_id)
);

create table if not exists public.internship_daily_logs (
  internship_id text not null references public.internships(id) on delete cascade,
  date date not null,
  description text not null,
  hours_worked numeric(6, 2) not null check (hours_worked > 0),
  log_type text not null check (log_type in ('presencial', 'remoto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (internship_id, date)
);

create table if not exists public.saved_offers (
  student_id uuid not null references public.users(id) on delete cascade,
  offer_id text not null references public.offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, offer_id)
);

create table if not exists public.activity_logs (
  id text primary key default gen_random_uuid()::text,
  actor_id uuid references public.users(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id text primary key default gen_random_uuid()::text,
  offer_id text references public.offers(id) on delete set null,
  application_id text references public.applications(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.chat_participants (
  chat_id text not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists public.chat_messages (
  id text primary key default gen_random_uuid()::text,
  chat_id text not null references public.chats(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  status text not null default 'unread',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists users_role_idx on public.users(role);
create index if not exists users_legacy_firebase_uid_idx on public.users(legacy_firebase_uid);
create index if not exists firebase_user_mapping_supabase_user_id_idx on public.firebase_user_mapping(supabase_user_id);
create index if not exists offers_company_id_idx on public.offers(company_id);
create index if not exists offers_status_created_at_idx on public.offers(status, created_at desc);
create index if not exists applications_offer_id_idx on public.applications(offer_id);
create index if not exists applications_student_id_idx on public.applications(student_id);
create index if not exists applications_status_idx on public.applications(status);
create index if not exists internships_company_id_idx on public.internships(company_id);
create index if not exists internships_student_id_idx on public.internships(student_id);
create index if not exists internships_professor_id_idx on public.internships(professor_id);
create index if not exists internship_daily_logs_date_idx on public.internship_daily_logs(internship_id, date);
create index if not exists notifications_user_status_idx on public.notifications(user_id, status);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_users_updated_at on public.users;
create trigger touch_users_updated_at before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists touch_firebase_user_mapping_updated_at on public.firebase_user_mapping;
create trigger touch_firebase_user_mapping_updated_at before update on public.firebase_user_mapping
for each row execute function public.touch_updated_at();

drop trigger if exists touch_student_profiles_updated_at on public.student_profiles;
create trigger touch_student_profiles_updated_at before update on public.student_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_company_profiles_updated_at on public.company_profiles;
create trigger touch_company_profiles_updated_at before update on public.company_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_professor_profiles_updated_at on public.professor_profiles;
create trigger touch_professor_profiles_updated_at before update on public.professor_profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_offers_updated_at on public.offers;
create trigger touch_offers_updated_at before update on public.offers
for each row execute function public.touch_updated_at();

drop trigger if exists touch_applications_updated_at on public.applications;
create trigger touch_applications_updated_at before update on public.applications
for each row execute function public.touch_updated_at();

drop trigger if exists touch_internships_updated_at on public.internships;
create trigger touch_internships_updated_at before update on public.internships
for each row execute function public.touch_updated_at();

create or replace function public.create_internship_daily_log(
  target_internship_id text,
  log_date date,
  log_description text,
  log_hours_worked numeric,
  log_type_value text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.internship_daily_logs (
    internship_id,
    date,
    description,
    hours_worked,
    log_type
  )
  values (
    target_internship_id,
    log_date,
    log_description,
    log_hours_worked,
    log_type_value
  );

  update public.internships
  set
    completed_hours = completed_hours + log_hours_worked,
    updated_at = now(),
    last_update = now()
  where id = target_internship_id;
end;
$$;
