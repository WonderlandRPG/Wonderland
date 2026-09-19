export const reworkRolloutModules = [
  {
    id: "classes_races_v2",
    settingKey: "rollout.rework.classes_races_v2",
    label: "Classes e raças",
    description: "Catálogos, atributos-base, passivas e regras de progressão.",
    dependencies: [],
  },
  {
    id: "attributes_power_v2",
    settingKey: "rollout.rework.attributes_power_v2",
    label: "Atributos e poder total",
    description: "Cálculo canônico de atributos derivados e poder total.",
    dependencies: ["classes_races_v2"],
  },
  {
    id: "talents_v2",
    settingKey: "rollout.rework.talents_v2",
    label: "Habilidades e talentos",
    description: "Árvores, loadouts e efeitos utilizados pelo motor de combate.",
    dependencies: ["classes_races_v2", "attributes_power_v2"],
  },
  {
    id: "inventory_equipment_v2",
    settingKey: "rollout.rework.inventory_equipment_v2",
    label: "Itens, equipamentos e inventário",
    description: "Catálogo de itens, 14 slots e aplicação segura de bônus.",
    dependencies: ["attributes_power_v2"],
  },
  {
    id: "tactical_pve_v2",
    settingKey: "rollout.rework.tactical_pve_v2",
    label: "Mapa tático · PvE",
    description: "Combate tático contra monstros sem substituir o fluxo atual.",
    dependencies: ["talents_v2", "inventory_equipment_v2"],
  },
  {
    id: "tactical_pvp_v2",
    settingKey: "rollout.rework.tactical_pvp_v2",
    label: "Mapa tático · PvP",
    description: "Filas, aceite de partida e combate tático entre jogadores.",
    dependencies: ["talents_v2", "inventory_equipment_v2"],
  },
  {
    id: "ranked_v2",
    settingKey: "rollout.rework.ranked_v2",
    label: "Ranqueada 2x2",
    description: "MD5, elo, PdL e pareamento por faixas compatíveis.",
    dependencies: ["tactical_pvp_v2"],
  },
] as const;

export type ReworkRolloutModuleId = (typeof reworkRolloutModules)[number]["id"];

export type ReworkRolloutState = Record<ReworkRolloutModuleId, boolean>;

export const defaultReworkRolloutState = Object.fromEntries(
  reworkRolloutModules.map((module) => [module.id, false]),
) as ReworkRolloutState;

export function parseReworkRolloutState(
  settings: ReadonlyArray<{ key: string; value: unknown }> | null | undefined,
): ReworkRolloutState {
  const state = { ...defaultReworkRolloutState };
  const modulesByKey = new Map<string, (typeof reworkRolloutModules)[number]>(
    reworkRolloutModules.map((module) => [module.settingKey, module]),
  );

  for (const setting of settings ?? []) {
    const rolloutModule = modulesByKey.get(setting.key);
    if (rolloutModule) state[rolloutModule.id] = setting.value === true;
  }

  return state;
}
