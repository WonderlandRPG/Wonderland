"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./tactical-action-categories.module.css";

type Panel = "race" | "class" | "item" | null;

export function TacticalActionCategories({ active }: { active: boolean }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [toolbar, setToolbar] = useState<HTMLElement | null>(null);
  const [availability, setAvailability] = useState({ race: true, class: true, item: true });

  useEffect(() => {
    if (!active) {
      setToolbar(null);
      setPanel(null);
      return;
    }

    const lab = document.querySelector<HTMLElement>('[aria-label="Laboratório do mapa tático V8"]');
    if (!lab) return;
    const children = Array.from(lab.children) as HTMLElement[];
    const nextToolbar = children.find((entry) => entry.querySelector('button')?.textContent?.includes("Movimento")) ?? null;
    const skillBar = children.find((entry) => Array.from(entry.querySelectorAll("button")).some((button) => /Classe · Alcance|Raça · Alcance|Item ativo/.test(button.textContent ?? ""))) ?? null;
    if (!nextToolbar || !skillBar) return;

    setToolbar(nextToolbar);
    nextToolbar.dataset.actionBar = "true";
    lab.dataset.actionPanel = panel ?? "none";

    const sync = () => {
      const buttons = Array.from(skillBar.querySelectorAll<HTMLButtonElement>("button"));
      for (const button of buttons) {
        const text = button.textContent ?? "";
        button.dataset.actionGroup = /Raça · Alcance/.test(text)
          ? "race"
          : /Classe · Alcance/.test(text)
            ? "class"
            : /Item ativo/.test(text)
              ? "item"
              : "other";
      }
      const group = (name: "race" | "class" | "item") => buttons.filter((button) => button.dataset.actionGroup === name);
      setAvailability({
        race: group("race").some((button) => !button.disabled),
        class: group("class").some((button) => !button.disabled),
        item: group("item").some((button) => !button.disabled),
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(skillBar, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled"] });
    return () => observer.disconnect();
  }, [active, panel]);

  useEffect(() => {
    const lab = document.querySelector<HTMLElement>('[aria-label="Laboratório do mapa tático V8"]');
    if (lab) lab.dataset.actionPanel = active ? panel ?? "none" : "none";
  }, [active, panel]);

  if (!active || !toolbar) return null;

  const categoryButton = (key: Exclude<Panel, null>, label: string, symbol: string) => (
    <button
      type="button"
      className={styles.category}
      data-category={key}
      data-active={panel === key ? "true" : "false"}
      data-used={!availability[key] ? "true" : "false"}
      disabled={!availability[key]}
      onClick={() => setPanel((current) => current === key ? null : key)}
    >
      <span aria-hidden="true">{symbol}</span>
      <strong>{label}</strong>
    </button>
  );

  return createPortal(
    <>
      {categoryButton("race", "Raça", "✦")}
      {categoryButton("class", "Classe", "◆")}
      {categoryButton("item", "Item", "✚")}
    </>,
    toolbar,
  );
}
