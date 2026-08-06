"use strict";

(function () {
  const scaling = window.WONDERLAND_SCALING;
  const store = window.WONDERLAND_CONTENT_STORE;

  if (!scaling) {
    console.error("Sistema de multiplicadores não foi carregado.");
    window.WONDERLAND_CONTENT_READY = Promise.resolve(null);
    return;
  }

  function normalizeTextFields(value) {
    if (typeof value === "string") return scaling.normalizeDescription(value);
    if (Array.isArray(value)) return value.map(normalizeTextFields);
    if (!value || typeof value !== "object") return value;

    const copy = { ...value };
    ["description", "descricao", "content", "text"].forEach((key) => {
      if (typeof copy[key] === "string") copy[key] = scaling.normalizeDescription(copy[key]);
    });
    return copy;
  }

  function normalizeSkillRow(row) {
    const normalized = scaling.normalizeSkill(row || {});
    return {
      ...row,
      ...normalized,
      description: scaling.normalizeDescription(normalized.description || "")
    };
  }

  function normalizeData(data) {
    if (!data) return data;

    data.skills = (data.skills || []).map(normalizeSkillRow);
    data.passives = (data.passives || []).map((row) => ({
      ...row,
      description: scaling.normalizeDescription(row.description || "")
    }));
    data.mechanics = (data.mechanics || []).map((row) => ({
      ...row,
      description: scaling.normalizeDescription(row.description || "")
    }));

    return data;
  }

  function skillToLocal(row) {
    const normalized = normalizeSkillRow(row);
    return {
      nivel: `Nível ${Number(normalized.unlock_level || 1)}`,
      level: Number(normalized.unlock_level || 1),
      nome: normalized.name,
      name: normalized.name,
      categoria: normalized.category || "Habilidade",
      category: normalized.category || "Habilidade",
      tipo: normalized.is_ultimate ? "Ultimate" : normalized.category || "Habilidade",
      descricao: normalized.description,
      description: normalized.description,
      content: normalized.description,
      meta: [
        Number(normalized.mana_cost || 0) > 0 ? `${Number(normalized.mana_cost)} Mana` : "Sem custo",
        Number(normalized.cooldown_turns || 0) > 0
          ? `Recarga: ${Number(normalized.cooldown_turns)} turnos`
          : ""
      ].filter(Boolean),
      ...normalized,
      _cms: normalized
    };
  }

  function passiveToLocal(row) {
    return {
      nome: row.name,
      name: row.name,
      title: row.name,
      descricao: scaling.normalizeDescription(row.description || ""),
      description: scaling.normalizeDescription(row.description || ""),
      content: scaling.normalizeDescription(row.description || ""),
      ...row,
      _cms: row
    };
  }

  function applyClasses(data) {
    const catalog = window.WONDERLAND_CLASSES || {};

    (data.classes || []).forEach((row) => {
      const cls = catalog[row.id] || {
        id: row.id,
        nome: row.name || row.id,
        afinidades: {},
        estilo: {},
        especializacao: {},
        passivas: [],
        progressao: [],
        caminhos: []
      };

      cls.id = row.id;
      cls.nome = row.name || cls.nome;
      cls.descricao = row.description || cls.descricao || "";
      cls.cargo = row.role || cls.cargo || "Classe";
      cls.icone = row.icon || cls.icone || "✦";
      cls.imagem = row.artwork_url || cls.imagem || "assets/images/logo.png";
      cls.especializacao = {
        ...(cls.especializacao || {}),
        titulo: row.specialization || row.role || cls.especializacao?.titulo || cls.cargo,
        descricao: row.description || cls.especializacao?.descricao || cls.descricao
      };
      cls.estilo = {
        ...(cls.estilo || {}),
        principal: row.role || cls.estilo?.principal,
        fortes: row.strengths || cls.estilo?.fortes,
        fracos: row.weaknesses || cls.estilo?.fracos,
        atributos: [row.primary_attribute, row.secondary_attribute].filter(Boolean).join(" • ") || cls.estilo?.atributos
      };
      if (row.resource_name || row.resource_description) {
        cls.recurso = {
          nome: row.resource_name || cls.recurso?.nome || "Mecânica própria",
          descricao: scaling.normalizeDescription(row.resource_description || cls.recurso?.descricao || "")
        };
      }
      cls._cms = row;
      catalog[row.id] = cls;
    });

    Object.values(catalog).forEach((cls) => {
      const classSkills = (data.skills || [])
        .filter((row) => row.source_type === "class" && row.class_id === cls.id && row.is_active !== false)
        .sort((a, b) => (Number(a.unlock_level) || 1) - (Number(b.unlock_level) || 1));
      if (classSkills.length) cls.progressao = classSkills.map(skillToLocal);
      else cls.progressao = (cls.progressao || []).map((row) => ({
        ...normalizeTextFields(row),
        ...scaling.normalizeSkill({
          ...row,
          description: row.descricao || row.description || ""
        }),
        descricao: scaling.normalizeDescription(row.descricao || row.description || "")
      }));

      const classPassives = (data.passives || [])
        .filter((row) => row.source_type === "class" && row.class_id === cls.id && row.is_active !== false)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      if (classPassives.length) cls.passivas = classPassives.map(passiveToLocal);
      else cls.passivas = (cls.passivas || []).map(normalizeTextFields);

      const cmsPaths = (data.paths || [])
        .filter((row) => row.class_id === cls.id && row.is_active !== false)
        .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

      if (cmsPaths.length) {
        cls.caminhos = cmsPaths.map((path) => {
          const skills = (data.skills || [])
            .filter((row) => row.source_type === "path" && row.class_path_id === path.id && row.is_active !== false)
            .sort((a, b) => (Number(a.unlock_level) || 1) - (Number(b.unlock_level) || 1));
          const passive = (data.passives || []).find((row) =>
            row.source_type === "path" && row.class_path_id === path.id && row.is_active !== false
          );

          return {
            id: path.id,
            nome: path.name,
            name: path.name,
            descricao: scaling.normalizeDescription(path.description || ""),
            description: scaling.normalizeDescription(path.description || ""),
            especializacao: path.specialization || "",
            complexidade: path.complexity || "",
            passiva: passive ? passiveToLocal(passive) : null,
            habilidades: skills.map(skillToLocal),
            _cms: path
          };
        });
      } else {
        cls.caminhos = (cls.caminhos || []).map((path) => ({
          ...normalizeTextFields(path),
          passiva: path.passiva ? normalizeTextFields(path.passiva) : null,
          habilidades: (path.habilidades || []).map((skill) => {
            const normalized = scaling.normalizeSkill({
              ...skill,
              description: skill.descricao || skill.description || ""
            });
            return {
              ...skill,
              ...normalized,
              descricao: normalized.description,
              description: normalized.description
            };
          })
        }));
      }
    });

    window.WONDERLAND_CLASSES = catalog;
  }

  function applyRaces(data) {
    const current = Array.isArray(window.WONDERLAND_RACES) ? window.WONDERLAND_RACES : [];
    const byId = new Map(current.map((race) => [race.id, race]));

    (data.races || []).forEach((row) => {
      const race = byId.get(row.id) || {
        id: row.id,
        name: row.name || row.id,
        description: [],
        roles: [],
        stats: { hp: 500, mana: 0, attributes: {} },
        playstyle: {},
        mechanics: [],
        traits: [],
        progression: [],
        curiosities: [],
        theme: { accent: "#d6b56b", secondary: "#718a91" }
      };

      race.name = row.name || race.name;
      race.tagline = row.tagline ?? race.tagline;
      race.archetype = row.archetype ?? race.archetype;
      race.difficulty = Number(row.difficulty ?? race.difficulty ?? 1);
      race.icon = row.icon ?? race.icon;
      race.artwork = row.artwork_url || race.artwork || race.image;
      race.image = row.artwork_url || race.image || race.artwork;
      if (row.description !== null && row.description !== undefined) {
        race.description = Array.isArray(row.description)
          ? row.description.map(scaling.normalizeDescription)
          : [scaling.normalizeDescription(String(row.description))].filter(Boolean);
      }
      race.stats = {
        ...(race.stats || {}),
        hp: Number(row.base_hp ?? race.stats?.hp ?? 500),
        mana: Number(row.base_mana ?? race.stats?.mana ?? 0),
        attributes: race.stats?.attributes || {}
      };
      race._cms = row;
      byId.set(row.id, race);
    });

    byId.forEach((race) => {
      const raceId = race.id;
      const mechanics = (data.mechanics || [])
        .filter((row) => row.source_type === "race" && row.race_id === raceId && row.is_active !== false)
        .map((row) => ({
          title: row.name,
          content: `<p>${scaling.normalizeDescription(row.description || "")}</p>`,
          _cms: row
        }));
      if (mechanics.length) race.mechanics = mechanics;
      else race.mechanics = (race.mechanics || []).map(normalizeTextFields);

      const traits = (data.passives || [])
        .filter((row) => row.source_type === "race" && row.race_id === raceId && row.is_active !== false)
        .map((row) => ({
          label: "Traço racial",
          title: row.name,
          content: `<p>${scaling.normalizeDescription(row.description || "")}</p>`,
          ...row,
          _cms: row
        }));
      if (traits.length) race.traits = traits;
      else race.traits = (race.traits || []).map(normalizeTextFields);

      const progression = (data.skills || [])
        .filter((row) => row.source_type === "race" && row.race_id === raceId && row.is_active !== false)
        .sort((a, b) => (Number(a.unlock_level) || 1) - (Number(b.unlock_level) || 1))
        .map(skillToLocal);
      if (progression.length) race.progression = progression;
      else race.progression = (race.progression || []).map((skill) => {
        const normalized = scaling.normalizeSkill({
          ...skill,
          description: skill.content || skill.descricao || skill.description || ""
        });
        return {
          ...skill,
          ...normalized,
          content: normalized.description,
          descricao: normalized.description,
          description: normalized.description
        };
      });
    });

    window.WONDERLAND_RACES = [...byId.values()];
  }

  function applyCatalogs(data) {
    normalizeData(data);
    applyClasses(data);
    applyRaces(data);
    return data;
  }

  if (!store) {
    const localData = { races: [], classes: [], paths: [], skills: [], passives: [], mechanics: [] };
    applyClasses(localData);
    applyRaces(localData);
    window.WONDERLAND_CONTENT_READY = Promise.resolve(localData);
    return;
  }

  const originalLoad = store.load.bind(store);

  store.load = async function (options = {}) {
    const data = await originalLoad(options);
    return applyCatalogs(data);
  };

  store.characterContent = async function (character) {
    const data = await store.load();
    const level = Number(character?.level || 1);
    const raceId = character?.race_id;
    const classId = character?.class_id;
    const pathId = character?.path_id || character?.class_path_id || null;

    return {
      race: data.races.find((row) => row.id === raceId) || null,
      cls: data.classes.find((row) => row.id === classId) || null,
      path: data.paths.find((row) => row.id === pathId) || null,
      skills: data.skills.filter((row) =>
        Number(row.unlock_level || 1) <= level
        && (
          (row.source_type === "race" && row.race_id === raceId)
          || (row.source_type === "class" && row.class_id === classId)
          || (row.source_type === "path" && pathId && row.class_path_id === pathId)
        )
      ),
      passives: data.passives.filter((row) =>
        (row.source_type === "race" && row.race_id === raceId)
        || (row.source_type === "class" && row.class_id === classId)
        || (row.source_type === "path" && pathId && row.class_path_id === pathId)
      ),
      mechanics: data.mechanics.filter((row) =>
        (row.source_type === "race" && row.race_id === raceId)
        || (row.source_type === "class" && row.class_id === classId)
        || (row.source_type === "path" && pathId && row.class_path_id === pathId)
        || row.source_type === "global"
      )
    };
  };

  window.WONDERLAND_CONTENT_READY = store.load({ force: true }).catch((error) => {
    console.warn("Não foi possível sincronizar o CMS; usando o catálogo local normalizado.", error);
    applyClasses({ skills: [], passives: [], paths: [], mechanics: [], classes: [] });
    applyRaces({ skills: [], passives: [], mechanics: [], races: [] });
    return null;
  });
})();
