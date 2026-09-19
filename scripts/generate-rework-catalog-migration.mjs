import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const classes = JSON.parse(fs.readFileSync(path.join(root, "lib/game/rework-classes.json"), "utf8"));
const races = JSON.parse(fs.readFileSync(path.join(root, "lib/game/rework-races.json"), "utf8"));
const migrationId = "20260919120000_rework_classes_races_v2";
const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;
const rows = [...classes.map((payload) => ["class", payload]), ...races.map((payload) => ["race", payload])];
const values = rows.map(([type, payload]) =>
  `  (${sqlString(type)}, ${sqlString(payload.id)}, ${sqlString(payload.name)}, ${sqlString(JSON.stringify(payload))}::jsonb)`,
).join(",\n");

const migration = `-- Catálogo canônico do Rework. Não importa contas, personagens ou sessões.\n\ncreate table if not exists public.v2_rework_catalog_backups (\n  migration_key text not null,\n  content_id uuid not null references public.v2_content(id) on delete cascade,\n  content_type text not null,\n  slug text not null,\n  name text not null,\n  status text not null,\n  payload jsonb not null,\n  published_at timestamptz,\n  backed_up_at timestamptz not null default now(),\n  primary key (migration_key, content_id)\n);\n\nrevoke all on public.v2_rework_catalog_backups from public, anon, authenticated;\n\ninsert into public.v2_rework_catalog_backups\n  (migration_key, content_id, content_type, slug, name, status, payload, published_at)\nselect\n  '${migrationId}', id, content_type, slug, name, status, payload, published_at\nfrom public.v2_content\nwhere content_type in ('class', 'race')\non conflict (migration_key, content_id) do nothing;\n\nwith source(content_type, slug, name, payload) as (\nvalues\n${values}\n)\nupdate public.v2_content target\nset name = source.name,\n    payload = source.payload,\n    status = 'published',\n    published_at = coalesce(target.published_at, now()),\n    updated_at = now()\nfrom source\nwhere target.content_type = source.content_type\n  and target.slug = source.slug;\n\n-- A migração deve falhar em vez de deixar um catálogo parcialmente trocado.\ndo $$\nbegin\n  if (select count(*) from public.v2_content where content_type = 'class' and payload->>'contractVersion' = '2') <> 17 then\n    raise exception 'Catálogo Rework incompleto: esperado 17 classes';\n  end if;\n  if (select count(*) from public.v2_content where content_type = 'race' and payload->>'contractVersion' = '2') <> 11 then\n    raise exception 'Catálogo Rework incompleto: esperado 11 raças';\n  end if;\nend $$;\n`;

const rollback = `-- Restaura somente classes e raças capturadas antes da migração do Rework.\nupdate public.v2_content target\nset name = backup.name,\n    status = backup.status,\n    payload = backup.payload,\n    published_at = backup.published_at,\n    updated_at = now()\nfrom public.v2_rework_catalog_backups backup\nwhere backup.migration_key = '${migrationId}'\n  and backup.content_id = target.id;\n\ndelete from public.v2_rework_catalog_backups where migration_key = '${migrationId}';\n`;

fs.writeFileSync(path.join(root, "supabase/migrations", `${migrationId}.sql`), migration);
fs.writeFileSync(path.join(root, "supabase/rollbacks", `${migrationId}.rollback.sql`), rollback);
console.log(`Generated ${rows.length} reversible catalog updates.`);
