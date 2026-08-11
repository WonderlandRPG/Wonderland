"use client";

import { useState } from "react";
import { savePresencePassAction } from "@/app/admin/presenca/actions";

type RewardType = "xp" | "wg" | "item" | "title";

type Reward = {
  day_number: number;
  reward_type: RewardType;
  amount: number;
  item_id: string | null;
};

type Item = { id: string; name: string; rarity: string; slot: string };

export function PresenceRewardEditor({
  rewards,
  items,
  config,
}: {
  rewards: Reward[];
  items: Item[];
  config: { starts_on: string; ends_on: string; day_count: number };
}) {
  const [dayCount, setDayCount] = useState(config.day_count);
  const [types, setTypes] = useState<Record<number, RewardType>>(
    Object.fromEntries(rewards.map((reward) => [reward.day_number, reward.reward_type])),
  );

  return (
    <form action={savePresencePassAction} className="presence-admin-editor">
      <section className="presence-campaign-settings">
        <div>
          <span className="eyebrow">Período da campanha</span>
          <h3>Quando a Presença estará disponível</h3>
          <p>Fora destas datas nenhum jogador poderá marcar presença ou resgatar recompensa.</p>
        </div>
        <label>
          <span>Começa em</span>
          <input name="startsOn" type="date" defaultValue={config.starts_on} required />
        </label>
        <label>
          <span>Termina em</span>
          <input name="endsOn" type="date" defaultValue={config.ends_on} required />
        </label>
        <label>
          <span>Dias de recompensa</span>
          <input
            name="dayCount"
            type="number"
            min="1"
            max="31"
            value={dayCount}
            onChange={(event) => setDayCount(Number(event.target.value))}
            required
          />
        </label>
      </section>
      <div className="presence-admin-grid">
        {rewards.slice(0, dayCount).map((reward) => {
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
                  <option value="title">Título</option>
                </select>
              </label>
              <label>
                <span>{type === "item" || type === "title" ? "Quantidade" : "Valor"}</span>
                <input
                  defaultValue={reward.amount}
                  min="1"
                  name={`amount_${reward.day_number}`}
                  type="number"
                />
              </label>
              {type === "item" || type === "title" ? (
                <label className="presence-admin-item-select">
                  <span>{type === "title" ? "Título" : "Item do catálogo"}</span>
                  <select
                    name={`item_${reward.day_number}`}
                    defaultValue={reward.item_id ?? ""}
                    required
                  >
                    <option value="">Escolha um item</option>
                    {items
                      .filter((item) => (type === "title" ? item.slot === "title" : item.slot !== "title"))
                      .map((item) => (
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
