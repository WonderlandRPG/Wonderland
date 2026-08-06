"use strict";

(function () {
  const escText = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  function paragraph(value) {
    return `<p>${escText(value)}</p>`;
  }

  function applyCmsRaces(data) {
    const local = Array.isArray(window.WONDERLAND_RACES)
      ? window.WONDERLAND_RACES
      : [];
    const byId = new Map(local.map((race) => [race.id, { ...race }]));

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

      race.name = row.name ?? race.name;
      race.tagline = row.tagline ?? race.tagline;
      race.archetype = row.archetype ?? race.archetype;
      race.difficulty = Number(row.difficulty ?? race.difficulty ?? 1);
      race.icon = row.icon ?? race.icon;
      race.artwork = row.artwork_url ?? race.artwork;
      race.image = row.artwork_url ?? race.image;

      if (row.description !== null && row.description !== undefined) {
        race.description = Array.isArray(row.description)
          ? row.description
          : [String(row.description)].filter(Boolean);
      }

      race.stats = {
        ...(race.stats || {}),
        hp: Number(row.base_hp ?? race.stats?.hp ?? 500),
        mana: Number(row.base_mana ?? race.stats?.mana ?? 0),
        attributes: race.stats?.attributes || {}
      };

      const mechanics = (data.mechanics || [])
        .filter((item) => item.source_type === "race" && item.race_id === row.id && item.is_active !== false)
        .map((item) => ({ title: item.name, content: paragraph(item.description), _cms: item }));

      if (row.mechanic_name || row.mechanic_description) {
        mechanics.unshift({
          title: row.mechanic_name || "Mecânica racial",
          content: paragraph(row.mechanic_description),
          _cms: row
        });
      }

      if (mechanics.length) race.mechanics = mechanics;

      const traits = (data.passives || [])
        .filter((item) => item.source_type === "race" && item.race_id === row.id && item.is_active !== false)
        .map((item) => ({ label: "Traço racial", title: item.name, content: paragraph(item.description), _cms: item }));

      if (traits.length) race.traits = traits;

      const progression = (data.skills || [])
        .filter((item) => item.source_type === "race" && item.race_id === row.id && item.is_active !== false)
        .sort((a, b) => (Number(a.unlock_level) || 1) - (Number(b.unlock_level) || 1))
        .map((item) => ({
          level: Number(item.unlock_level || 1),
          name: item.name,
          type: item.is_ultimate ? "Ultimate" : item.category || "Habilidade racial",
          content: escText(item.description),
          meta: [
            Number(item.mana_cost || 0) > 0 ? `${Number(item.mana_cost)} Mana` : "Sem custo",
            Number(item.cooldown_turns || 0) > 0 ? `Recarga: ${Number(item.cooldown_turns)} turnos` : ""
          ].filter(Boolean),
          _cms: item
        }));

      if (progression.length) race.progression = progression;
      byId.set(row.id, race);
    });

    window.WONDERLAND_RACES = [...byId.values()];
  }

  function loadRacePageScript() {
    const script = document.createElement("script");
    script.src = "js/pages/racas.js?v=25";
    script.async = false;
    document.body.appendChild(script);
  }

  (async () => {
    try {
      const store = window.WONDERLAND_CONTENT_STORE;
      if (store) {
        const data = await store.load({ force: true });
        applyCmsRaces(data);
      }
    } catch (error) {
      console.warn("Não foi possível sincronizar Raças com o CMS; usando catálogo local.", error);
    } finally {
      loadRacePageScript();
    }
  })();
})();
