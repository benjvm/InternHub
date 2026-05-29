alter table public.users enable row level security;
alter table public.firebase_user_mapping enable row level security;
alter table public.student_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.company_locations enable row level security;
alter table public.offers enable row level security;
alter table public.applications enable row level security;
alter table public.internships enable row level security;
alter table public.internship_daily_logs enable row level security;
alter table public.saved_offers enable row level security;
alter table public.activity_logs enable row level security;
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.professor_profiles enable row level security;

create policy "users_read_own_or_public_roles"
on public.users for select
using (
  auth.uid() = id
  or exists (
    select 1 from public.users viewer
    where viewer.id = auth.uid() and viewer.role in (2, 3)
  )
);

create policy "users_insert_own"
on public.users for insert
with check (auth.uid() = id);

create policy "users_update_own"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "firebase_user_mapping_service_only"
on public.firebase_user_mapping for all
using (false)
with check (false);

create policy "profiles_read_authenticated"
on public.student_profiles for select
using (auth.role() = 'authenticated');

create policy "student_profiles_write_own"
on public.student_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "company_profiles_read_authenticated"
on public.company_profiles for select
using (auth.role() = 'authenticated');

create policy "company_profiles_write_own"
on public.company_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "professor_profiles_read_authenticated"
on public.professor_profiles for select
using (auth.role() = 'authenticated');

create policy "professor_profiles_write_own"
on public.professor_profiles for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "company_locations_read_authenticated"
on public.company_locations for select
using (auth.role() = 'authenticated');

create policy "company_locations_company_write"
on public.company_locations for all
using (auth.uid() = company_id)
with check (auth.uid() = company_id);

create policy "offers_public_read"
on public.offers for select
using (status = 'published' or auth.uid() = company_id);

create policy "offers_company_insert"
on public.offers for insert
with check (
  auth.uid() = company_id
  and exists (select 1 from public.users where id = auth.uid() and role = 2)
);

create policy "offers_company_update_delete"
on public.offers for all
using (auth.uid() = company_id)
with check (auth.uid() = company_id);

create policy "applications_student_or_company_read"
on public.applications for select
using (
  auth.uid() = student_id
  or exists (
    select 1 from public.offers
    where offers.id = applications.offer_id and offers.company_id = auth.uid()
  )
);

create policy "applications_student_insert"
on public.applications for insert
with check (
  auth.uid() = student_id
  and exists (select 1 from public.users where id = auth.uid() and role = 1)
);

create policy "applications_owner_update"
on public.applications for update
using (
  auth.uid() = student_id
  or exists (
    select 1 from public.offers
    where offers.id = applications.offer_id and offers.company_id = auth.uid()
  )
)
with check (true);

create policy "internships_related_read"
on public.internships for select
using (
  auth.uid() in (student_id, company_id, professor_id)
  or professor_id is null
  or exists (select 1 from public.users where id = auth.uid() and role = 3)
);

create policy "internships_company_insert"
on public.internships for insert
with check (
  auth.uid() = company_id
  and exists (select 1 from public.users where id = auth.uid() and role = 2)
);

create policy "internships_related_update"
on public.internships for update
using (
  auth.uid() in (student_id, company_id, professor_id)
  or (
    professor_id is null
    and exists (select 1 from public.users where id = auth.uid() and role = 3)
  )
)
with check (true);

create policy "daily_logs_related_read"
on public.internship_daily_logs for select
using (
  exists (
    select 1 from public.internships
    where internships.id = internship_daily_logs.internship_id
    and auth.uid() in (internships.student_id, internships.company_id, internships.professor_id)
  )
);

create policy "daily_logs_student_insert"
on public.internship_daily_logs for insert
with check (
  exists (
    select 1 from public.internships
    where internships.id = internship_daily_logs.internship_id
    and internships.student_id = auth.uid()
  )
);

create policy "saved_offers_student_crud"
on public.saved_offers for all
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

create policy "notifications_user_crud"
on public.notifications for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_participants_read_own"
on public.chat_participants for select
using (auth.uid() = user_id);

create policy "chats_participant_read"
on public.chats for select
using (
  exists (
    select 1 from public.chat_participants
    where chat_participants.chat_id = chats.id
    and chat_participants.user_id = auth.uid()
  )
);

create policy "chat_messages_participant_read"
on public.chat_messages for select
using (
  exists (
    select 1 from public.chat_participants
    where chat_participants.chat_id = chat_messages.chat_id
    and chat_participants.user_id = auth.uid()
  )
);

create policy "chat_messages_participant_insert"
on public.chat_messages for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.chat_participants
    where chat_participants.chat_id = chat_messages.chat_id
    and chat_participants.user_id = auth.uid()
  )
);
