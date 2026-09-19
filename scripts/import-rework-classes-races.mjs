import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const reworkRoot = path.resolve(root, "../wonderland-rework");

async function loadModule(relativePath) {
  const source = fs.readFileSync(path.join(reworkRoot, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

const classModule = await loadModule("lib/game/classes.ts");
const raceModule = await loadModule("lib/game/races.ts");

const slug = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const classes = classModule.classes.map((gameClass) => ({
  contractVersion: 2,
  id: gameClass.id,
  name: gameClass.name,
  sigil: gameClass.sigil,
  role: gameClass.role,
  description: gameClass.identity,
  abilities: classModule.classTalentSlots(gameClass).map((slot, index) => ({
    id: `${gameClass.id}-${index}`,
    iconUrl: `/assets/skills/classes/${gameClass.id}/${index}.webp`,
    kind: slot.ability.kind,
    name: slot.ability.name,
    description: slot.ability.description,
    unlockLevel: slot.ability.unlock,
    cooldown: slot.ability.cooldown ?? "Sem recarga",
    combat: slot.combat,
    variants: slot.options.slice(1).map((option, optionIndex) => ({
      id: `${gameClass.id}-${index}-${slug(option.name)}`,
      pathId: slug(gameClass.paths[optionIndex].name),
      pathName: gameClass.paths[optionIndex].name,
      name: option.title,
      description: option.description,
      unlockLevel: option.unlock,
      combat: option.combat,
    })),
  })),
  paths: gameClass.paths.map((talentPath) => ({
    id: slug(talentPath.name),
    name: talentPath.name,
    description: talentPath.fantasy,
  })),
}));

const races = raceModule.races.map((race) => ({
  contractVersion: 2,
  id: race.id,
  name: race.name,
  epithet: race.epithet,
  sigil: race.sigil,
  description: race.identity,
  baseStats: race.stats,
  powers: race.powers.map((power, index) => ({
    id: `${race.id}-${index}`,
    iconUrl: `/assets/skills/races/${race.id}/${index}.webp`,
    unlockLevel: index === 0 ? 1 : index === 1 ? 1 : 5,
    ...power,
  })),
}));

fs.writeFileSync(
  path.join(root, "lib/game/rework-classes.json"),
  `${JSON.stringify(classes, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "lib/game/rework-races.json"),
  `${JSON.stringify(races, null, 2)}\n`,
);

console.log(`Imported ${classes.length} classes and ${races.length} races.`);
