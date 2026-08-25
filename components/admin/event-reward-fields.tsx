"use client";

import { useState } from "react";

export type EventRewardDraft = {
  id?: string;
  reward_type: "gold" | "xp" | "item" | "title";
  amount: number;
  item_id: string | null;
};

type RewardItem = { id: string; name: string; slot: string };

export function EventRewardFields({
  initialRewards,
  items,
}: {
  initialRewards: EventRewardDraft[];
  items: RewardItem[];
}) {
  const [rewards, setRewards] = useState<EventRewardDraft[]>(initialRewards);

  const update = (index: number, patch: Partial<EventRewardDraft>) =>
    setRewards((current) =>
      current.map((reward, rewardIndex) =>
        rewardIndex === index ? { ...reward, ...patch } : reward,
      ),
    );

  return (
    <fieldset className="admin-event-rewards">
      <legend>Recompensas ao se inscrever</legend>
      <p>
        Adicione quantas recompensas quiser. Cada uma será entregue uma única vez ao personagem que
        clicar em “Inscrever-se”.
      </p>
      <div className="admin-event-rewards__list">
        {rewards.map((reward, index) => {
          const needsItem = reward.reward_type === "item" || reward.reward_type === "title";
          const availableItems = items.filter((item) =>
            reward.reward_type === "title" ? item.slot === "title" : item.slot !== "title",
          );
          return (
            <div className="admin-event-reward" key={reward.id ?? `reward-${index}`}>
              <label>
                <span>Tipo</span>
                <select
                  name="rewardType"
                  value={reward.reward_type}
                  onChange={(event) =>
                    update(index, {
                      reward_type: event.target.value as EventRewardDraft["reward_type"],
                      item_id: null,
                    })
                  }
                >
                  <option value="gold">WG</option>
                  <option value="xp">Experiência</option>
                  <option value="item">Item</option>
                  <option value="title">Título</option>
                </select>
              </label>
              {needsItem ? (
                <label className="admin-event-reward__item">
                  <span>{reward.reward_type === "title" ? "Título" : "Item"}</span>
                  <select
                    name="rewardItemId"
                    required
                    value={reward.item_id ?? ""}
                    onChange={(event) => update(index, { item_id: event.target.value || null })}
                  >
                    <option value="">Selecione…</option>
                    {!availableItems.length ? (
                      <option disabled value="__empty">
                        Nenhum {reward.reward_type === "title" ? "título" : "item"} disponível
                      </option>
                    ) : null}
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <input name="rewardItemId" type="hidden" value="" />
              )}
              <label>
                <span>Quantidade</span>
                <input
                  min="1"
                  name="rewardAmount"
                  required
                  type="number"
                  value={reward.amount}
                  onChange={(event) => update(index, { amount: Number(event.target.value) })}
                />
              </label>
              <button
                className="button button--danger"
                onClick={() =>
                  setRewards((current) => current.filter((_, rewardIndex) => rewardIndex !== index))
                }
                type="button"
              >
                Remover
              </button>
            </div>
          );
        })}
      </div>
      <button
        className="button button--secondary"
        onClick={() =>
          setRewards((current) => [...current, { reward_type: "gold", amount: 1, item_id: null }])
        }
        type="button"
      >
        ＋ Adicionar recompensa
      </button>
    </fieldset>
  );
}
