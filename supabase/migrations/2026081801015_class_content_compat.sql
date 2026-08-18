create or replace view public.v2_classes
with (security_invoker = true)
as
select id, name, payload, updated_at
from public.v2_content
where content_type = 'class';

revoke all on public.v2_classes from public, anon, authenticated;
