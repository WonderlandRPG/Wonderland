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

  const getCost = (classe, skill, level, options = {}) => {
    return window.WONDERLAND_SKILL_COSTS?.infer(classe, skill, level, options)
      || { type: "Sem custo", value: 0, label: "Sem custo" };
  };

  const extractCooldown = (descricao, fallback = "Não definida") => {
    const match = String(descricao || "").match(/recarga\s+de\s+(\d+)\s*turnos?/i);
    return match ? `${match[1]} turnos` : fallback;
  };

  Object.values(classes).forEach((classe) => {
    const atributo = inferAttribute(classe);

    (classe.passivas || []).forEach((passiva, index) => {
      const cost = getCost(classe, passiva, 1, { passive: true });
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
      const cost = getCost(classe, skill, Number(nivel));
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
        const cost = getCost(classe, caminho.passiva, 50, { passive: true, path: true });
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
        const cost = getCost(classe, skill, level, { ultimate: isUltimate, path: true });
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
