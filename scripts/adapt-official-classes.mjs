import fs from "node:fs";

const path = new URL("../lib/game/official-classes.json", import.meta.url);
const catalog = JSON.parse(fs.readFileSync(path, "utf8"));

const movementDamage = new Map([
  ["passos-sobre-corpos", 0.7],
  ["respiracao-controlada", 0.7],
  ["segunda-forma", 0.7],
  ["sequencia-brutal", 0.7],
  ["assalto-invisivel", 0.75],
  ["corte-sem-som", 0.75],
  ["travessia-relampago", 1.5],
  ["avanco-com-escudo", 1.05],
]);

const utilityCorrections = new Set([
  "fim-da-linha",
  "um-tiro-um-destino",
  "mil-cortes-em-um",
  "exercito-de-um-homem",
  "corpo-de-nevoa",
  "sombra-costurada",
  "sinfonia-de-guerra",
]);

function decimal(value) {
  return String(value).replace(".", ",");
}

function adaptSkill(skill) {
  let effect = skill.effect
    .replaceAll("ignorando 0,15x DEF", "ignorando 15% da DEF")
    .replaceAll("ignora 0,2x RES", "ignora 20% da RES")
    .replaceAll("quebrando 0,25x DEF", "quebrando 25% da DEF")
    .replaceAll("recebe 0,25x FOR", "recebe 25% de FOR")
    .replaceAll("recebe 0,2x INI", "recebe 20% de INI")
    .replaceAll("e 0,2x RES", "e 20% de RES")
    .replaceAll("e 0,12x INI", "e 12% de INI");

  const missing = movementDamage.get(skill.key);
  if (missing) {
    effect = effect.replace(/(70|75|105|150)% de FOR/g, `${decimal(missing)}x FOR`);
    skill.kind = "damage";
    skill.damageType = "physical";
    skill.target = skill.area > 0 ? "area" : "enemy";
    skill.scaling = [{ attribute: "FOR", multiplier: missing }];
  }

  skill.effect = effect;
  skill.scaling = skill.scaling.filter((entry) => {
    if (entry.attribute === "DEF" && /ignorando 15%|quebrando 25%/.test(effect)) return false;
    if (entry.attribute === "RES" && /ignora 20%|20% de RES/.test(effect)) return false;
    if (entry.attribute === "INI" && /(?:12|20)% de INI/.test(effect)) return false;
    return true;
  });

  if (utilityCorrections.has(skill.key)) {
    skill.kind = "utility";
    skill.damageType = "none";
    skill.scaling = [];
  }

  if (/Restaura 1,8x ARC.+escudo de 1,2x ARC/.test(effect)) {
    skill.scaling = [{ attribute: "ARC", multiplier: 1.8 }];
  }
  if (/escudo de 1,1x ARC e 20% de RES/.test(effect)) {
    skill.scaling = [{ attribute: "ARC", multiplier: 1.1 }];
  }
  if (skill.kind === "shield") {
    skill.target = /aliad[oa]/i.test(effect) ? "ally" : "self";
  }
  if (skill.kind === "heal" && /recupera|restaura/i.test(effect)) {
    skill.target = /aliad[oa]|todos os aliados/i.test(effect) ? "ally" : "self";
  }
  return skill;
}

for (const entry of catalog) {
  entry.payload.progression = entry.payload.progression.map(adaptSkill);
  for (const classPath of entry.payload.paths) classPath.skills = classPath.skills.map(adaptSkill);
}

fs.writeFileSync(path, `${JSON.stringify(catalog, null, 2)}\n`);
