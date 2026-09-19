-- Restaura somente classes e raças capturadas antes da migração do Rework.
update public.v2_content target
set name = backup.name,
    status = backup.status,
    payload = backup.payload,
    published_at = backup.published_at,
    updated_at = now()
from public.v2_rework_catalog_backups backup
where backup.migration_key = '20260919120000_rework_classes_races_v2'
  and backup.content_id = target.id;

delete from public.v2_rework_catalog_backups where migration_key = '20260919120000_rework_classes_races_v2';
