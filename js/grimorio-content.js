"use strict";

/*
 * Grimório oficial de Wonderland.
 * Os registros abaixo são gerados exclusivamente a partir dos dados já
 * existentes em window.WONDERLAND_CLASSES. Nenhuma habilidade é inventada.
 */
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
      ["buff", "Fortalecimento"], ["fortalecimento", "Fortalecimento"],
      ["debuff", "Enfraquecimento"], ["reduz", "Enfraquecimento"],
      ["ultimate", "Ultimate"]
    ];
    map.forEach(([needle, tag]) => {
      if (text.includes(needle) && !tags.includes(tag)) tags.push(tag);
    });
    return tags.slice(0, 4);
  };

  const extractCost = (descricao) => {
    const text = String(descricao || "");
    const patterns = [
      { regex: /custa\s+(\d+)\s*mana/i, type: "Mana" },
      { regex: /consome\s+(\d+)\s*mana/i, type: "Mana" },
      { regex: /gasta\s+(\d+)\s*mana/i, type: "Mana" },
      { regex: /custa\s+(\d+)\s*energia/i, type: "Energia" },
      { regex: /consome\s+(\d+)\s*energia/i, type: "Energia" },
      { regex: /gasta\s+(\d+)\s*energia/i, type: "Energia" },
      { regex: /custa\s+(\d+)%\s*do\s*hp/i, type: "HP" },
      { regex: /consome\s+(\d+)%\s*do\s*hp/i, type: "HP" },
      { regex: /gasta\s+(\d+)%\s*do\s*hp/i, type: "HP" },
      { regex: /custa\s+(\d+)\s*f[úu]ria/i, type: "Fúria" },
      { regex: /consome\s+(\d+)\s*f[úu]ria/i, type: "Fúria" },
      { regex: /gasta\s+(\d+)\s*f[úu]ria/i, type: "Fúria" },
      { regex: /custa\s+(\d+)\s*reagentes?/i, type: "Reagente" },
      { regex: /consome\s+(\d+)\s*reagentes?/i, type: "Reagente" },
      { regex: /gasta\s+(\d+)\s*reagentes?/i, type: "Reagente" }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const suffix = pattern.type === "HP" ? "% do HP" : pattern.type;
        return {
          type: pattern.type,
          value: Number(match[1]),
          label: `${match[1]} ${suffix}`
        };
      }
    }

    return {
      type: "Pendente",
      value: null,
      label: "Custo não definido"
    };
  };

  const extractCooldown = (descricao, fallback = "Não definida") => {
    const text = String(descricao || "");
    const match = text.match(/recarga\s+de\s+(\d+)\s*turnos?/i);
    return match ? `${match[1]} turnos` : fallback;
  };

  Object.values(classes).forEach((classe) => {
    const atributo = inferAttribute(classe);

    (classe.passivas || []).forEach((passiva, index) => {
      records.push({
        id: `${classe.id}-passiva-${slugify(passiva.nome || index)}`,
        nome: passiva.nome,
        categoria: "Passiva",
        origemTipo: "Classe",
        origem: classe.nome,
        nivel: "Passiva inicial",
        atributo,
        custo: "Sem custo",
        custoEstruturado: { type: "Sem custo", value: 0, label: "Sem custo" },
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
      const nivel = String(skill.nivel || "").replace(/[^0-9]/g, "") || "—";
      const cost = extractCost(skill.descricao);
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
        observacoes: cost.type === "Pendente"
          ? `Habilidade oficial da progressão da classe ${classe.nome}. O custo ainda precisa ser definido no balanceamento.`
          : `Habilidade oficial da progressão da classe ${classe.nome}.`
      });
    });

    (classe.caminhos || []).forEach((caminho, pathIndex) => {
      if (caminho.passiva) {
        records.push({
          id: `${classe.id}-caminho-${slugify(caminho.id || pathIndex)}-passiva`,
          nome: caminho.passiva.nome,
          categoria: "Passiva de Caminho",
          origemTipo: "Caminho",
          origem: `${classe.nome} — ${caminho.nome}`,
          nivel: 50,
          atributo,
          custo: "Sem custo",
          custoEstruturado: { type: "Sem custo", value: 0, label: "Sem custo" },
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
        const cost = extractCost(skill.descricao);
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
          recarga: extractCooldown(skill.descricao, isUltimate ? "Conforme descrição" : "Não definida"),
          alcance: "Conforme descrição",
          area: isUltimate ? "Poder Supremo" : "Conforme descrição",
          tags: [isUltimate ? "Ultimate" : "Caminho", ...inferTags(skill.tipo, skill.descricao)],
          descricao: skill.descricao,
          efeito: skill.descricao,
          observacoes: cost.type === "Pendente"
            ? `${isUltimate ? "Ultimate" : "Habilidade"} oficial do caminho ${caminho.nome}. O custo ainda precisa ser definido no balanceamento.`
            : `${isUltimate ? "Ultimate" : "Habilidade"} oficial do caminho ${caminho.nome}.`
        });
      });
    });
  });

  window.WONDERLAND_GRIMORIO = records;
})();
