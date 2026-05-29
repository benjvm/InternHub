create table if not exists public.firebase_user_mapping (
  firebase_uid text primary key,
  supabase_user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists firebase_user_mapping_supabase_user_id_idx
on public.firebase_user_mapping(supabase_user_id);

do $$
declare
  constraint_name text;
begin
  if
    to_regclass('public.chats') is not null
    and to_regclass('public.chat_participants') is not null
    and to_regclass('public.chat_messages') is not null
  then
    for constraint_name in
      select conname
      from pg_constraint
      where conrelid = 'public.chat_participants'::regclass
        and confrelid = 'public.chats'::regclass
    loop
      execute format('alter table public.chat_participants drop constraint if exists %I', constraint_name);
    end loop;

    for constraint_name in
      select conname
      from pg_constraint
      where conrelid = 'public.chat_messages'::regclass
        and confrelid = 'public.chats'::regclass
    loop
      execute format('alter table public.chat_messages drop constraint if exists %I', constraint_name);
    end loop;

    alter table public.chats alter column id type text using id::text;
    alter table public.chat_participants alter column chat_id type text using chat_id::text;
    alter table public.chat_messages alter column id type text using id::text;
    alter table public.chat_messages alter column chat_id type text using chat_id::text;

    alter table public.chat_participants
      add constraint chat_participants_chat_id_fkey
      foreign key (chat_id) references public.chats(id) on delete cascade;

    alter table public.chat_messages
      add constraint chat_messages_chat_id_fkey
      foreign key (chat_id) references public.chats(id) on delete cascade;
  end if;

  if to_regclass('public.notifications') is not null then
    alter table public.notifications alter column id type text using id::text;
  end if;

  if to_regclass('public.activity_logs') is not null then
    alter table public.activity_logs alter column id type text using id::text;
  end if;
end $$;
