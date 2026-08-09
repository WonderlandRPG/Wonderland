import fs from "node:fs";

const source = new URL("../lib/game/official-classes.json", import.meta.url);
const destination = new URL(
  "../supabase/migrations/202608090003_official_classes.sql",
  import.meta.url,
);
const catalog = JSON.parse(fs.readFileSync(source, "utf8"));

const values = catalog
  .map((entry) => {
    const payload = JSON.stringify(entry.payload);
    return `  ('class', '${entry.slug}', '${entry.name.replaceAll("'", "''")}', 'published', $class$${payload}$class$::jsonb, now())`;
  })
  .join(",\n");

const sql = `-- Generated from lib/game/official-classes.json.
-- Attribute scaling is expressed as multipliers; percentages are reserved for modifiers.
insert into public.v2_content (content_type, slug, name, status, payload, published_at)
values
${values}
on conflict (content_type, slug) do update
set name = excluded.name,
    status = 'published',
    payload = excluded.payload,
    published_at = coalesce(public.v2_content.published_at, now()),
    updated_at = now()
where public.v2_content.name is distinct from excluded.name
   or public.v2_content.status is distinct from 'published'
   or public.v2_content.payload is distinct from excluded.payload;
`;

fs.writeFileSync(destination, sql);
