"use client";

import { useState } from "react";
import { savePresencePassAction } from "@/app/admin/presenca/actions";

type RewardType = "xp" | "wg" | "item";

type Reward = {
  day_number: number;
  reward_type: RewardType;
  amount: number;
  item_id: string | null;
};

type Item = { id: string; name: string; rarity: string };

export function PresenceRewardEditor({ rewards, items }: { rewards: Reward[]; items: Item[] }) {
  const [types, setTypes] = useState<Record<number, RewardType>>(
    Object.fromEntries(rewards.map((reward) => [reward.day_number, reward.reward_type])),
  );

  return (
    <form action={savePresencePassAction} className="presence-admin-editor">
      <div className="presence-admin-grid">
        {rewards.map((reward) => {
          const type = types[reward.day_number] ?? reward.reward_type;
          return (
            <fieldset key={reward.day_number}>
              <legend>Dia {reward.day_number}</legend>
              <input name="days" type="hidden" value={reward.day_number} />
              <label>
                <span>Recompensa</span>
                <select
                  name={`type_${reward.day_number}`}
                  value={type}
                  onChange={(event) =>
                    setTypes((current) => ({
                      ...current,
                      [reward.day_number]: event.target.value as RewardType,
                    }))
                  }
                >
                  <option value="xp">XP</option>
                  <option value="wg">WG</option>
                  <option value="item">Item</option>
                </select>
              </label>
              <label>
                <span>{type === "item" ? "Quantidade" : "Valor"}</span>
                <input
                  defaultValue={reward.amount}
                  min="1"
                  name={`amount_${reward.day_number}`}
                  type="number"
                />
              </label>
              {type === "item" ? (
                <label className="presence-admin-item-select">
                  <span>Item do catálogo</span>
                  <select
                    name={`item_${reward.day_number}`}
                    defaultValue={reward.item_id ?? ""}
                    required
                  >
                    <option value="">Escolha um item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.rarity}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <input name={`item_${reward.day_number}`} type="hidden" value="" />
              )}
            </fieldset>
          );
        })}
      </div>
      <footer>
        <p>As alterações passam a valer no próximo resgate de presença.</p>
        <button className="button button--primary">Salvar passe de presença</button>
      </footer>
    </form>
  );
}
