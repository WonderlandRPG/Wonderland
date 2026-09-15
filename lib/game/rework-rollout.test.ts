import { describe, expect, it } from "vitest";

import {
  defaultReworkRolloutState,
  parseReworkRolloutState,
  reworkRolloutModules,
} from "@/lib/game/rework-rollout";

describe("rework rollout", () => {
  it("mantém todos os módulos desligados por padrão", () => {
    expect(Object.values(defaultReworkRolloutState).every((enabled) => !enabled)).toBe(true);
  });

  it("ignora configurações desconhecidas e só aceita booleano true", () => {
    const [first] = reworkRolloutModules;
    const state = parseReworkRolloutState([
      { key: first.settingKey, value: true },
      { key: reworkRolloutModules[1].settingKey, value: "true" },
      { key: "rollout.rework.unknown", value: true },
    ]);

    expect(state[first.id]).toBe(true);
    expect(state[reworkRolloutModules[1].id]).toBe(false);
    expect(Object.keys(state)).toHaveLength(reworkRolloutModules.length);
  });

  it("declara dependências que existem no próprio registro", () => {
    const ids = new Set(reworkRolloutModules.map((module) => module.id));
    expect(
      reworkRolloutModules.every((module) => module.dependencies.every((id) => ids.has(id))),
    ).toBe(true);
  });
});
