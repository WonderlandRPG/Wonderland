"use strict";

(function () {
  const client = window.WONDERLAND_SUPABASE;
  const store = window.WONDERLAND_CONTENT_STORE;
  const scaling = window.WONDERLAND_SCALING;
  const host = document.getElementById("adminModuleContent");
  const title = document.getElementById("adminModuleTitle");
  const contentButton = document.querySelector('[data-admin-module="content"]');

  if (!client || !store || !scaling || !host || !title || !contentButton) return;

  const MODULES = {
    races: { label: "Raças", table: "races", key: "id" },
    classes: { label: "Classes", table: "classes", key: "id" },
    paths: { label: "Caminhos", table: "class_paths", key: "id" },
    skills: { label: "Habilidades", table: "skills", key: "skill_key" },
    passives: { label: "Passivas", table: "passives", key: "passive_key" },
    mechanics: { label: "Mecânicas", table: "combat_mechanics", key: "mechanic_key" }
  };

  const state = {
    active: false,
    module: "skills",
    rows: [],
    selected: null,
    search: "",
    classes: [],
    races: [],
    paths: [],
    message: ""
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

  function moduleConfig(module = state.module) {
    return MODULES[module];
  }

  function keyOf(row, module = state.module) {
    return String(row?.[moduleConfig(module).key] ?? "");
  }

  function cleanRow(row) {
    const copy = { ...row };
    delete copy._local;
    delete copy._cms;
    delete copy._source;
    delete copy._new;
    return copy;
  }

  function sourceRows(data, module) {
    if (module === "paths") return data.paths || [];
    return data[module] || [];
  }

  function mergeRows(databaseRows, localRows, module) {
    const result = new Map();
    const key = moduleConfig(module).key;

    (localRows || []).forEach((row) => {
      const id = String(row?.[key] ?? "");
      if (id) result.set(id, { ...row, _local: true });
    });

    (databaseRows || []).forEach((row) => {
      const id = String(row?.[key] ?? "");
      if (!id) return;
      result.set(id, { ...result.get(id), ...row, _local: false, _cms: true });
    });

    return [...result.values()].sort((a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
      || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
    );
  }

  function field(label, name, value, options = {}) {
    const type = options.type || "text";
    const step = options.step ? ` step="${esc(options.step)}"` : "";
    const min = options.min !== undefined ? ` min="${esc(options.min)}"` : "";
    const max = options.max !== undefined ? ` max="${esc(options.max)}"` : "";
    const readonly = options.readonly ? " readonly" : "";
    const wide = options.wide ? " admin-field-wide" : "";
    const help = options.help ? `<small>${esc(options.help)}</small>` : "";

    return `<label class="admin-field${wide}"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" value="${esc(value ?? "")}"${step}${min}${max}${readonly}>${help}</label>`;
  }

  function textarea(label, name, value, rows = 7, help = "") {
    return `<label class="admin-field admin-field-wide"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="${rows}">${esc(value ?? "")}</textarea>${help ? `<small>${esc(help)}</small>` : ""}</label>`;
  }

  function select(label, name, options, wide = false) {
    return `<label class="admin-field${wide ? " admin-field-wide" : ""}"><span>${esc(label)}</span><select name="${esc(name)}">${options}</select></label>`;
  }

  function checkbox(label, name, checked) {
    return `<label class="admin-field admin-field-check"><span>${esc(label)}</span><input name="${esc(name)}" type="checkbox" ${checked ? "checked" : ""}></label>`;
  }

  function optionsFrom(rows, selected, labelKey = "name") {
    return rows.map((row) => `<option value="${esc(row.id)}" ${String(row.id) === String(selected) ? "selected" : ""}>${esc(row[labelKey] || row.id)}</option>`).join("");
  }

  function sourceSelector(row) {
    const source = row.source_type || "class";
    const sourceOptions = [
      ["race", "Raça"],
      ["class", "Classe"],
      ["path", "Caminho"]
    ].map(([value, label]) => `<option value="${value}" ${source === value ? "selected" : ""}>${label}</option>`).join("");

    let target = "";
    if (source === "race") {
      target = select("Raça", "race_id", optionsFrom(state.races, row.race_id));
    } else if (source === "path") {
      target = select(
        "Caminho",
        "class_path_id",
        state.paths.map((path) => {
          const cls = state.classes.find((item) => item.id === path.class_id);
          return `<option value="${esc(path.id)}" ${String(path.id) === String(row.class_path_id) ? "selected" : ""}>${esc(path.name)} — ${esc(cls?.name || path.class_id)}</option>`;
        }).join("")
      );
    } else {
      target = select("Classe", "class_id", optionsFrom(state.classes, row.class_id));
    }

    return `${select("Origem", "source_type", sourceOptions)}${target}`;
  }

  function editorRace(row) {
    return [
      field("Identificador", "id", row.id, { readonly: !row._new }),
      field("Nome", "name", row.name),
      textarea("Descrição", "description", row.description),
      field("Arquétipo", "archetype", row.archetype),
      field("Dificuldade", "difficulty", row.difficulty, { type: "number", min: 1, max: 5 }),
      field("HP inicial", "base_hp", row.base_hp, { type: "number", min: 0 }),
      field("Mana inicial", "base_mana", row.base_mana, { type: "number", min: 0 }),
      field("Nome da mecânica", "mechanic_name", row.mechanic_name),
      textarea("Descrição da mecânica", "mechanic_description", row.mechanic_description, 4),
      field("Imagem", "artwork_url", row.artwork_url, { type: "url", wide: true }),
      checkbox("Ativa", "is_active", row.is_active !== false)
    ].join("");
  }

  function editorClass(row) {
    return [
      field("Identificador", "id", row.id, { readonly: !row._new }),
      field("Nome", "name", row.name),
      textarea("Descrição", "description", row.description),
      field("Função", "role", row.role),
      field("Especialização", "specialization", row.specialization),
      field("Dificuldade", "difficulty", row.difficulty, { type: "number", min: 1, max: 5 }),
      field("Atributo principal", "primary_attribute", row.primary_attribute),
      field("Atributo secundário", "secondary_attribute", row.secondary_attribute),
      textarea("Pontos fortes", "strengths", row.strengths, 4),
      textarea("Pontos fracos", "weaknesses", row.weaknesses, 4),
      field("Nome do recurso", "resource_name", row.resource_name),
      textarea("Descrição do recurso", "resource_description", row.resource_description, 4),
      field("Imagem", "artwork_url", row.artwork_url, { type: "url", wide: true }),
      checkbox("Ativa", "is_active", row.is_active !== false)
    ].join("");
  }

  function editorPath(row) {
    return [
      select("Classe", "class_id", optionsFrom(state.classes, row.class_id)),
      field("Identificador", "id", row.id, { readonly: !row._new }),
      field("Nome", "name", row.name),
      textarea("Descrição completa do Caminho", "description", row.description, 10),
      field("Especialização", "specialization", row.specialization),
      field("Complexidade", "complexity", row.complexity),
      checkbox("Ativo", "is_active", row.is_active !== false)
    ].join("");
  }

  function editorSkill(row) {
    const normalized = scaling.normalizeSkill(row);
    return [
      field("Nome", "name", row.name),
      field("Chave única", "skill_key", row.skill_key, { readonly: !row._new }),
      sourceSelector(row),
      textarea(
        "Descrição completa",
        "description",
        scaling.normalizeDescription(row.description || ""),
        9,
        "Dano, cura e escudos usam 1x, 1,5x, 2x etc. Buffs, reduções e chances continuam usando %."
      ),
      field("Nível", "unlock_level", row.unlock_level, { type: "number", min: 1, max: 100 }),
      field("Mana", "mana_cost", row.mana_cost, { type: "number", min: 0 }),
      field("Recarga", "cooldown_turns", row.cooldown_turns, { type: "number", min: 0 }),
      field("Alcance", "range_cells", row.range_cells, { type: "number", min: 0 }),
      field("Área", "area_cells", row.area_cells, { type: "number", min: 0 }),
      field("Multiplicador (x)", "scale_multiplier", normalized.scale_multiplier || "", {
        type: "number",
        step: "0.01",
        min: 0,
        help: "Ex.: 1 = 1x; 1,5 = 1,5x; 3 = 3x."
      }),
      field("Atributo da escala", "scale_attribute", normalized.scale_attribute),
      select("Alvo", "target_type", ["enemy", "self", "ally", "area"].map((value) => `<option value="${value}" ${row.target_type === value ? "selected" : ""}>${value}</option>`).join("")),
      select("Tipo de dano", "damage_type", ["physical", "magical", "true", "none"].map((value) => `<option value="${value}" ${row.damage_type === value ? "selected" : ""}>${value}</option>`).join("")),
      textarea("Efeitos estruturados (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 8),
      checkbox("Ultimate", "is_ultimate", row.is_ultimate),
      checkbox("Ativa", "is_active", row.is_active !== false)
    ].join("");
  }

  function editorPassive(row) {
    return [
      field("Nome", "name", row.name),
      field("Chave única", "passive_key", row.passive_key, { readonly: !row._new }),
      sourceSelector(row),
      textarea("Descrição completa", "description", scaling.normalizeDescription(row.description || ""), 9, "Escalas diretas usam multiplicadores. Bônus, reduções e chances permanecem em porcentagem."),
      textarea("Efeitos estruturados (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 8),
      checkbox("Ativa", "is_active", row.is_active !== false)
    ].join("");
  }

  function editorMechanic(row) {
    const source = row.source_type || "global";
    const originOptions = ["global", "race", "class", "path"].map((value) => `<option value="${value}" ${source === value ? "selected" : ""}>${value}</option>`).join("");
    let sourceTarget = "";
    if (source === "race") sourceTarget = select("Raça", "race_id", optionsFrom(state.races, row.race_id));
    if (source === "class") sourceTarget = select("Classe", "class_id", optionsFrom(state.classes, row.class_id));
    if (source === "path") sourceTarget = select("Caminho", "class_path_id", optionsFrom(state.paths, row.class_path_id));

    return [
      field("Chave única", "mechanic_key", row.mechanic_key, { readonly: !row._new }),
      field("Nome", "name", row.name),
      select("Origem", "source_type", originOptions),
      sourceTarget,
      textarea("Descrição completa da mecânica", "description", scaling.normalizeDescription(row.description || ""), 9),
      field("Valor inicial", "initial_value", row.initial_value, { type: "number", step: "0.01" }),
      field("Valor máximo", "max_value", row.max_value, { type: "number", step: "0.01" }),
      textarea("Ganho (JSON)", "gain_schema", JSON.stringify(row.gain_schema || [], null, 2), 6),
      textarea("Gasto (JSON)", "spend_schema", JSON.stringify(row.spend_schema || [], null, 2), 6),
      textarea("Efeitos (JSON)", "effect_schema", JSON.stringify(row.effect_schema || [], null, 2), 6),
      checkbox("Ativa", "is_active", row.is_active !== false)
    ].join("");
  }

  function editor(row) {
    if (!row) return '<div class="admin-empty admin-cms-empty"><strong>Nenhum registro selecionado.</strong><span>Escolha um registro ou crie um novo.</span></div>';
    const body = state.module === "races" ? editorRace(row) : state.module === "classes" ? editorClass(row) : state.module === "paths" ? editorPath(row) : state.module === "skills" ? editorSkill(row) : state.module === "passives" ? editorPassive(row) : editorMechanic(row);
    return `<section class="admin-editor admin-cms-editor"><header><div><span>Editor guiado</span><h3>${esc(row.name || keyOf(row) || "Novo registro")}</h3></div><span class="admin-cms-source">${row._local ? "Catálogo local" : row._new ? "Novo" : "Banco de dados"}</span></header><form id="cmsForm" class="admin-edit-form">${body}<div class="admin-form-actions"><button class="wl-button wl-button-green" type="submit">Salvar alterações</button><button class="wl-button wl-button-red" type="button" id="cmsDelete">Excluir</button></div><p id="cmsMessage" class="admin-form-message">${esc(state.message)}</p></form></section>`;
  }

  function searchableText(row) {
    const cls = state.classes.find((item) => item.id === row.class_id)?.name;
    const race = state.races.find((item) => item.id === row.race_id)?.name;
    const path = state.paths.find((item) => item.id === row.class_path_id)?.name;
    return normalize([row.name, keyOf(row), row.class_id, row.race_id, row.class_path_id, row.source_type, row.description, cls, race, path].filter(Boolean).join(" "));
  }

  function visibleRows() {
    const query = normalize(state.search);
    return query ? state.rows.filter((row) => searchableText(row).includes(query)) : state.rows;
  }

  function tabsHtml() {
    return Object.entries(MODULES).map(([key, config]) => `<button type="button" class="admin-content-tab ${state.module === key ? "active" : ""}" data-content-tab="${key}">${esc(config.label)}</button>`).join("");
  }

  function listHtml() {
    const rows = visibleRows();
    return rows.map((row) => `<button type="button" class="admin-record-button ${keyOf(row) === String(state.selected) ? "active" : ""}" data-content-id="${esc(keyOf(row))}"><small>${esc(row.source_type || row.class_id || keyOf(row))}${row._local ? " • local" : ""}</small><strong>${esc(row.name || keyOf(row))}</strong></button>`).join("") || '<div class="admin-empty">Nenhum registro encontrado.</div>';
  }

  function render() {
    if (!state.active) return;
    title.textContent = "Conteúdo do RPG";
    const selected = state.rows.find((row) => keyOf(row) === String(state.selected)) || null;
    const rows = visibleRows();
    const singular = { races: "Raça", classes: "Classe", paths: "Caminho", skills: "Habilidade", passives: "Passiva", mechanics: "Mecânica" }[state.module];

    host.innerHTML = `<section class="admin-content-hub"><header><div><span>Biblioteca viva</span><h3>Conteúdo do Wonderland</h3><p>Raças, Classes, Caminhos, Habilidades, Passivas e Mecânicas compartilham a mesma fonte de dados.</p></div><div class="admin-cms-actions"><button id="cmsImport" class="wl-button wl-button-ghost" type="button">Importar apenas conteúdos ausentes</button><button id="cmsCreate" class="wl-button wl-button-gold" type="button">Criar ${esc(singular)}</button></div></header><nav class="admin-content-tabs">${tabsHtml()}</nav></section><section class="admin-command-panel"><div><span>Assistente de alteração</span><h3>Escreva a mudança em linguagem simples</h3><p>Exemplo: “Habilidade Golpe Selvagem, aumentar de 1x FOR para 1,2x FOR”.</p></div><form id="cmsCommandForm"><textarea id="cmsCommand" rows="3" placeholder="Digite a alteração que deseja fazer..."></textarea><button class="wl-button wl-button-gold" type="submit">Interpretar e salvar</button></form><p id="cmsCommandMessage" class="admin-form-message"></p></section><section class="admin-cms-toolbar"><input id="cmsSearch" type="search" value="${esc(state.search)}" placeholder="Pesquisar por nome, classe, raça, Caminho ou chave..."><span id="cmsResultCount">${rows.length} de ${state.rows.length} registro(s)</span></section><section class="admin-browser admin-cms-browser"><aside class="admin-record-list" id="cmsList">${listHtml()}</aside><div class="admin-detail-pane">${editor(selected)}</div></section>`;
    bind();
  }

  function updateListOnly() {
    const list = document.getElementById("cmsList");
    const counter = document.getElementById("cmsResultCount");
    if (counter) counter.textContent = `${visibleRows().length} de ${state.rows.length} registro(s)`;
    if (!list) return;
    list.innerHTML = listHtml();
    list.querySelectorAll("[data-content-id]").forEach((button) => button.addEventListener("click", () => {
      state.selected = button.dataset.contentId;
      state.message = "";
      render();
    }));
  }

  function formPayload(form, row) {
    const payload = {};
    const data = new FormData(form);
    for (const [key, value] of data.entries()) payload[key] = value;
    form.querySelectorAll('input[type="checkbox"]').forEach((input) => payload[input.name] = input.checked);

    ["difficulty", "base_hp", "base_mana", "unlock_level", "mana_cost", "cooldown_turns", "range_cells", "area_cells", "scale_multiplier", "initial_value", "max_value"].forEach((key) => {
      if (key in payload) payload[key] = payload[key] === "" ? null : Number(String(payload[key]).replace(",", "."));
    });

    ["effect_schema", "gain_schema", "spend_schema"].forEach((key) => {
      if (!(key in payload)) return;
      try { payload[key] = JSON.parse(payload[key] || "[]"); }
      catch { throw new Error(`${key} contém JSON inválido.`); }
    });

    if ("description" in payload) payload.description = scaling.normalizeDescription(payload.description);
    if ("resource_description" in payload) payload.resource_description = scaling.normalizeDescription(payload.resource_description);
    if ("mechanic_description" in payload) payload.mechanic_description = scaling.normalizeDescription(payload.mechanic_description);

    if (state.module === "skills") {
      payload.skill_key = payload.skill_key || `${payload.source_type || "class"}-${slug(payload.name)}`;
      payload.scale_multiplier = Number(payload.scale_multiplier || scaling.parseFirst(payload.description)?.multiplier || 0);
      payload.scale_percent = Number((payload.scale_multiplier * 100).toFixed(2));
      payload.scale_attribute = scaling.normalizeAttribute(payload.scale_attribute) || scaling.parseFirst(payload.description)?.attribute || null;
    }
    if (state.module === "passives") payload.passive_key = payload.passive_key || `${payload.source_type || "class"}-${slug(payload.name)}`;
    if (state.module === "mechanics") payload.mechanic_key = payload.mechanic_key || `${payload.source_type || "global"}-${slug(payload.name)}`;
    if (state.module === "paths") payload.id = payload.id || slug(payload.name);
    if (state.module === "races" || state.module === "classes") payload.id = payload.id || slug(payload.name);

    if (["skills", "passives"].includes(state.module)) {
      payload.race_id = payload.source_type === "race" ? payload.race_id : null;
      payload.class_id = payload.source_type === "class" ? payload.class_id : null;
      payload.class_path_id = payload.source_type === "path" ? payload.class_path_id : null;
    }
    if (state.module === "mechanics") {
      payload.race_id = payload.source_type === "race" ? payload.race_id : null;
      payload.class_id = payload.source_type === "class" ? payload.class_id : null;
      payload.class_path_id = payload.source_type === "path" ? payload.class_path_id : null;
    }

    delete payload.id;
    if (["races", "classes", "paths"].includes(state.module)) payload.id = row?._new ? (form.elements.id?.value || slug(payload.name)) : (form.elements.id?.value || keyOf(row));
    return payload;
  }

  async function persistByNaturalKey(payload, module = state.module, { onlyIfMissing = false } = {}) {
    const config = moduleConfig(module);
    const keyValue = payload[config.key];
    if (!keyValue) throw new Error(`A chave ${config.key} é obrigatória.`);

    const lookup = await client.from(config.table).select("*").eq(config.key, keyValue).limit(1);
    if (lookup.error) throw lookup.error;

    const existing = lookup.data?.[0] || null;
    if (existing && onlyIfMissing) return existing;

    const query = existing
      ? client.from(config.table).update(payload).eq(existing.id !== undefined && existing.id !== null ? "id" : config.key, existing.id ?? keyValue)
      : client.from(config.table).insert(payload);
    const { data, error } = await query.select("*").limit(1);
    if (error) throw error;

    store.invalidate?.();
    return data?.[0] || existing || payload;
  }

  async function savePayload(payload, module = state.module) {
    return persistByNaturalKey(payload, module);
  }

  async function importMissing() {
    const data = await store.load({ force: true });
    const imports = [["races", data.races], ["classes", data.classes], ["paths", data.paths], ["skills", data.skills], ["passives", data.passives], ["mechanics", data.mechanics]];
    for (const [module, rows] of imports) {
      const config = moduleConfig(module);
      const payload = (rows || []).map((row) => {
        const clean = cleanRow(row);
        delete clean.id;
        if (["races", "classes", "paths"].includes(module)) clean.id = row.id;
        if (module === "skills") {
          const normalized = scaling.normalizeSkill(clean);
          return { ...clean, ...normalized, description: normalized.description, scale_percent: Number((normalized.scale_multiplier * 100).toFixed(2)) };
        }
        if ("description" in clean) clean.description = scaling.normalizeDescription(clean.description);
        return clean;
      }).filter((row) => row[config.key]);
      if (!payload.length) continue;
      for (let index = 0; index < payload.length; index += 8) {
        const chunk = payload.slice(index, index + 8);
        await Promise.all(chunk.map((row) => persistByNaturalKey(row, module, { onlyIfMissing: true })));
      }
    }
    store.invalidate?.();
  }

  function findCommandTarget(command) {
    const normalizedCommand = normalize(command);
    const ordered = [...state.rows].sort((a, b) => String(b.name || "").length - String(a.name || "").length);
    return ordered.find((row) => normalizedCommand.includes(normalize(row.name))) || null;
  }

  function replaceFirstScale(description, multiplier, attribute) {
    const source = scaling.normalizeDescription(description || "");
    const terms = scaling.parseTerms(source);
    const replacement = scaling.describe(multiplier, attribute);
    if (!terms.length) return `${source}${source ? " " : ""}Escala principal: ${replacement}.`;
    const first = terms[0];
    return `${source.slice(0, first.index)}${replacement}${source.slice(first.index + first.raw.length)}`;
  }

  async function executeCommand(command) {
    const raw = String(command || "").trim();
    if (!raw) throw new Error("Digite uma alteração.");
    const target = findCommandTarget(raw);
    if (!target) throw new Error("Não encontrei o conteúdo pelo nome nesta aba. Escreva o nome completo.");
    const payload = cleanRow(target);
    delete payload.id;

    if (state.module === "skills") {
      const multiplierMatch = raw.match(/(?:para|por|a)\s*([+\-]?\d+(?:[.,]\d+)?)\s*[x×]\s*(FOR|DEF|RES|INI|INT|ARC)?/i) || raw.match(/(?:para|por|a)\s*([+\-]?\d+(?:[.,]\d+)?)%\s*(?:de|do|da)?\s*(FOR|DEF|RES|INI|INT|ARC)?/i);
      const manaMatch = raw.match(/(?:mana|custo)[^\d]*(\d+)/i);
      const cooldownMatch = raw.match(/(?:recarga|cooldown)[^\d]*(\d+)/i);
      if (multiplierMatch) {
        const writtenAsPercent = multiplierMatch[0].includes("%");
        const multiplier = Number(multiplierMatch[1].replace(",", ".")) / (writtenAsPercent ? 100 : 1);
        const attribute = scaling.normalizeAttribute(multiplierMatch[2]) || scaling.attributeFromSkill(payload, payload.description);
        payload.scale_multiplier = multiplier;
        payload.scale_percent = Number((multiplier * 100).toFixed(2));
        payload.scale_attribute = attribute;
        payload.description = replaceFirstScale(payload.description, multiplier, attribute);
      }
      if (manaMatch) payload.mana_cost = Number(manaMatch[1]);
      if (cooldownMatch) payload.cooldown_turns = Number(cooldownMatch[1]);
      if (!multiplierMatch && !manaMatch && !cooldownMatch) throw new Error("Reconheci a habilidade, mas não identifiquei multiplicador, Mana ou recarga.");
    } else {
      const afterColon = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1).trim() : "";
      if (!afterColon) throw new Error("Para esta aba, escreva a nova descrição após dois-pontos.");
      payload.description = scaling.normalizeDescription(afterColon);
    }

    return savePayload(payload);
  }

  function bind() {
    host.querySelectorAll("[data-content-tab]").forEach((button) => button.addEventListener("click", () => load(button.dataset.contentTab)));
    host.querySelectorAll("[data-content-id]").forEach((button) => button.addEventListener("click", () => { state.selected = button.dataset.contentId; state.message = ""; render(); }));
    document.getElementById("cmsSearch")?.addEventListener("input", (event) => { state.search = event.target.value; updateListOnly(); });

    document.getElementById("cmsCreate")?.addEventListener("click", () => {
      const config = moduleConfig();
      const temporary = `novo-${Date.now()}`;
      const row = { [config.key]: temporary, name: "Novo registro", is_active: true, _new: true };
      if (state.module === "paths") row.class_id = state.classes[0]?.id || "";
      if (["skills", "passives"].includes(state.module)) { row.source_type = "class"; row.class_id = state.classes[0]?.id || ""; row.effect_schema = []; }
      if (state.module === "skills") { row.scale_multiplier = 1; row.scale_attribute = "FOR"; row.target_type = "enemy"; row.damage_type = "physical"; }
      if (state.module === "mechanics") { row.source_type = "global"; row.gain_schema = []; row.spend_schema = []; row.effect_schema = []; }
      state.rows.unshift(row); state.selected = temporary; state.message = ""; render();
    });

    document.getElementById("cmsImport")?.addEventListener("click", async () => {
      const button = document.getElementById("cmsImport");
      try { button.disabled = true; button.textContent = "Importando..."; await importMissing(); state.message = "Conteúdos ausentes importados sem sobrescrever alterações do banco."; await load(state.module, false); }
      catch (error) { console.error(error); state.message = error.message || "Não foi possível importar."; render(); }
    });

    const form = document.getElementById("cmsForm");
    if (form) {
      const row = state.rows.find((item) => keyOf(item) === String(state.selected));
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const message = document.getElementById("cmsMessage");
        const submit = form.querySelector('button[type="submit"]');
        try { submit.disabled = true; message.textContent = "Salvando no banco..."; const payload = formPayload(form, row); const saved = await savePayload(payload); state.selected = String(saved[moduleConfig().key]); state.message = "Alteração salva. Todas as páginas usarão este valor."; await load(state.module, false); }
        catch (error) { console.error(error); message.textContent = error.message || "Não foi possível salvar."; }
        finally { submit.disabled = false; }
      });

      document.getElementById("cmsDelete")?.addEventListener("click", async () => {
        if (!row || !confirm("Excluir este registro?")) return;
        if (row._new || row._local) { state.rows = state.rows.filter((item) => item !== row); state.selected = keyOf(state.rows[0]) || null; render(); return; }
        const config = moduleConfig();
        const { error } = await client.from(config.table).delete().eq(config.key, keyOf(row));
        if (error) { document.getElementById("cmsMessage").textContent = error.message; return; }
        store.invalidate?.(); await load(state.module);
      });
    }

    document.getElementById("cmsCommandForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const textareaElement = document.getElementById("cmsCommand");
      const message = document.getElementById("cmsCommandMessage");
      const button = event.currentTarget.querySelector("button");
      try { button.disabled = true; message.textContent = "Interpretando e salvando..."; const saved = await executeCommand(textareaElement.value); state.selected = String(saved[moduleConfig().key]); message.textContent = `Alteração aplicada em ${saved.name || state.selected}.`; textareaElement.value = ""; await load(state.module, false); }
      catch (error) { console.error(error); message.textContent = error.message || "Não foi possível interpretar o comando."; }
      finally { button.disabled = false; }
    });
  }

  async function load(module = state.module, resetSelection = true) {
    state.active = true; state.module = module; state.search = ""; if (resetSelection) state.message = "";
    host.innerHTML = '<div class="admin-loading">Carregando conteúdo central...</div>'; title.textContent = "Conteúdo do RPG";
    const data = await store.load({ force: true });
    state.classes = data.classes || []; state.races = data.races || []; state.paths = data.paths || [];
    const config = moduleConfig(module);
    const { data: databaseRows, error } = await client.from(config.table).select("*");
    if (error) throw error;
    state.rows = mergeRows(databaseRows || [], sourceRows(data, module), module);
    if (resetSelection || !state.rows.some((row) => keyOf(row) === String(state.selected))) state.selected = keyOf(state.rows[0]) || null;
    render();
  }

  contentButton.addEventListener("click", async (event) => {
    event.preventDefault(); event.stopImmediatePropagation();
    document.querySelectorAll("[data-admin-module]").forEach((button) => button.classList.toggle("active", button === contentButton));
    try { await load("skills"); }
    catch (error) { console.error(error); host.innerHTML = `<div class="admin-error">${esc(error.message || "Não foi possível carregar o conteúdo.")}</div>`; }
  }, true);
})();
