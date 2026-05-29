insert into public.activity_logs (entity_type, action, metadata)
values ('system', 'seed', '{"message":"InternHub Supabase schema initialized"}'::jsonb)
on conflict do nothing;
