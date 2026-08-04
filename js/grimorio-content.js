"use strict";

/* Grimório oficial de Wonderland, gerado a partir das classes existentes. */
(function () {
  const classes = window.WONDERLAND_CLASSES || {};
  const records = [];

  const slugify = (value) => String(value || "registro")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const inferAttribute = (classe) => {
    const source = String(classe?.estilo?.atributos || "").toUpperCase();
    return ["FOR", "DEF", "RES", "INI", "INT", "ARC"].find((attr) => source.includes(attr)) || "—";
  };

  const inferTags = (categoria, descricao) => {
    const text = `${categoria || ""} ${descricao || ""}`.toLowerCase();
    const tags = [];
    const map = [
      ["área", "Área"], ["area", "Área"], ["controle", "Controle"],
      ["cura", "Cura"], ["escudo", "Escudo"], ["invoca", "Invocação"],
      ["mobilidade", "Mobilidade"], ["execução", "Execução"],
      ["provoca", "Provocação"], ["dano contínuo", "Dano contínuo"],
      ["fortalecimento", "Fortalecimento"], ["reduz", "Enfraquecimento"],
      ["ultimate", "Ultimate"]
    ];
    map.forEach(([needle, tag]) => {
      if (text.includes(needle) && !tags.includes(tag)) tags.push(tag);
    });
    return tags.slice(0, 4);
  };

  const explicitCost = (descricao) => {
    const text = String(descricao || "");
    const patterns = [
      { regex: /(?:custa|consome|gasta)\s+(\d+)\s*mana/i, type: "Mana" },
      { regex: /(?:custa|consome|gasta)\s+(\d+)\s*energia/i, type: "Energia" },
      { regex: /(?:custa|consome|gasta)\s+(\d+)%\s*do\s*hp/i, type: "HP" },
      { regex: /(?:custa|consome|gasta)\s+(\d+)\s*f[úu]ria/i, type: "Fúria" },
      { regex: /(?:custa|consome|gasta)\s+(\d+)\s*reagentes?/i, type: "Reagente" }
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const suffix = pattern.type === "HP" ? "% do HP" : pattern.type;
        return { type: pattern.type, value: Number(match[1]), label: `${match[1]} ${suffix}` };
      }
    }
    return null;
  };

  const classResourceType = (classe) => {
    const resource = `${classe?.recurso?.nome || ""} ${classe?.estilo?.secundaria || ""}`.toLowerCase();
    if (resource.includes("fúria")) return "Fúria";
    if (resource.includes("reagente")) return "Reagente";
    if (resource.includes("energia")) return "Energia";
    if (resource.includes("sangue") || resource.includes("vida")) return "HP";
    if (resource.includes("mana")) return "Mana";
    const role = String(classe?.cargo || "").toLowerCase();
    if (role.includes("mágico") || role.includes("magico") || role.includes("suporte") || role.includes("invocador")) return "Mana";
    if (role.includes("assassino") || role.includes("infiltração") || role.includes("infiltracao") || role.includes("arqueiro")) return "Energia";
    return "Sem custo";
  };

  const costByLevel = (type, level, isUltimate, isPassive) => {
    if (isPassive || type === "Sem custo") return { type: "Sem custo", value: 0, label: "Sem custo" };
    const n = Number(level) || 1;
    let value;
    if (type === "Mana") value = Math.min(120, 20 + Math.round(n * 0.9) + (isUltimate ? 25 : 0));
    else if (type === "Energia") value = Math.min(80, 15 + Math.round(n * 0.45) + (isUltimate ? 20 : 0));
    else if (type === "Fúria") value = isUltimate ? 10 : Math.max(2, Math.min(8, Math.ceil(n / 15) + 1));
    else if (type === "Reagente") value = isUltimate ? 3 : (n >= 60 ? 2 : 1);
    else if (type === "HP") value = isUltimate ? 18 : Math.max(4, Math.min(12, Math.ceil(n / 10) + 3));
    else return { type: "Sem custo", value: 0, label: "Sem custo" };
    const label = type === "HP" ? `${value}% do HP` : `${value} ${type}`;
    return { type, value, label };
  };

  const resolveCost = (classe, descricao, level, isUltimate = false, isPassive = false) => {
    return explicitCost(descricao) || costByLevel(classResourceType(classe), level, isUltimate, isPassive);
  };

  const extractCooldown = (descricao, fallback = "Não definida") => {
    const match = String(descricao || "").match(/recarga\s+de\s+(\d+)\s*turnos?/i);
    return match ? `${match[1]} turnos` : fallback;
  };

  Object.values(classes).forEach((classe) => {
    const atributo = inferAttribute(classe);

    (classe.passivas || []).forEach((passiva, index) => {
      const cost = resolveCost(classe, passiva.descricao, 1, false, true);
      records.push({
        id: `${classe.id}-passiva-${slugify(passiva.nome || index)}`,
        nome: passiva.nome,
        categoria: "Passiva",
        origemTipo: "Classe",
        origem: classe.nome,
        nivel: "Passiva inicial",
        atributo,
        custo: cost.label,
        custoEstruturado: cost,
        recarga: "Permanente",
        alcance: "Próprio",
        area: "Efeito permanente",
        tags: ["Passiva", ...inferTags("Passiva", passiva.descricao)],
        descricao: passiva.descricao,
        efeito: passiva.descricao,
        observacoes: `Mecânica passiva oficial da classe ${classe.nome}.`
      });
    });

    (classe.progressao || []).forEach((skill, index) => {
      const nivel = String(skill.nivel || "").replace(/[^0-9]/g, "") || "1";
      const cost = resolveCost(classe, skill.descricao, nivel);
      records.push({
        id: `${classe.id}-nivel-${nivel}-${slugify(skill.nome || index)}`,
        nome: skill.nome,
        categoria: skill.categoria || "Habilidade",
        origemTipo: "Classe",
        origem: classe.nome,
        nivel,
        atributo,
        custo: cost.label,
        custoEstruturado: cost,
        recarga: extractCooldown(skill.descricao),
        alcance: "Conforme descrição",
        area: skill.categoria || "Conforme descrição",
        tags: inferTags(skill.categoria, skill.descricao),
        descricao: skill.descricao,
        efeito: skill.descricao,
        observacoes: `Habilidade oficial da progressão da classe ${classe.nome}.`
      });
    });

    (classe.caminhos || []).forEach((caminho, pathIndex) => {
      if (caminho.passiva) {
        const cost = resolveCost(classe, caminho.passiva.descricao, 50, false, true);
        records.push({
          id: `${classe.id}-caminho-${slugify(caminho.id || pathIndex)}-passiva`,
          nome: caminho.passiva.nome,
          categoria: "Passiva de Caminho",
          origemTipo: "Caminho",
          origem: `${classe.nome} — ${caminho.nome}`,
          nivel: 50,
          atributo,
          custo: cost.label,
          custoEstruturado: cost,
          recarga: "Permanente",
          alcance: "Próprio",
          area: "Efeito permanente",
          tags: ["Passiva", "Caminho"],
          descricao: caminho.passiva.descricao,
          efeito: caminho.passiva.descricao,
          observacoes: `Passiva oficial do caminho ${caminho.nome}.`
        });
      }

      const unlockLevels = [60, 70, 80, 90, 100];
      (caminho.habilidades || []).forEach((skill, index) => {
        const level = unlockLevels[index] || 100;
        const isUltimate = String(skill.tipo || "").toLowerCase() === "ultimate";
        const cost = resolveCost(classe, skill.descricao, level, isUltimate);
        records.push({
          id: `${classe.id}-caminho-${slugify(caminho.id || pathIndex)}-${slugify(skill.nome || index)}`,
          nome: skill.nome,
          categoria: isUltimate ? "Ultimate" : "Habilidade de Caminho",
          origemTipo: "Caminho",
          origem: `${classe.nome} — ${caminho.nome}`,
          nivel: level,
          atributo,
          custo: cost.label,
          custoEstruturado: cost,
          recarga: extractCooldown(skill.descricao, isUltimate ? "Uma vez por combate" : "Não definida"),
          alcance: "Conforme descrição",
          area: isUltimate ? "Poder Supremo" : "Conforme descrição",
          tags: [isUltimate ? "Ultimate" : "Caminho", ...inferTags(skill.tipo, skill.descricao)],
          descricao: skill.descricao,
          efeito: skill.descricao,
          observacoes: `${isUltimate ? "Ultimate" : "Habilidade"} oficial do caminho ${caminho.nome}.`
        });
      });
    });
  });

  window.WONDERLAND_GRIMORIO = records;
})();
