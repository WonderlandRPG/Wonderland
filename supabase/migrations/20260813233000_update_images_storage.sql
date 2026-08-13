insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'update-images',
  'update-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "update images admin insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'update-images' and (select public.v2_is_admin()));

create policy "update images admin delete"
on storage.objects for delete to authenticated
using (bucket_id = 'update-images' and (select public.v2_is_admin()));
