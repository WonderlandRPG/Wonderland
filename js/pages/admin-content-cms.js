"use strict";

(function () {
  const client = window.WONDERLAND_SUPABASE;
  const store = window.WONDERLAND_CONTENT_STORE;
  const host = document.getElementById("adminModuleContent");
  const title = document.getElementById("adminModuleTitle");
  const navButton = document.querySelector('[data-admin-module="content"]');

  if (!client || !host || !title || !navButton) return;

  const MODULES = {
    races: { label: "Raças", table: "races", key: "id" },
    classes: { label: "Classes", table: "classes", key: "id" },
    paths: { label: "Caminhos", table: "class_paths", key: "id" },
    skills: { label: "Habilidades", table: "skills", key: "skill_key" },
    passives: { label: "Passivas", table: "passives", key: "passive_key" },
    mechanics: { label: "Mecânicas", table: "combat_mechanics", key: "mechanic_key" }
  };

  const state = {
    module: "skills",
    rows: [],
    selected: null,
    search: "",
    catalogs: { races: [], classes: [], paths: [], skills: [], passives: [], mechanics: [] },
    assistantMessages: []
  };

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const normalize = (value) => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const parseNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };

  const ATTRIBUTE_MAP = {
    forca: "FOR",
    for: "FOR",
    defesa: "DEF",
    def: "DEF",
    resistencia: "RES",
    res: "RES",
    iniciativa: "INI",
    ini: "INI",
    inteligencia: "INT",
    int: "INT",
    arcano: "ARC",
    arc: "ARC"
  };

  function parseScale(value) {
    const match = String(value || "").match(
      /(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC|força|defesa|resistência|iniciativa|inteligência|arcano)/i
    );

    if (!match) return null;

    const rawAttribute = normalize(match[2]);
    return {
      percent: Number(match[1].replace(",", ".")),
      attribute: ATTRIBUTE_MAP[rawAttribute] || match[2].toUpperCase()
    };
  }

  function replaceScale(description, oldPercent, newPercent, attribute) {
    let result = String(description || "");
    const attr = String(attribute || "").toUpperCase();
    const value = Number.isInteger(newPercent)
      ? String(newPercent)
      : String(newPercent).replace(".", ",");

    const attributePattern = "(?:FOR|DEF|RES|INI|INT|ARC|força|defesa|resistência|iniciativa|inteligência|arcano)";
    const exact = Number.isFinite(oldPercent)
      ? new RegExp(`${String(oldPercent).replace(".", "[.,]")}%\\s+(?:do|de|da)\\s+(?:seu\\s+)?${attributePattern}`, "i")
      : null;
    const generic = new RegExp(`\\d+(?:[.,]\\d+)?%\\s+(?:do|de|da)\\s+(?:seu\\s+)?${attributePattern}`, "i");
    const replacement = `${value}% de ${attr || "FOR"}`;

    if (exact && exact.test(result)) return result.replace(exact, replacement);
    if (generic.test(result)) return result.replace(generic, replacement);
    return `${result}${result ? " " : ""}Escala: ${replacement}.`;
  }

  function currentModule() {
    return MODULES[state.module];
  }

  function rowKey(module, row) {
    return String(row?.[MODULES[module].key] ?? "");
  }

  function rowLabel(row) {
    return row.name || row.skill_key || row.passive_key || row.mechanic_key || row.id || "Registro";
  }

  function dedupeRows(module, rows) {
    const map = new Map();
    rows.forEach((row) => {
      const key = rowKey(module, row);
      if (!key) return;
      const existing = map.get(key);
      if (!existing || row._cms || !existing._cms) map.set(key, row);
    });
    return [...map.values()];
  }

  function sortRows(rows) {
    return [...rows].sort((a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
      || String(rowLabel(a)).localeCompare(String(rowLabel(b)), "pt-BR")
    );
  }

  function moduleRowsFromStore(data, module) {
    return Array.isArray(data?.[module]) ? data[module] : [];
  }

  async function queryTable(module) {
    const config = MODULES[module];
    const response = await client.from(config.table).select("*");
    if (response.error) throw response.error;
    return response.data || [];
  }

  async function refreshCatalogs(force = false) {
    const data = store
      ? await store.load({ force })
      : { races: [], classes: [], paths: [], skills: [], passives: [], mechanics: [] };

    state.catalogs = {
      races: data.races || [],
      classes: data.classes || [],
      paths: data.paths || [],
      skills: data.skills || [],
      passives: data.passives || [],
      mechanics: data.mechanics || []
    };
  }

  async function loadModule(module, options = {}) {
    state.module = module;
    if (!options.keepSearch) state.search = "";

    await refreshCatalogs(Boolean(options.force));

    const localRows = moduleRowsFromStore(state.catalogs, module);
    let databaseRows = [];

    try {
      databaseRows = await queryTable(module);
    } catch (error) {
      console.warn(`Não foi possível consultar ${MODULES[module].table}.`, error);
    }

    const merged = new Map();
    localRows.forEach((row) => {
      const key = rowKey(module, row);
      if (key) merged.set(key, { ...row, _local: !row._cms });
    });
    databaseRows.forEach((row) => {
      const key = rowKey(module, row);
      if (!key) return;
      merged.set(key, { ...(merged.get(key) || {}), ...row, _local: false, _cms: true });
    });

    state.rows = sortRows(dedupeRows(module, [...merged.values()]));

    const preferred = options.selectKey;
    if (preferred && state.rows.some((row) => rowKey(module, row) === String(preferred))) {
      state.selected = String(preferred);
    } else if (!state.rows.some((row) => rowKey(module, row) === String(state.selected))) {
      state.selected = rowKey(module, state.rows[0]);
    }

    render();
  }

  function sourceName(row) {
    if (row.source_type === "race") {
      return state.catalogs.races.find((item) => item.id === row.race_id)?.name || row.race_id || "Raça";
    }
    if (row.source_type === "path") {
      return state.catalogs.paths.find((item) => item.id === row.class_path_id)?.name || row.class_path_id || "Caminho";
    }
    if (row.source_type === "class") {
      return state.catalogs.classes.find((item) => item.id === row.class_id)?.name || row.class_id || "Classe";
    }
    return "Global";
  }

  function searchableText(row) {
    return normalize([
      rowLabel(row), row.id, row.skill_key, row.passive_key, row.mechanic_key,
      row.source_type, sourceName(row), row.description, row.category, row.role, row.specialization
    ].filter(Boolean).join(" "));
  }

  function visibleRows() {
    const query = normalize(state.search);
    if (!query) return state.rows;
    return state.rows.filter((row) => searchableText(row).includes(query));
  }

  function option(value, label, selected) {
    return `<option value="${esc(value)}" ${String(value) === String(selected) ? "selected" : ""}>${esc(label)}</option>`;
  }

  function optionsFor(type, selected) {
    if (type === "race") return state.catalogs.races.map((row) => option(row.id, row.name, selected)).join("");
    if (type === "class") return state.catalogs.classes.map((row) => option(row.id, row.name, selected)).join("");
    if (type === "path") {
      return state.catalogs.paths.map((row) => {
        const className = state.catalogs.classes.find((item) => item.id === row.class_id)?.name || row.class_id;
        return option(row.id, `${row.name} — ${className}`, selected);
      }).join("");
    }
    return "";
  }

  function field(label, name, value, type = "text", options = {}) {
    const attributes = [
      options.readonly ? "readonly" : "",
      options.min !== undefined ? `min="${esc(options.min)}"` : "",
      options.max !== undefined ? `max="${esc(options.max)}"` : "",
      options.step !== undefined ? `step="${esc(options.step)}"` : ""
    ].filter(Boolean).join(" ");

    return `<label class="admin-field ${options.wide ? "admin-field-wide" : ""}"><span>${esc(label)}</span><input name="${esc(name)}" type="${esc(type)}" value="${esc(value ?? "")}" ${attributes}></label>`;
  }

  function textarea(label, name, value, rows = 6) {
    return `<label class="admin-field admin-field-wide"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="${rows}">${esc(value ?? "")}</textarea></label>`;
  }

  function select(label, name, choices, selected, options = {}) {
    return `<label class="admin-field ${options.wide ? "admin-field-wide" : ""} ${options.className || ""}"><span>${esc(label)}</span><select name="${esc(name)}">${choices.map((choice) => option(choice.value, choice.label, selected)).join("")}</select></label>`;
  }

  function checkbox(label, name, checked) {
    return `<label class="admin-field admin-field-check"><span>${esc(label)}</span><input type="checkbox" name="${esc(name)}" ${checked ? "checked" : ""}></label>`;
  }

  function sourceFields(row) {
    const source = row.source_type || "class";
    return `${select("Origem", "source_type", [
      { value: "race", label: "Raça" }, { value: "class", label: "Classe" }, { value: "path", label: "Caminho" }
    ], source)}
      <label class="admin-field cms-source-field" data-source-field="race"><span>Raça</span><select name="race_id">${optionsFor("race", row.race_id)}</select></label>
      <label class="admin-field cms-source-field" data-source-field="class"><span>Classe</span><select name="class_id">${optionsFor("class", row.class_id)}</select></label>
      <label class="admin-field cms-source-field" data-source-field="path"><span>Caminho</span><select name="class_path_id">${optionsFor("path", row.class_path_id)}</select></label>`;
  }

  function editorRace(row) {
    return `${field("Identificador", "id", row.id, "text", { readonly: !String(row.id || "").startsWith("novo-") })}${field("Nome", "name", row.name)}${textarea("Descrição", "description", row.description, 8)}${field("Frase de apresentação", "tagline", row.tagline)}${field("Arquétipo", "archetype", row.archetype)}${field("Dificuldade", "difficulty", row.difficulty, "number", { min: 1, max: 5 })}${field("HP inicial", "base_hp", row.base_hp, "number", { min: 0 })}${field("Mana inicial", "base_mana", row.base_mana, "number", { min: 0 })}${field("Nome da mecânica", "mechanic_name", row.mechanic_name)}${textarea("Descrição da mecânica", "mechanic_description", row.mechanic_description, 5)}${field("Ícone", "icon", row.icon)}${field("Imagem", "artwork_url", row.artwork_url, "url", { wide: true })}${checkbox("Ativa", "is_active", row.is_active !== false)}`;
  }

  function editorClass(row) {
    return `${field("Identificador", "id", row.id, "text", { readonly: !String(row.id || "").startsWith("novo-") })}${field("Nome", "name", row.name)}${textarea("Descrição", "description", row.description, 8)}${field("Função", "role", row.role)}${field("Especialização", "specialization", row.specialization)}${field("Dificuldade", "difficulty", row.difficulty, "number", { min: 1, max: 5 })}${field("Atributo principal", "primary_attribute", row.primary_attribute)}${field("Atributo secundário", "secondary_attribute", row.secondary_attribute)}${textarea("Pontos fortes", "strengths", row.strengths, 4)}${textarea("Pontos fracos", "weaknesses", row.weaknesses, 4)}${field("Nome do recurso", "resource_name", row.resource_name)}${textarea("Descrição do recurso", "resource_description", row.resource_description, 5)}${field("Ícone", "icon", row.icon)}${field("Imagem", "artwork_url", row.artwork_url, "url", { wide: true })}${checkbox("Ativa", "is_active", row.is_active !== false)}`;
  }

  function editorPath(row) {
    return `<label class="admin-field"><span>Classe</span><select name="class_id">${optionsFor("class", row.class_id)}</select></label>${field("Identificador", "id", row.id, "text", { readonly: !String(row.id || "").startsWith("novo-") })}${field("Nome", "name", row.name)}${textarea("Descrição completa", "description", row.description, 10)}${field("Especialização", "specialization", row.specialization)}${field("Complexidade", "complexity", row.complexity)}${checkbox("Ativo", "is_active", row.is_active !== false)}`;
  }

  function editorSkill(row) {
    return `${field("Nome", "name", row.name)}${field("Chave permanente", "skill_key", row.skill_key, "text", { readonly: !String(row.skill_key || "").startsWith("novo-") })}${sourceFields(row)}${textarea("Descrição completa", "description", row.description, 9)}${field("Nível", "unlock_level", row.unlock_level, "number", { min: 1, max: 100 })}${field("Mana", "mana_cost", row.mana_cost, "number", { min: 0 })}${field("Recarga", "cooldown_turns", row.cooldown_turns, "number", { min: 0 })}${field("Alcance", "range_cells", row.range_cells, "number", { min: 0 })}${field("Área", "area_cells", row.area_cells, "number", { min: 0 })}${field("Duração", "duration_turns", row.duration_turns, "number", { min: 0 })}${field("Escala %", "scale_percent", row.scale_percent, "number", { min: 0, step: 0.01 })}${field("Atributo da escala", "scale_attribute", row.scale_attribute)}${select("Alvo", "target_type", [{ value: "enemy", label: "Inimigo" }, { value: "self", label: "Próprio usuário" }, { value: "ally", label: "Aliado" }, { value: "area", label: "Área" }], row.target_type)}${select("Tipo de dano", "damage_type", [{ value: "physical", label: "Físico" }, { value: "magical", label: "Mágico" }, { value: "true", label: "Verdadeiro" }, { value: "none", label: "Sem dano" }], row.damage_type)}${textarea("Efeitos estruturados (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 7)}${checkbox("Ultimate", "is_ultimate", Boolean(row.is_ultimate))}${checkbox("Ativa", "is_active", row.is_active !== false)}`;
  }

  function editorPassive(row) {
    return `${field("Nome", "name", row.name)}${field("Chave permanente", "passive_key", row.passive_key, "text", { readonly: !String(row.passive_key || "").startsWith("novo-") })}${sourceFields(row)}${textarea("Descrição completa", "description", row.description, 9)}${textarea("Efeitos estruturados (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 7)}${checkbox("Ativa", "is_active", row.is_active !== false)}`;
  }

  function editorMechanic(row) {
    const source = row.source_type || "global";
    return `${field("Chave permanente", "mechanic_key", row.mechanic_key, "text", { readonly: !String(row.mechanic_key || "").startsWith("novo-") })}${field("Nome", "name", row.name)}${select("Origem", "source_type", [{ value: "global", label: "Global" }, { value: "race", label: "Raça" }, { value: "class", label: "Classe" }, { value: "path", label: "Caminho" }], source)}<label class="admin-field cms-source-field" data-source-field="race"><span>Raça</span><select name="race_id">${optionsFor("race", row.race_id)}</select></label><label class="admin-field cms-source-field" data-source-field="class"><span>Classe</span><select name="class_id">${optionsFor("class", row.class_id)}</select></label><label class="admin-field cms-source-field" data-source-field="path"><span>Caminho</span><select name="class_path_id">${optionsFor("path", row.class_path_id)}</select></label>${textarea("Descrição completa", "description", row.description, 9)}${field("Valor inicial", "initial_value", row.initial_value, "number")}${field("Valor máximo", "max_value", row.max_value, "number")}${textarea("Ganho (JSON)", "gain_schema", JSON.stringify(row.gain_schema || [], null, 2), 6)}${textarea("Gasto (JSON)", "spend_schema", JSON.stringify(row.spend_schema || [], null, 2), 6)}${textarea("Efeitos (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 6)}${checkbox("Ativa", "is_active", row.is_active !== false)}`;
  }

  function editorBody(row) {
    if (state.module === "races") return editorRace(row);
    if (state.module === "classes") return editorClass(row);
    if (state.module === "paths") return editorPath(row);
    if (state.module === "skills") return editorSkill(row);
    if (state.module === "passives") return editorPassive(row);
    return editorMechanic(row);
  }

  function editor(row) {
    if (!row) return '<div class="admin-empty admin-cms-empty"><strong>Nenhum registro selecionado.</strong><span>Escolha um registro, importe o catálogo atual ou crie um novo.</span></div>';
    return `<section class="admin-editor admin-cms-editor"><header><div><span>Editor guiado</span><h3>${esc(rowLabel(row))}</h3></div><span class="admin-cms-source">${row._local ? "Catálogo local" : "Banco de dados"}</span></header><form id="cmsForm" class="admin-edit-form">${editorBody(row)}<div class="admin-form-actions"><button class="wl-button wl-button-green" type="submit">Salvar alterações</button><button class="wl-button wl-button-red" type="button" id="cmsDelete">Excluir</button></div><p id="cmsMessage" class="admin-form-message"></p></form></section>`;
  }

  function tabsHtml() {
    return Object.entries(MODULES).map(([key, module]) => `<button type="button" class="admin-content-tab ${state.module === key ? "active" : ""}" data-content-tab="${key}">${esc(module.label)}</button>`).join("");
  }

  function assistantHtml() {
    const messages = state.assistantMessages.length
      ? state.assistantMessages.map((message) => `<div class="admin-assistant-message ${message.type}"><small>${message.type === "user" ? "Você" : "Assistente"}</small><p>${esc(message.text)}</p></div>`).join("")
      : '<div class="admin-assistant-placeholder"><strong>Faça alterações escrevendo normalmente.</strong><p>Exemplo: “Habilidade Golpe Selvagem: aumentar de 100% de FOR para 120% de FOR.”</p></div>';
    return `<section class="admin-content-assistant"><header><div><span>Assistente de alterações</span><h3>Comando rápido</h3></div><small>Atualiza o banco e o site</small></header><div id="cmsAssistantHistory" class="admin-assistant-history">${messages}</div><form id="cmsAssistantForm" class="admin-assistant-form"><textarea id="cmsAssistantInput" rows="3" placeholder="Ex.: habilidade Golpe Selvagem, aumentar de 100% da força para 120%"></textarea><button type="submit" class="wl-button wl-button-gold">Aplicar comando</button></form><p id="cmsAssistantStatus" class="admin-form-message"></p></section>`;
  }

  function renderListOnly() {
    const rows = visibleRows();
    const list = document.getElementById("cmsList");
    const counter = document.getElementById("cmsResultCount");
    if (counter) counter.textContent = `${rows.length} de ${state.rows.length} registro(s)`;
    if (!list) return;
    list.innerHTML = rows.length ? rows.map((row) => {
      const key = rowKey(state.module, row);
      return `<button type="button" class="admin-record-button ${String(key) === String(state.selected) ? "active" : ""}" data-record-key="${esc(key)}"><small>${esc(row.source_type || row.class_id || row.id || key)}${row._local ? " • local" : ""}</small><strong>${esc(rowLabel(row))}</strong><span>${esc(sourceName(row))}</span></button>`;
    }).join("") : '<div class="admin-empty">Nenhum registro encontrado com essa pesquisa.</div>';
    list.querySelectorAll("[data-record-key]").forEach((button) => button.addEventListener("click", () => { state.selected = button.dataset.recordKey; render(); }));
  }

  function render() {
    const module = currentModule();
    const selected = state.rows.find((row) => rowKey(state.module, row) === String(state.selected));
    const rows = visibleRows();
    title.textContent = "Conteúdo do RPG";
    document.querySelectorAll("[data-admin-module]").forEach((button) => button.classList.toggle("active", button === navButton));
    host.innerHTML = `${assistantHtml()}<section class="admin-content-studio"><header class="admin-content-studio-header"><div><span>Biblioteca unificada</span><h3>Raças, classes e sistemas</h3><p>Todos os conteúdos usam a mesma fonte do painel administrativo.</p></div><div class="admin-cms-actions"><button id="cmsImport" class="wl-button wl-button-ghost" type="button">Importar somente ausentes</button><button id="cmsCreate" class="wl-button wl-button-gold" type="button">Criar registro</button></div></header><nav class="admin-content-tabs" aria-label="Tipos de conteúdo">${tabsHtml()}</nav><section class="admin-cms-toolbar"><input id="cmsSearch" type="search" value="${esc(state.search)}" placeholder="Pesquisar em ${esc(module.label.toLowerCase())}..."><span id="cmsResultCount">${rows.length} de ${state.rows.length} registro(s)</span></section><section class="admin-browser admin-cms-browser"><aside class="admin-record-list" id="cmsList"></aside><div class="admin-detail-pane">${editor(selected)}</div></section></section>`;
    renderListOnly();
    bind();
  }

  function toggleSourceFields(form) {
    if (!form) return;
    const source = form.elements.source_type?.value || "global";
    form.querySelectorAll("[data-source-field]").forEach((field) => { field.hidden = field.dataset.sourceField !== source; });
  }

  function parseJsonField(payload, key) {
    if (!(key in payload)) return;
    try { payload[key] = JSON.parse(payload[key] || "[]"); }
    catch { throw new Error(`${key} contém JSON inválido.`); }
  }

  function sourceIdentifier(payload) {
    if (payload.source_type === "race") return payload.race_id;
    if (payload.source_type === "path") return payload.class_path_id;
    if (payload.source_type === "class") return payload.class_id;
    return "global";
  }

  function readForm(form, row) {
    const formData = new FormData(form);
    const payload = {};
    for (const [key, value] of formData.entries()) payload[key] = value;
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => { payload[input.name] = input.checked; });
    ["difficulty", "base_hp", "base_mana", "unlock_level", "mana_cost", "cooldown_turns", "range_cells", "area_cells", "duration_turns", "scale_percent", "initial_value", "max_value", "sort_order"].forEach((key) => { if (key in payload) payload[key] = parseNumber(payload[key]); });
    ["effect_schema", "gain_schema", "spend_schema"].forEach((key) => parseJsonField(payload, key));
    if (["skills", "passives", "mechanics"].includes(state.module)) {
      payload.race_id = payload.source_type === "race" ? payload.race_id || null : null;
      payload.class_id = payload.source_type === "class" ? payload.class_id || null : null;
      payload.class_path_id = payload.source_type === "path" ? payload.class_path_id || null : null;
    }
    const originalKey = rowKey(state.module, row);
    const isNew = originalKey.startsWith("novo-");
    if (["races", "classes", "paths"].includes(state.module)) payload.id = isNew ? slug(payload.name) : originalKey;
    if (state.module === "skills") {
      const parsed = parseScale(payload.description);
      if (parsed) { payload.scale_percent = parsed.percent; payload.scale_attribute = parsed.attribute; }
      else if (Number(payload.scale_percent) > 0 && payload.scale_attribute) payload.description = replaceScale(payload.description, null, payload.scale_percent, payload.scale_attribute);
      payload.skill_key = isNew ? `${sourceIdentifier(payload)}-${slug(payload.name)}` : originalKey;
    }
    if (state.module === "passives") payload.passive_key = isNew ? `${sourceIdentifier(payload)}-${slug(payload.name)}` : originalKey;
    if (state.module === "mechanics") payload.mechanic_key = isNew ? `${sourceIdentifier(payload)}-${slug(payload.name)}` : originalKey;
    return payload;
  }

  async function savePayload(module, payload, originalKey = null) {
    const config = MODULES[module];
    const keyValue = String(payload[config.key] || originalKey || "");
    if (!keyValue) throw new Error("Não foi possível identificar a chave permanente do registro.");
    const lookup = await client.from(config.table).select("*").eq(config.key, keyValue).limit(5);
    if (lookup.error) throw lookup.error;
    const response = lookup.data?.length
      ? await client.from(config.table).update(payload).eq(config.key, keyValue).select("*")
      : await client.from(config.table).insert(payload).select("*");
    if (response.error) throw response.error;
    store?.invalidate?.();
    return response.data?.[0] || payload;
  }

  async function importMissing() {
    await refreshCatalogs(true);
    const order = ["races", "classes", "paths", "passives", "skills", "mechanics"];
    let imported = 0;
    for (const module of order) {
      const config = MODULES[module];
      const localRows = moduleRowsFromStore(state.catalogs, module).filter((row) => row._local && !row._cms);
      if (!localRows.length) continue;
      const existing = await client.from(config.table).select(config.key);
      if (existing.error) throw existing.error;
      const used = new Set((existing.data || []).map((row) => String(row[config.key])));
      const missing = localRows.filter((row) => !used.has(rowKey(module, row))).map((row) => {
        const copy = { ...row };
        delete copy._local; delete copy._cms;
        if (module === "skills" || module === "passives") delete copy.id;
        return copy;
      });
      if (!missing.length) continue;
      const inserted = await client.from(config.table).insert(missing);
      if (inserted.error) throw inserted.error;
      imported += missing.length;
    }
    store?.invalidate?.();
    return imported;
  }

  function createDraft() {
    const config = currentModule();
    const key = `novo-${Date.now()}`;
    const row = { [config.key]: key, name: "Novo registro", is_active: true, _local: true };
    if (state.module === "paths") row.class_id = state.catalogs.classes[0]?.id || "";
    if (state.module === "skills" || state.module === "passives") { row.source_type = "class"; row.class_id = state.catalogs.classes[0]?.id || ""; row.effect_schema = []; }
    if (state.module === "mechanics") { row.source_type = "global"; row.gain_schema = []; row.spend_schema = []; row.effect_schema = []; }
    state.rows.unshift(row); state.selected = key; render();
  }

  function inferCommandModule(command) {
    const source = normalize(command);
    if (/\bhabilidade\b|\bskill\b/.test(source)) return "skills";
    if (/\bpassiva\b|\btraco\b/.test(source)) return "passives";
    if (/\bmecanica\b/.test(source)) return "mechanics";
    if (/\bcaminho\b/.test(source)) return "paths";
    if (/\braca\b/.test(source)) return "races";
    if (/\bclasse\b/.test(source)) return "classes";
    return state.module;
  }

  function findCommandTarget(module, command) {
    const source = normalize(command);
    const rows = moduleRowsFromStore(state.catalogs, module);
    const candidates = dedupeRows(module, rows).filter((row) => source.includes(normalize(rowLabel(row)))).sort((a, b) => normalize(rowLabel(b)).length - normalize(rowLabel(a)).length);
    if (candidates.length) return candidates[0];
    const words = source.split(" ").filter((word) => word.length > 3);
    const ranked = rows.map((row) => ({ row, score: words.filter((word) => searchableText(row).includes(word)).length })).sort((a, b) => b.score - a.score);
    return ranked[0]?.score > 0 ? ranked[0].row : null;
  }

  function parsePercentCommand(command) {
    const source = normalize(command);
    const values = [...source.matchAll(/(\d+(?:[.,]\d+)?)%/g)].map((match) => Number(match[1].replace(",", ".")));
    if (!values.length) return null;
    const attributeName = Object.keys(ATTRIBUTE_MAP).sort((a, b) => b.length - a.length).find((name) => new RegExp(`\\b${name}\\b`).test(source));
    return { oldPercent: values.length > 1 ? values[0] : null, newPercent: values[values.length - 1], attribute: ATTRIBUTE_MAP[attributeName] || null };
  }

  function applyCommandToPayload(module, target, command) {
    const payload = { ...target };
    delete payload._local; delete payload._cms;
    if (module === "skills" || module === "passives") delete payload.id;
    if (module === "skills") {
      const scale = parsePercentCommand(command);
      if (scale) {
        const currentScale = parseScale(payload.description);
        const attribute = scale.attribute || currentScale?.attribute || payload.scale_attribute || "FOR";
        payload.description = replaceScale(payload.description, scale.oldPercent ?? currentScale?.percent, scale.newPercent, attribute);
        payload.scale_percent = scale.newPercent;
        payload.scale_attribute = attribute;
      }
      const manaMatch = normalize(command).match(/(?:mana|custo)(?:\s+de)?\s*\d*\s*(?:para|por|em)\s*(\d+)/);
      if (manaMatch) payload.mana_cost = Number(manaMatch[1]);
      const cooldownMatch = normalize(command).match(/recarga(?:\s+de)?\s*\d*\s*(?:para|por|em)\s*(\d+)/);
      if (cooldownMatch) payload.cooldown_turns = Number(cooldownMatch[1]);
    }
    const descriptionMatch = String(command).match(/descri(?:ç|c)ão\s+(?:para|como)\s+["“](.+?)["”]$/i);
    if (descriptionMatch) payload.description = descriptionMatch[1].trim();
    const nameMatch = String(command).match(/(?:renomear|mudar o nome|alterar o nome).*?(?:para|como)\s+["“]?([^"”]+)["”]?$/i);
    if (nameMatch) payload.name = nameMatch[1].trim();
    return payload;
  }

  function assistantMessage(type, text) {
    state.assistantMessages.push({ type, text });
    if (state.assistantMessages.length > 10) state.assistantMessages.shift();
  }

  async function executeAssistantCommand(command) {
    assistantMessage("user", command);
    await refreshCatalogs(true);
    const module = inferCommandModule(command);
    const target = findCommandTarget(module, command);
    if (!target) throw new Error("Não encontrei o conteúdo citado. Escreva o tipo e o nome completo.");
    const payload = applyCommandToPayload(module, target, command);
    if (JSON.stringify(target) === JSON.stringify(payload)) throw new Error("Entendi o conteúdo, mas não identifiquei qual valor deve ser alterado.");
    const saved = await savePayload(module, payload, rowKey(module, target));
    assistantMessage("assistant", `${rowLabel(saved || target)} foi atualizado no banco. As páginas passam a usar a nova versão ao serem recarregadas.`);
    await loadModule(module, { force: true, keepSearch: false, selectKey: rowKey(module, saved || payload) });
  }

  function bind() {
    host.querySelectorAll("[data-content-tab]").forEach((button) => button.addEventListener("click", () => loadModule(button.dataset.contentTab, { force: true })));
    document.getElementById("cmsSearch")?.addEventListener("input", (event) => { state.search = event.target.value; renderListOnly(); });
    document.getElementById("cmsCreate")?.addEventListener("click", createDraft);
    document.getElementById("cmsImport")?.addEventListener("click", async () => {
      const button = document.getElementById("cmsImport"); button.disabled = true; button.textContent = "Importando...";
      try { const imported = await importMissing(); await loadModule(state.module, { force: true }); assistantMessage("assistant", `${imported} registro(s) ausente(s) foram importados sem substituir alterações do banco.`); render(); }
      catch (error) { console.error(error); assistantMessage("assistant", error.message || "Não foi possível importar o catálogo."); render(); }
    });
    const form = document.getElementById("cmsForm");
    if (form) {
      toggleSourceFields(form);
      form.elements.source_type?.addEventListener("change", () => toggleSourceFields(form));
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const row = state.rows.find((item) => rowKey(state.module, item) === String(state.selected));
        const message = document.getElementById("cmsMessage");
        const submit = form.querySelector('button[type="submit"]');
        try {
          submit.disabled = true; message.textContent = "Salvando no banco...";
          const payload = readForm(form, row);
          const saved = await savePayload(state.module, payload, rowKey(state.module, row));
          message.textContent = "Alteração salva. O site usará este registro ao recarregar.";
          await loadModule(state.module, { force: true, keepSearch: true, selectKey: rowKey(state.module, saved || payload) });
        } catch (error) { console.error(error); message.textContent = error.message || "Não foi possível salvar."; }
        finally { submit.disabled = false; }
      });
    }
    document.getElementById("cmsDelete")?.addEventListener("click", async () => {
      const module = currentModule();
      const row = state.rows.find((item) => rowKey(state.module, item) === String(state.selected));
      if (!row || !confirm(`Excluir ${rowLabel(row)}?`)) return;
      if (row._local) { state.rows = state.rows.filter((item) => item !== row); state.selected = rowKey(state.module, state.rows[0]); render(); return; }
      const response = await client.from(module.table).delete().eq(module.key, rowKey(state.module, row));
      if (response.error) { document.getElementById("cmsMessage").textContent = response.error.message; return; }
      store?.invalidate?.(); await loadModule(state.module, { force: true });
    });
    document.getElementById("cmsAssistantForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.getElementById("cmsAssistantInput");
      const status = document.getElementById("cmsAssistantStatus");
      const command = input.value.trim();
      if (!command) return;
      status.textContent = "Interpretando e aplicando a alteração..."; input.disabled = true;
      try { await executeAssistantCommand(command); }
      catch (error) { console.error(error); assistantMessage("assistant", error.message || "Não consegui aplicar esse comando."); render(); }
      finally { const nextInput = document.getElementById("cmsAssistantInput"); if (nextInput) nextInput.disabled = false; }
    });
  }

  navButton.addEventListener("click", async (event) => {
    event.preventDefault(); event.stopImmediatePropagation();
    title.textContent = "Conteúdo do RPG";
    host.innerHTML = '<div class="admin-loading">Carregando biblioteca unificada...</div>';
    try { await loadModule(state.module, { force: true }); }
    catch (error) { console.error(error); host.innerHTML = `<div class="admin-error">${esc(error.message || "Não foi possível abrir o conteúdo do RPG.")}</div>`; }
  }, true);
})();
