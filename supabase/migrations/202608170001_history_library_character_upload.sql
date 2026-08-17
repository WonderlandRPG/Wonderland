begin;

alter table public.v2_content drop constraint if exists v2_content_content_type_check;
alter table public.v2_content add constraint v2_content_content_type_check check (
  content_type in (
    'race','class','class_path','skill','item','monster','boss','progression','achievement','event','quest','dungeon','lore_story'
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'character-images',
  'character-images',
  true,
  8388608,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "character images uploaded by owner" on storage.objects;
create policy "character images uploaded by owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'character-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "character images updated by owner" on storage.objects;
create policy "character images updated by owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'character-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'character-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "character images deleted by owner" on storage.objects;
create policy "character images deleted by owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'character-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

commit;
