"use strict";

(function () {
  const ATTRIBUTES = ["FOR", "DEF", "RES", "INI", "INT", "ARC"];

  const slugify = (value) => String(value || "registro")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const inferTags = (category, description) => {
    const source = `${category || ""} ${description || ""}`.toLowerCase();
    const tags = [];
    const map = [
      ["área", "Área"], ["area", "Área"], ["controle", "Controle"],
      ["cura", "Cura"], ["escudo", "Escudo"], ["invoca", "Invocação"],
      ["mobilidade", "Mobilidade"], ["execução", "Execução"],
      ["provoca", "Provocação"], ["dano contínuo", "Dano contínuo"],
      ["fortalecimento", "Fortalecimento"], ["reduz", "Enfraquecimento"],
      ["ultimate", "Ultimate"], ["passiva", "Passiva"]
    ];

    map.forEach(([needle, tag]) => {
      if (source.includes(needle) && !tags.includes(tag)) tags.push(tag);
    });

    return tags.slice(0, 4);
  };

  function formatScale(description, row) {
    let result = String(description || "");
    const percent = Number(row?.scale_percent);
    const attribute = String(row?.scale_attribute || "").toUpperCase();

    if (!row?._cms || !Number.isFinite(percent) || percent <= 0 || !ATTRIBUTES.includes(attribute)) {
      return result;
    }

    const value = Number.isInteger(percent) ? percent : percent.toLocaleString("pt-BR");
    const replacement = `${value}% de ${attribute}`;
    const pattern = new RegExp(`\\d+(?:[.,]\\d+)?%\\s+(?:do|de|da)\\s+(?:seu\\s+)?${attribute}`, "i");

    return pattern.test(result)
      ? result.replace(pattern, replacement)
      : `${result}${result ? " " : ""}Escala: ${replacement}.`;
  }

  function originInfo(data, row) {
    if (row.source_type === "race") {
      const race = data.races.find((item) => item.id === row.race_id);
      return { type: "Raça", name: race?.name || row.race_id || "Raça" };
    }

    if (row.source_type === "path") {
      const path = data.paths.find((item) => item.id === row.class_path_id);
      const cls = data.classes.find((item) => item.id === (path?.class_id || row.class_id));
      return {
        type: "Caminho",
        name: [cls?.name, path?.name || row.class_path_id].filter(Boolean).join(" — ") || "Caminho"
      };
    }

    const cls = data.classes.find((item) => item.id === row.class_id);
    return { type: "Classe", name: cls?.name || row.class_id || "Classe" };
  }

  function attributeFor(data, row) {
    if (row.scale_attribute) return String(row.scale_attribute).toUpperCase();
    const cls = data.classes.find((item) => item.id === row.class_id);
    return cls?.primary_attribute || "—";
  }

  function costFor(row) {
    const mana = Number(row.mana_cost || 0);
    return mana > 0
      ? { type: "Mana", value: mana, label: `${mana} Mana` }
      : { type: "Sem custo", value: 0, label: "Sem custo" };
  }

  function cooldownFor(row, passive = false) {
    if (passive) return "Permanente";
    const turns = Number(row.cooldown_turns || 0);
    if (turns > 0) return `${turns} ${turns === 1 ? "turno" : "turnos"}`;
    if (row.is_ultimate) return "Uma vez por combate";
    return "Não definida";
  }

  function rangeFor(row, passive = false) {
    if (passive) return "Próprio";
    const range = Number(row.range_cells || 0);
    return range > 0 ? `${range} ${range === 1 ? "casa" : "casas"}` : "Conforme descrição";
  }

  function areaFor(row, passive = false) {
    if (passive) return "Efeito permanente";
    const area = Number(row.area_cells || 0);
    return area > 0 ? `${area} ${area === 1 ? "casa" : "casas"}` : "Conforme descrição";
  }

  async function buildRecords() {
    const store = window.WONDERLAND_CONTENT_STORE;
    const data = store
      ? await store.load({ force: true })
      : { races: [], classes: [], paths: [], skills: [], passives: [], mechanics: [] };

    const records = [];

    (data.passives || []).forEach((passive, index) => {
      const origin = originInfo(data, passive);
      const description = String(passive.description || "");
      records.push({
        id: passive.passive_key || `passiva-${index}-${slugify(passive.name)}`,
        nome: passive.name || "Passiva",
        categoria: passive.source_type === "path" ? "Passiva de Caminho" : "Passiva",
        origemTipo: origin.type,
        origem: origin.name,
        nivel: passive.source_type === "path" ? 50 : "Passiva inicial",
        atributo: attributeFor(data, passive),
        custo: "Sem custo",
        custoEstruturado: { type: "Sem custo", value: 0, label: "Sem custo" },
        recarga: "Permanente",
        alcance: "Próprio",
        area: "Efeito permanente",
        tags: ["Passiva", ...inferTags("Passiva", description)],
        descricao: description,
        efeito: description,
        observacoes: `${origin.type} oficial: ${origin.name}.`
      });
    });

    (data.skills || []).forEach((skill, index) => {
      const origin = originInfo(data, skill);
      const description = formatScale(skill.description, skill);
      const cost = costFor(skill);
      const category = skill.is_ultimate
        ? "Ultimate"
        : skill.source_type === "path"
          ? "Habilidade de Caminho"
          : skill.category || "Habilidade";

      records.push({
        id: skill.skill_key || `habilidade-${index}-${slugify(skill.name)}`,
        nome: skill.name || "Habilidade",
        categoria: category,
        origemTipo: origin.type,
        origem: origin.name,
        nivel: Number(skill.unlock_level || 1),
        atributo: attributeFor(data, skill),
        custo: cost.label,
        custoEstruturado: cost,
        recarga: cooldownFor(skill),
        alcance: rangeFor(skill),
        area: areaFor(skill),
        tags: inferTags(`${category} ${skill.damage_type || ""}`, description),
        descricao: description,
        efeito: description,
        observacoes: `${category} oficial de ${origin.name}.`
      });
    });

    (data.mechanics || []).forEach((mechanic, index) => {
      const origin = originInfo(data, mechanic);
      const description = String(mechanic.description || "");
      records.push({
        id: mechanic.mechanic_key || `mecanica-${index}-${slugify(mechanic.name)}`,
        nome: mechanic.name || "Mecânica",
        categoria: "Mecânica",
        origemTipo: origin.type,
        origem: origin.name,
        nivel: "Permanente",
        atributo: attributeFor(data, mechanic),
        custo: "Conforme gatilhos",
        custoEstruturado: { type: "Mecânica", value: 0, label: "Conforme gatilhos" },
        recarga: "Conforme regras",
        alcance: "Conforme descrição",
        area: "Conforme descrição",
        tags: ["Mecânica", ...inferTags("Mecânica", description)],
        descricao: description,
        efeito: description,
        observacoes: `Mecânica oficial de ${origin.name}.`
      });
    });

    window.WONDERLAND_GRIMORIO = records;
    return records;
  }

  window.WONDERLAND_GRIMORIO_READY = buildRecords().catch((error) => {
    console.error("Não foi possível montar o Grimório pelo CMS.", error);
    window.WONDERLAND_GRIMORIO = [];
    return [];
  });
})();
