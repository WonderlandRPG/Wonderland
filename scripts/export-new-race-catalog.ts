import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { officialRaces } from "../lib/game/official-races";

const root = resolve(import.meta.dirname, "..");
const json = JSON.stringify(officialRaces, null, 2);
const compactJson = JSON.stringify(officialRaces).replaceAll("$races$", "");

writeFileSync(resolve(root, "lib/game/official-races.json"), `${json}\n`);

const migration = `-- Catálogo de raças v2: habilidades orientadas a dados.
-- Autorizado apagar personagens e substituir todas as raças em 2026-08-10.
begin;

delete from public.v2_characters;
delete from public.v2_content where content_type = 'race';

insert into public.v2_content (content_type, slug, name, status, payload, published_at)
select
  'race',
  entry->>'slug',
  entry->>'name',
  'published',
  entry->'payload',
  now()
from jsonb_array_elements($races$${compactJson}$races$::jsonb) as entry;

commit;
`;

const migrationPath = process.argv[2];
if (!migrationPath) throw new Error("Informe o caminho da migração como primeiro argumento.");
writeFileSync(resolve(root, migrationPath), migration);
