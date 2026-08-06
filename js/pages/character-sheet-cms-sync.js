"use strict";

(async function () {
  const account = window.WONDERLAND_ACCOUNT;
  const store = window.WONDERLAND_CONTENT_STORE;
  const scaling = window.WONDERLAND_SCALING;
  const characterId = new URLSearchParams(window.location.search).get("id");
  const target = document.getElementById("sheetSkills");
  const summary = document.getElementById("sheetSkillsSummary");

  if (!account || !store || !scaling || !characterId || !target || !summary) return;

  const attrs = scaling.ATTRIBUTES;
  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function stripHtml(value) {
    const source = String(value ?? "");
    if (!source.includes("<")) return source.trim();
    const template = document.createElement("template");
    template.innerHTML = source;
    return (template.content.textContent || "").replace(/\s+/g, " ").trim();
  }

  function equipmentBonuses(equipment) {
    const totals = Object.fromEntries(attrs.map((attr) => [attr, 0]));
    const seen = new Set();

    (equipment || []).forEach((item) => {
      if (item?.metadata?.linked_two_hand) return;
      const identity = `${item?.item_key || item?.id || "item"}:${item?.slot || "slot"}`;
      if (seen.has(identity)) return;
      seen.add(identity);

      Object.entries(item?.metadata?.stats || {}).forEach(([key, value]) => {
        const attribute = String(key).toUpperCase();
        if (attrs.includes(attribute)) totals[attribute] += Number(value) || 0;
      });
    });

    return totals;
  }

  function getFinalAttributes(row, equipment) {
    const bonuses = equipmentBonuses(equipment);
    return Object.fromEntries(attrs.map((attr) => {
      const key = attr.toLowerCase();
      const value = Number(row?.[`base_${key}`] || 20)
        + Number(row?.[`allocated_${key}`] || 0)
        + Number(row?.[`racial_${key}`] || 0)
        + Number(bonuses[attr] || 0);
      return [attr, value];
    }));
  }

  function normalizedDescription(row) {
    const plain = stripHtml(row.description || row.descricao || row.content || "");
    const normalized = scaling.normalizeSkill({ ...row, description: plain });
    const description = scaling.normalizeDescription(normalized.description);
    const hasScale = scaling.parseTerms(description).length > 0;

    if (row.passive || hasScale || Number(normalized.scale_multiplier || 0) <= 0) return description;
    return `${description}${description ? " " : ""}Escala principal: ${scaling.describe(normalized.scale_multiplier, normalized.scale_attribute)}.`;
  }

  function classifyEffect(description, category) {
    const source = `${description || ""} ${category || ""}`.toLowerCase();
    if (source.includes("cura") || source.includes("restaura") || source.includes("recupera")) return "Cura-base";
    if (source.includes("escudo") || source.includes("proteção") || source.includes("protecao")) return "Escudo-base";
    if (source.includes("dano")) return "Dano-base";
    return "Valor-base";
  }

  function calculatedEffect(row, description, category, finalAttrs) {
    const calculation = scaling.calculateTerms(description, finalAttrs);
    let values = calculation.terms;

    if (!values.length && !row.passive) {
      const normalized = scaling.normalizeSkill({ ...row, description });
      if (Number(normalized.scale_multiplier || 0) > 0 && normalized.scale_attribute) {
        const base = Number(finalAttrs[normalized.scale_attribute] || 0);
        values = [{
          multiplier: normalized.scale_multiplier,
          attribute: normalized.scale_attribute,
          base,
          total: scaling.calculate(normalized.scale_multiplier, base)
        }];
      }
    }

    if (!values.length) return null;

    return {
      label: classifyEffect(description, category),
      total: values.reduce((sum, item) => sum + item.total, 0),
      details: values.map((item) => `${scaling.formatMultiplier(item.multiplier)} ${item.attribute} (${item.base}) = ${item.total}`).join(" + ")
    };
  }

  function sourceLabel(row, content) {
    if (row.source_type === "race") return `Raça • ${content.race?.name || "Raça"}`;
    if (row.source_type === "path") return `Caminho • ${content.path?.name || "Caminho"}`;
    return `Classe • ${content.cls?.name || "Classe"}`;
  }

  function waitForSheet(timeout = 12000) {
    return new Promise((resolve) => {
      const started = Date.now();
      const timer = window.setInterval(() => {
        const sheet = document.getElementById("sheetContent");
        if (sheet && !sheet.hidden) {
          window.clearInterval(timer);
          resolve(true);
        } else if (Date.now() - started >= timeout) {
          window.clearInterval(timer);
          resolve(false);
        }
      }, 100);
    });
  }

  try {
    if (window.WONDERLAND_CONTENT_READY) await window.WONDERLAND_CONTENT_READY;

    const [sheetReady, sheet] = await Promise.all([
      waitForSheet(),
      account.getCharacterSheet(characterId)
    ]);

    if (!sheetReady || !sheet?.character) return;

    const content = await store.characterContent(sheet.character);
    const finalAttrs = getFinalAttributes(sheet.attributes, sheet.equipment);
    const rows = [
      ...(content.passives || []).map((row) => ({ ...row, passive: true })),
      ...(content.skills || []).map((row) => ({ ...row, passive: false }))
    ];

    const pathName = content.path?.name;
    const className = content.cls?.name || sheet.character.class_id;
    const raceName = content.race?.name || sheet.character.race_id;
    const classLabel = pathName ? `${className} — ${pathName}` : className;

    const classElement = document.getElementById("sheetClass");
    const raceElement = document.getElementById("sheetRace");
    const sheetSummary = document.getElementById("sheetSummary");
    if (classElement) classElement.textContent = classLabel;
    if (raceElement) raceElement.textContent = raceName;
    if (sheetSummary) sheetSummary.textContent = `${raceName} • ${classLabel}`;

    summary.textContent = `${rows.length} habilidade(s) e passiva(s) disponíveis no nível ${sheet.character.level}. Valores-base usam os atributos finais, incluindo equipamentos.`;

    target.innerHTML = rows.length
      ? rows.map((row) => {
          const description = normalizedDescription(row);
          const category = row.passive ? "Passiva" : row.category || "Habilidade";
          const level = row.passive ? (row.source_type === "path" ? 50 : 1) : Number(row.unlock_level || 1);
          const mana = Number(row.mana_cost || 0);
          const cost = row.passive || mana <= 0 ? "Sem custo" : `${mana} Mana`;
          const effect = calculatedEffect(row, description, category, finalAttrs);
          const effectHtml = effect
            ? `<div class="character-sheet-skill-damage"><strong>${esc(effect.label)}:</strong> <b>${esc(effect.total)}</b><small>${esc(effect.details)}</small></div>`
            : `<div class="character-sheet-skill-damage"><strong>Tipo:</strong> ${esc(category)}</div>`;

          return `<article class="character-sheet-skill">
            <header><div><small>${esc(sourceLabel(row, content))} • Nível ${esc(level)}</small><h3>${esc(row.name)}</h3></div></header>
            <p>${esc(description)}</p>
            <div class="character-sheet-skill-meta"><span>${esc(category)}</span><span>${esc(cost)}</span></div>
            ${effectHtml}
          </article>`;
        }).join("")
      : '<div class="character-sheet-empty">Nenhuma habilidade liberada neste nível.</div>';
  } catch (error) {
    console.warn("Não foi possível sincronizar a ficha com o CMS.", error);
  }
})();
