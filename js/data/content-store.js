"use strict";

(function () {
  const client = window.WONDERLAND_SUPABASE;
  const localClasses = window.WONDERLAND_CLASSES || {};
  const localRaces = Array.isArray(window.WONDERLAND_RACES)
    ? window.WONDERLAND_RACES
    : [];

  const cache = {
    loaded: false,
    races: [],
    classes: [],
    paths: [],
    skills: [],
    passives: [],
    mechanics: []
  };

  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const text = (value) => String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const levelOf = (value) => Number(String(value || "").match(/(\d+)/)?.[1] || 1);
  const parseMana = (value) => Number(
    String(value || "").match(/(?:custa|consome|gasta|custo\s*:?)\s*(\d+)\s*mana/i)?.[1] || 0
  );
  const parseCooldown = (value) => Number(
    String(value || "").match(/(?:recarga|cooldown)\D*(\d+)/i)?.[1] || 0
  );

  function parseScale(value) {
    const match = String(value || "").match(
      /(\d+(?:[.,]\d+)?)%\s+(?:do|de|da)\s+(?:seu\s+)?(FOR|DEF|RES|INI|INT|ARC)/i
    );

    return match
      ? {
          percent: Number(match[1].replace(",", ".")),
          attribute: match[2].toUpperCase()
        }
      : null;
  }

  function inferTarget(description, category) {
    return /transforma|transformação|postura|forma |assume|fortalecimento|aprimoramento|recupera|regenera|cura a si|escudo para si/i
      .test(`${description} ${category}`)
      ? "self"
      : "enemy";
  }

  const active = (row) => row?.is_active !== false;

  function mergeRows(localRows, dbRows, key) {
    const result = new Map();

    localRows.filter(active).forEach((row) => {
      const id = String(row[key] ?? "");
      if (id) result.set(id, row);
    });

    (dbRows || []).filter(active).forEach((row) => {
      const id = String(row[key] ?? "");
      if (!id) return;

      const fallback = result.get(id) || {};
      result.set(id, {
        ...fallback,
        ...row,
        _local: null,
        _cms: true
      });
    });

    return [...result.values()].sort((a, b) =>
      (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
      || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
    );
  }

  function fallbackClasses() {
    return Object.values(localClasses).map((cls, index) => ({
      id: cls.id,
      name: cls.nome,
      description: cls.descricao || "",
      role: cls.cargo || "",
      specialization: cls.especializacao?.titulo || cls.cargo || "",
      difficulty: (String(cls.dificuldade || "").match(/★/g) || []).length || 1,
      primary_attribute: String(cls.estilo?.atributos || "")
        .match(/FOR|DEF|RES|INI|INT|ARC/i)?.[0]?.toUpperCase() || null,
      secondary_attribute: String(cls.estilo?.atributos || "")
        .match(/(?:FOR|DEF|RES|INI|INT|ARC).*?(FOR|DEF|RES|INI|INT|ARC)/i)?.[1]?.toUpperCase() || null,
      strengths: cls.estilo?.fortes || "",
      weaknesses: cls.estilo?.fracos || "",
      resource_name: cls.recurso?.nome || null,
      resource_description: cls.recurso?.descricao || "",
      icon: cls.icone || "",
      artwork_url: cls.imagem || "",
      is_active: true,
      sort_order: index,
      _local: cls
    }));
  }

  function fallbackRaces() {
    return localRaces.map((race, index) => ({
      id: race.id,
      name: race.name,
      description: race.description || race.descricao || "",
      tagline: race.tagline || "",
      archetype: race.archetype || "",
      difficulty: (String(race.difficulty || race.dificuldade || "").match(/★/g) || []).length || 1,
      base_hp: Number(race.stats?.hp || race.hp || 500),
      base_mana: Number(race.stats?.mana || race.mana || 0),
      mechanic_name: race.mechanic?.name || race.mecanica?.nome || null,
      mechanic_description: race.mechanic?.description || race.mecanica?.descricao || "",
      icon: race.icon || "",
      artwork_url: race.artwork || race.image || "",
      is_active: true,
      sort_order: index,
      _local: race
    }));
  }

  function fallbackPaths() {
    return Object.values(localClasses).flatMap((cls) =>
      (cls.caminhos || []).map((path, index) => ({
        id: path.id || slug(path.nome),
        class_id: cls.id,
        name: path.nome,
        description: path.descricao || "",
        specialization: path.especializacao || "",
        complexity: path.complexidade || "",
        is_active: true,
        sort_order: index,
        _local: path
      }))
    );
  }

  function fallbackPassives() {
    const list = [];

    Object.values(localClasses).forEach((cls) => {
      (cls.passivas || []).forEach((passive, index) => {
        list.push({
          id: `local-class-${cls.id}-${index}`,
          passive_key: `${cls.id}-${slug(passive.nome)}`,
          name: passive.nome,
          description: text(passive.descricao),
          source_type: "class",
          class_id: cls.id,
          race_id: null,
          class_path_id: null,
          effect_schema: [],
          is_active: true,
          sort_order: index,
          _local: passive
        });
      });

      (cls.caminhos || []).forEach((path, index) => {
        if (!path.passiva) return;

        list.push({
          id: `local-path-${path.id}`,
          passive_key: `${path.id}-${slug(path.passiva.nome || path.nome)}`,
          name: path.passiva.nome || path.nome,
          description: text(path.passiva.descricao),
          source_type: "path",
          class_id: cls.id,
          race_id: null,
          class_path_id: path.id,
          effect_schema: [],
          is_active: true,
          sort_order: index,
          _local: path.passiva
        });
      });
    });

    localRaces.forEach((race) => {
      (race.traits || []).forEach((passive, index) => {
        const name = passive.title || passive.nome || passive.name;
        list.push({
          id: `local-race-${race.id}-${index}`,
          passive_key: `${race.id}-${slug(name)}`,
          name,
          description: text(passive.content || passive.descricao || passive.description),
          source_type: "race",
          race_id: race.id,
          class_id: null,
          class_path_id: null,
          effect_schema: [],
          is_active: true,
          sort_order: index,
          _local: passive
        });
      });
    });

    return list;
  }

  function makeSkillRow({
    id,
    skillKey,
    name,
    description,
    category,
    sourceType,
    classId = null,
    classPathId = null,
    raceId = null,
    unlockLevel = 1,
    sortOrder = 0,
    localSkill
  }) {
    const scale = parseScale(description);

    return {
      id,
      skill_key: skillKey,
      name,
      description,
      category: category || "",
      source_type: sourceType,
      class_id: classId,
      class_path_id: classPathId,
      race_id: raceId,
      unlock_level: unlockLevel,
      mana_cost: parseMana(description),
      cooldown_turns: parseCooldown(description),
      range_cells: /distância|distancia|alcance|projétil|projetil|área|area/i.test(description) ? 3 : 1,
      area_cells: /área de (\d+)/i.test(description)
        ? Number(description.match(/área de (\d+)/i)?.[1] || 0)
        : 0,
      duration_turns: Number(description.match(/por (\d+) turn/i)?.[1] || 0),
      target_type: inferTarget(description, category),
      damage_type: /mágic/i.test(description)
        ? "magical"
        : /dano verdadeiro/i.test(description)
          ? "true"
          : /causa|dano/i.test(description)
            ? "physical"
            : "none",
      scale_attribute: scale?.attribute || null,
      scale_percent: scale?.percent || 0,
      effect_schema: [],
      is_passive: false,
      is_ultimate: /ultimate|máxima|maxima/i.test(String(category || "")),
      is_active: true,
      sort_order: sortOrder,
      _local: localSkill
    };
  }

  function fallbackSkills() {
    const list = [];

    Object.values(localClasses).forEach((cls) => {
      (cls.progressao || []).forEach((skill, index) => {
        const description = text(skill.descricao);
        list.push(makeSkillRow({
          id: `local-class-${cls.id}-${index}`,
          skillKey: `${cls.id}-${slug(skill.nome)}`,
          name: skill.nome,
          description,
          category: skill.categoria || "",
          sourceType: "class",
          classId: cls.id,
          unlockLevel: levelOf(skill.nivel),
          sortOrder: index,
          localSkill: skill
        }));
      });

      (cls.caminhos || []).forEach((path) => {
        (path.habilidades || []).forEach((skill, index) => {
          const description = text(skill.descricao);
          list.push(makeSkillRow({
            id: `local-path-${path.id}-${index}`,
            skillKey: `${path.id}-${slug(skill.nome)}`,
            name: skill.nome,
            description,
            category: skill.tipo || "",
            sourceType: "path",
            classId: cls.id,
            classPathId: path.id,
            unlockLevel: [60, 70, 80, 90, 100][index] || 100,
            sortOrder: index,
            localSkill: skill
          }));
        });
      });
    });

    localRaces.forEach((race) => {
      (race.progression || []).forEach((skill, index) => {
        const description = text(skill.content || skill.descricao);
        const metadata = Array.isArray(skill.meta) ? skill.meta.join(" ") : "";
        const row = makeSkillRow({
          id: `local-race-${race.id}-${index}`,
          skillKey: `${race.id}-${slug(skill.name || skill.nome)}`,
          name: skill.name || skill.nome,
          description,
          category: skill.type || skill.tipo || "",
          sourceType: "race",
          raceId: race.id,
          unlockLevel: Number(skill.level || 1),
          sortOrder: index,
          localSkill: skill
        });

        row.mana_cost = parseMana(`${description} ${metadata}`);
        row.cooldown_turns = parseCooldown(`${description} ${metadata}`);
        list.push(row);
      });
    });

    return list;
  }

  async function query(table, configure) {
    try {
      let request = client.from(table).select("*");
      if (configure) request = configure(request);

      const result = await request;
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.warn(`Não foi possível carregar ${table} do CMS.`, error);
      return [];
    }
  }

  async function load(options = {}) {
    if (cache.loaded && !options.force) return cache;

    const fallback = {
      races: fallbackRaces(),
      classes: fallbackClasses(),
      paths: fallbackPaths(),
      skills: fallbackSkills(),
      passives: fallbackPassives(),
      mechanics: []
    };

    if (!client) {
      Object.assign(cache, fallback, { loaded: true });
      return cache;
    }

    const [races, classes, paths, skills, passives, mechanics] = await Promise.all([
      query("races", (request) => request.eq("is_active", true).order("sort_order")),
      query("classes", (request) => request.eq("is_active", true).order("sort_order")),
      query("class_paths", (request) => request.eq("is_active", true).order("sort_order")),
      query("skills", (request) => request.eq("is_active", true).order("sort_order")),
      query("passives", (request) => request.eq("is_active", true).order("sort_order")),
      query("combat_mechanics", (request) => request.eq("is_active", true))
    ]);

    cache.races = mergeRows(fallback.races, races, "id");
    cache.classes = mergeRows(fallback.classes, classes, "id");
    cache.paths = mergeRows(fallback.paths, paths, "id");
    cache.skills = mergeRows(fallback.skills, skills, "skill_key");
    cache.passives = mergeRows(fallback.passives, passives, "passive_key");
    cache.mechanics = mergeRows([], mechanics, "mechanic_key");
    cache.loaded = true;

    return cache;
  }

  function invalidate() {
    cache.loaded = false;
  }

  async function characterContent(character) {
    const data = await load();
    const level = Number(character?.level || 1);
    const raceId = character?.race_id;
    const classId = character?.class_id;
    const pathId = character?.path_id || character?.class_path_id || null;

    return {
      race: data.races.find((race) => race.id === raceId) || null,
      cls: data.classes.find((cls) => cls.id === classId) || null,
      path: data.paths.find((path) => path.id === pathId) || null,
      skills: data.skills.filter((skill) =>
        Number(skill.unlock_level || 1) <= level
        && (
          (skill.source_type === "race" && skill.race_id === raceId)
          || (skill.source_type === "class" && skill.class_id === classId)
          || (skill.source_type === "path" && pathId && skill.class_path_id === pathId)
        )
      ),
      passives: data.passives.filter((passive) =>
        (passive.source_type === "race" && passive.race_id === raceId)
        || (passive.source_type === "class" && passive.class_id === classId)
        || (passive.source_type === "path" && pathId && passive.class_path_id === pathId)
      ),
      mechanics: data.mechanics.filter((mechanic) =>
        (mechanic.source_type === "race" && mechanic.race_id === raceId)
        || (mechanic.source_type === "class" && mechanic.class_id === classId)
        || (mechanic.source_type === "path" && pathId && mechanic.class_path_id === pathId)
        || mechanic.source_type === "global"
      )
    };
  }

  window.WONDERLAND_CONTENT_STORE = {
    load,
    invalidate,
    characterContent,
    cache
  };
})();
