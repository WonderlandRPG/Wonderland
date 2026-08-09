import { readFileSync, writeFileSync } from "node:fs";

const catalog = JSON.parse(
  readFileSync(new URL("../lib/game/official-classes.json", import.meta.url), "utf8"),
);
const paths = catalog.map((entry) => ({ slug: entry.slug, paths: entry.payload.paths }));
const payload = JSON.stringify(paths).replaceAll("$paths$", "");
const sql = `-- Habilidades estruturadas concedidas pelos Caminhos de classe.
begin;

update public.v2_content content
set payload = jsonb_set(content.payload, '{paths}', source.entry->'paths', true),
    updated_at = now()
from jsonb_array_elements($paths$${payload}$paths$::jsonb) source(entry)
where content.content_type = 'class'
  and content.slug = source.entry->>'slug';

commit;
`;

const destination = process.argv[2];
if (!destination) throw new Error("Informe o arquivo de migração.");
writeFileSync(new URL(`../${destination}`, import.meta.url), sql);
