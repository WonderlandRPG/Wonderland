"use client";

import { useState } from "react";
import { EquippedTitle } from "@/components/characters/equipped-title";
import type { TitleStyle, TitleRarity } from "@/lib/game/title-style";

export function TitleAppearanceEditor({
  name,
  rarity,
  initialStyle,
}: {
  name: string;
  rarity: TitleRarity;
  initialStyle: TitleStyle;
}) {
  const [style, setStyle] = useState(initialStyle);
  const set = <K extends keyof TitleStyle>(key: K, value: TitleStyle[K]) =>
    setStyle((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="admin-title-preview is-wide">
        <small>Prévia ao vivo</small>
        <EquippedTitle title={{ name, rarity, titleStyle: style }} />
        <p>As alterações de aparência aparecem aqui antes de salvar.</p>
      </div>
      <fieldset className="title-color-editor">
        <legend>Aparência da placa</legend>
        <label>
          <span>Texto</span>
          <input
            name="primary"
            type="color"
            value={style.primary}
            onChange={(event) => set("primary", event.target.value)}
          />
        </label>
        <label>
          <span>Fundo</span>
          <input
            name="secondary"
            type="color"
            value={style.secondary}
            onChange={(event) => set("secondary", event.target.value)}
          />
        </label>
        <label>
          <span>Brilho</span>
          <input
            name="glow"
            type="color"
            value={style.glow}
            onChange={(event) => set("glow", event.target.value)}
          />
        </label>
        <label>
          <span>Borda e selo</span>
          <input
            name="accent"
            type="color"
            value={style.accent}
            onChange={(event) => set("accent", event.target.value)}
          />
        </label>
        <label>
          <span>Símbolo</span>
          <input
            name="sigil"
            maxLength={4}
            value={style.sigil}
            onChange={(event) => set("sigil", event.target.value)}
            required
          />
        </label>
        <label>
          <span>Formato</span>
          <select
            name="frame"
            value={style.frame}
            onChange={(event) => set("frame", event.target.value as TitleStyle["frame"])}
          >
            <option value="classic">Clássico</option>
            <option value="ornate">Ornamental</option>
            <option value="royal">Real</option>
            <option value="arcane">Arcano</option>
            <option value="infernal">Sombrio</option>
          </select>
        </label>
        <label>
          <span>Animação</span>
          <select
            name="animated"
            value={style.animated ? "yes" : "no"}
            onChange={(event) => set("animated", event.target.value === "yes")}
          >
            <option value="yes">Ativada</option>
            <option value="no">Desativada</option>
          </select>
        </label>
      </fieldset>
    </>
  );
}
