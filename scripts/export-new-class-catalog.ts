import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { officialClasses } from "../lib/game/official-classes";

const root = resolve(import.meta.dirname, "..");
const json = JSON.stringify(officialClasses, null, 2);
const compactJson = JSON.stringify(officialClasses).replaceAll("$classes$", "");

writeFileSync(resolve(root, "lib/game/official-classes.json"), `${json}\n`);

const migration = `-- Catálogo de classes v2: operação orientada a dados.
-- Autorizado apagar personagens, classes e raças em 2026-08-10.
begin;

delete from public.v2_characters;
delete from public.v2_content where content_type in ('race', 'class', 'class_path', 'skill');

insert into public.v2_content (content_type, slug, name, status, payload, published_at)
select
  'class',
  entry->>'slug',
  entry->>'name',
  'published',
  entry->'payload',
  now()
from jsonb_array_elements($classes$${compactJson}$classes$::jsonb) as entry;

insert into public.v2_game_settings (key, category, label, description, value, status, published_at)
values (
  'arena.engine-contract',
  'arena',
  'Contrato universal do motor de combate',
  'Regras determinísticas compartilhadas pela Arena e futuras dungeons.',
  $rules$${JSON.stringify({
    version: 1,
    rounding:
      "Arredondar o resultado final para o inteiro mais próximo; frações .5 arredondam para cima.",
    eventOrder: [
      "VALIDATE_ACTION",
      "REACTION_BEFORE",
      "PAY_COST",
      "EXECUTE_OPERATIONS_IN_ORDER",
      "REACTION_ON_HIT",
      "REACTION_AFTER",
      "CHECK_DEATH",
      "START_COOLDOWN",
    ],
    buffsDebuffs:
      "Modificadores fixos são somados antes de multiplicadores; valores finais não podem ficar abaixo de 0.",
    cooldowns:
      "A recarga inicia após a resolução e diminui em 1 ao fim do turno do proprietário; não diminui no turno em que foi aplicada.",
    duration:
      "Duração N permanece por N turnos completos do proprietário do efeito e expira ao fim do último turno.",
    range:
      "Distância usa Manhattan em grade ortogonal; o alcance inclui a casa do alvo e exclui a casa do usuário.",
    area: "Área usa raio Manhattan a partir da casa escolhida e afeta somente alvos válidos.",
    movement:
      "Movimento exige rota livre; MOVE percorre casas e TELEPORT ignora a rota, mas ambos exigem destino livre.",
    death:
      "Ao chegar a 0 HP, resolva operações e reações já enfileiradas; depois o combatente morre e não pode agir.",
    reactions:
      "Reações simultâneas resolvem por INI decrescente, ordem de registro e ID como desempate estável.",
    stacking:
      "Status com a mesma chave soma acúmulos até maxStacks; duração é renovada apenas quando a operação declarar novos acúmulos.",
    chance:
      "Role um inteiro uniforme de 1 a 100; a operação ocorre quando o resultado for menor ou igual à chance.",
  })}$rules$::jsonb,
  'published',
  now()
)
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  status = 'published',
  published_at = now(),
  updated_at = now();

commit;
`;

const migrationPath = process.argv[2];
if (!migrationPath) throw new Error("Informe o caminho da migração como primeiro argumento.");
writeFileSync(resolve(root, migrationPath), migration);
