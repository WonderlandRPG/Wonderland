"use strict";

(async function () {
  const account = window.WONDERLAND_ACCOUNT;
  const store = window.WONDERLAND_CONTENT_STORE;
  const characterId = new URLSearchParams(window.location.search).get("id");
  const target = document.getElementById("sheetSkills");
  const summary = document.getElementById("sheetSkillsSummary");

  if (!account || !store || !characterId || !target || !summary) return;

  const attrs = ["FOR", "DEF", "RES", "INI", "INT", "ARC"];
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

  function getFinalAttributes(row) {
    return Object.fromEntries(attrs.map((attr) => {
      const key = attr.toLowerCase();
      const value = Number(row?.[`base_${key}`] || 20)
        + Number(row?.[`allocated_${key}`] || 0)
        + Number(row?.[`racial_${key}`] || 0);
      return [attr, value];
    }));
  }

  function applyStructuredScale(description, row) {
    let result = stripHtml(description);
    const percent = Number(row?.scale_percent);
    const attribute = String(row?.scale_attribute || "").toUpperCase();

    if (!row?._cms || !Number.isFinite(percent) || percent <= 0 || !attrs.includes(attribute)) {
      return result;
    }

    const value = Number.isInteger(percent) ? percent : percent.toLocaleString("pt-BR");
    const replacement = `${value}% de ${attribute}`;
    const pattern = new RegExp(`\\d+(?:[.,]\\d+)?%\\s+(?:do|de|da)\\s+(?:seu\\s+)?${attribute}`, "i");
    return pattern.test(result)
      ? result.replace(pattern, replacement)
      : `${result}${result ? " " : ""}Escala: ${replacement}.`;
  }

  function classifyEffect(description, category) {
    const source = `${description || ""} ${category || ""}`.toLowerCase();
    if (source.includes("cura") || source.includes("restaura") || source.includes("recupera")) return "Cura final";
    if (source.includes("escudo") || source.includes("proteção") || source.includes("protecao")) return "Escudo final";
    if (source.includes("dano")) return "Dano final";
    return "Efeito calculado";
  }

  function finalEffect(description, category, finalAttrs) {
    const matches = [...String(description || "").matchAll(
      /(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC)/gi
    )];

    if (!matches.length) return null;

    const values = matches.map((match) => {
      const percent = Number(match[1].replace(",", "."));
      const attr = match[2].toUpperCase();
      const base = Number(finalAttrs[attr] || 0);
      return { percent, attr, base, total: Math.round(base * (percent / 100)) };
    });

    return {
      label: classifyEffect(description, category),
      total: values.reduce((sum, item) => sum + item.total, 0),
      details: values.map((item) => `${item.percent}% de ${item.attr} (${item.base}) = ${item.total}`).join(" + ")
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
    const [sheetReady, sheet] = await Promise.all([
      waitForSheet(),
      account.getCharacterSheet(characterId)
    ]);

    if (!sheetReady || !sheet?.character) return;

    const content = await store.characterContent(sheet.character);
    const finalAttrs = getFinalAttributes(sheet.attributes);
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

    summary.textContent = `${rows.length} habilidade(s) e passiva(s) disponíveis no nível ${sheet.character.level}. Dados sincronizados com o painel administrativo.`;

    target.innerHTML = rows.length
      ? rows.map((row) => {
          const description = applyStructuredScale(row.description, row);
          const category = row.passive ? "Passiva" : row.category || "Habilidade";
          const level = row.passive ? (row.source_type === "path" ? 50 : 1) : Number(row.unlock_level || 1);
          const mana = Number(row.mana_cost || 0);
          const cost = row.passive || mana <= 0 ? "Sem custo" : `${mana} Mana`;
          const effect = finalEffect(description, category, finalAttrs);
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
