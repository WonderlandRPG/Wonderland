"use client";

import Image from "next/image";
import { useActionState, useState } from "react";

import { initialReworkCatalogActionState, saveReworkCatalogEntry } from "@/app/admin/migracao-rework/catalog-actions";
import type { ReworkClass, ReworkRace } from "@/lib/game/rework-catalog";

type Props = { classes: ReworkClass[]; races: ReworkRace[] };

export function ReworkCatalogEditor({ classes, races }: Props) {
  const [kind, setKind] = useState<"class" | "race">("class");
  const [classValues, setClassValues] = useState(classes);
  const [raceValues, setRaceValues] = useState(races);
  const [selected, setSelected] = useState(classes[0]?.id ?? "");
  const [state, action, pending] = useActionState(saveReworkCatalogEntry, initialReworkCatalogActionState);
  const currentClass = classValues.find((entry) => entry.id === selected);
  const currentRace = raceValues.find((entry) => entry.id === selected);
  const current = kind === "class" ? currentClass : currentRace;

  function changeKind(next: "class" | "race") {
    setKind(next);
    setSelected(next === "class" ? classValues[0]?.id ?? "" : raceValues[0]?.id ?? "");
  }
  function updateClass(update: (entry: ReworkClass) => ReworkClass) {
    setClassValues((items) => items.map((entry) => entry.id === selected ? update(entry) : entry));
  }
  function updateRace(update: (entry: ReworkRace) => ReworkRace) {
    setRaceValues((items) => items.map((entry) => entry.id === selected ? update(entry) : entry));
  }

  return <section className="admin-section rework-editor">
    <header><div><span className="eyebrow">Editor completo</span><h3>Classes e Raças do Rework</h3><p>Alterações publicadas aqui alimentam as páginas dos jogadores imediatamente.</p></div></header>
    <div className="race-catalog-filters">
      <button className={kind === "class" ? "is-active" : ""} onClick={() => changeKind("class")} type="button">Classes <span>17</span></button>
      <button className={kind === "race" ? "is-active" : ""} onClick={() => changeKind("race")} type="button">Raças <span>11</span></button>
    </div>
    <label className="race-field"><span>Registro</span><select value={selected} onChange={(event) => setSelected(event.target.value)}>{(kind === "class" ? classValues : raceValues).map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
    {state.message ? <div className={`admin-notice ${state.status === "error" ? "admin-notice--error" : ""}`}>{state.message}</div> : null}
    {current ? <form action={action} className="race-editor-form">
      <input name="type" type="hidden" value={kind} />
      <input name="payload" type="hidden" value={JSON.stringify(current)} />
      {kind === "class" && currentClass ? <ClassFields value={currentClass} update={updateClass} /> : null}
      {kind === "race" && currentRace ? <RaceFields value={currentRace} update={updateRace} /> : null}
      <div className="race-editor-footer"><button className="button button--primary" disabled={pending} type="submit">{pending ? "Publicando…" : "Salvar e publicar"}</button></div>
    </form> : null}
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="race-field"><span>{label}</span>{children}</label>; }

function ClassFields({ value, update }: { value: ReworkClass; update: (fn: (entry: ReworkClass) => ReworkClass) => void }) {
  return <>
    <div className="race-form-grid race-form-grid--two"><Field label="Nome"><input value={value.name} onChange={(e) => update((v) => ({ ...v, name: e.target.value }))} /></Field><Field label="Função"><input value={value.role} onChange={(e) => update((v) => ({ ...v, role: e.target.value }))} /></Field></div>
    <Field label="Descrição"><textarea rows={4} value={value.description} onChange={(e) => update((v) => ({ ...v, description: e.target.value }))} /></Field>
    <h4>Caminhos e especializações</h4>
    <div className="structured-skill__grid structured-skill__grid--4">{value.paths.map((path, index) => <div className="structured-skill" key={path.id}><Field label="Nome"><input value={path.name} onChange={(e) => update((v) => ({ ...v, paths: v.paths.map((p, i) => i === index ? { ...p, name: e.target.value } : p) as ReworkClass["paths"] }))} /></Field><Field label="Especialização"><textarea rows={3} value={path.description} onChange={(e) => update((v) => ({ ...v, paths: v.paths.map((p, i) => i === index ? { ...p, description: e.target.value } : p) as ReworkClass["paths"] }))} /></Field></div>)}</div>
    <h4>Passiva e habilidades de classe</h4>
    {value.abilities.map((ability, index) => <article className="structured-skill" key={ability.id}>
      <header><Image alt="" height={56} src={ability.iconUrl} width={56} /><div><strong>{ability.kind}</strong><small>Desbloqueio: nível {ability.unlockLevel}</small></div></header>
      <div className="race-form-grid race-form-grid--two"><Field label="Nome"><input value={ability.name} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, name: e.target.value } : a) as ReworkClass["abilities"] }))} /></Field><Field label="Recarga"><input value={ability.cooldown} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, cooldown: e.target.value } : a) as ReworkClass["abilities"] }))} /></Field></div>
      <Field label="Descrição"><textarea rows={3} value={ability.description} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, description: e.target.value } : a) as ReworkClass["abilities"] }))} /></Field>
      <div className="race-form-grid race-form-grid--two"><Field label="Alcance"><input value={ability.combat.range} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, combat: { ...a.combat, range: e.target.value } } : a) as ReworkClass["abilities"] }))} /></Field><Field label="Área"><input value={ability.combat.area} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, combat: { ...a.combat, area: e.target.value } } : a) as ReworkClass["abilities"] }))} /></Field></div>
      <details><summary>Editar três variações de talento</summary>{ability.variants.map((variant, variantIndex) => <div className="race-form-grid race-form-grid--two" key={variant.id}><Field label={`${variant.pathName} · Nome`}><input value={variant.name} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, variants: a.variants.map((item, vi) => vi === variantIndex ? { ...item, name: e.target.value } : item) as typeof a.variants } : a) as ReworkClass["abilities"] }))} /></Field><Field label="Descrição"><textarea rows={3} value={variant.description} onChange={(e) => update((v) => ({ ...v, abilities: v.abilities.map((a, i) => i === index ? { ...a, variants: a.variants.map((item, vi) => vi === variantIndex ? { ...item, description: e.target.value } : item) as typeof a.variants } : a) as ReworkClass["abilities"] }))} /></Field></div>)}</details>
    </article>)}
  </>;
}

function RaceFields({ value, update }: { value: ReworkRace; update: (fn: (entry: ReworkRace) => ReworkRace) => void }) {
  const stats = ["FOR", "INT", "DEF", "RES", "HP", "INI"] as const;
  return <><div className="race-form-grid race-form-grid--two"><Field label="Nome"><input value={value.name} onChange={(e) => update((v) => ({ ...v, name: e.target.value }))} /></Field><Field label="Epíteto"><input value={value.epithet} onChange={(e) => update((v) => ({ ...v, epithet: e.target.value }))} /></Field></div><Field label="Descrição"><textarea rows={4} value={value.description} onChange={(e) => update((v) => ({ ...v, description: e.target.value }))} /></Field><h4>Atributos básicos</h4><div className="race-attributes-editor">{stats.map((stat) => <label key={stat}><span>{stat}</span><input min={0} type="number" value={value.baseStats[stat]} onChange={(e) => update((v) => ({ ...v, baseStats: { ...v.baseStats, [stat]: Number(e.target.value) } }))} /></label>)}</div><h4>Característica e habilidades raciais</h4>{value.powers.map((power, index) => <article className="structured-skill" key={power.id}><header><Image alt="" height={56} src={power.iconUrl} width={56} /><div><strong>{power.kind}</strong><small>Desbloqueio: nível {power.unlockLevel}</small></div></header><Field label="Nome"><input value={power.name} onChange={(e) => update((v) => ({ ...v, powers: v.powers.map((p, i) => i === index ? { ...p, name: e.target.value } : p) as ReworkRace["powers"] }))} /></Field><Field label="Descrição"><textarea rows={3} value={power.description} onChange={(e) => update((v) => ({ ...v, powers: v.powers.map((p, i) => i === index ? { ...p, description: e.target.value } : p) as ReworkRace["powers"] }))} /></Field>{power.kind === "Habilidade" ? <div className="race-form-grid race-form-grid--two"><Field label="Recarga"><input value={power.cooldown ?? ""} onChange={(e) => update((v) => ({ ...v, powers: v.powers.map((p, i) => i === index ? { ...p, cooldown: e.target.value } : p) as ReworkRace["powers"] }))} /></Field><Field label="Alcance"><input value={power.range ?? ""} onChange={(e) => update((v) => ({ ...v, powers: v.powers.map((p, i) => i === index ? { ...p, range: e.target.value } : p) as ReworkRace["powers"] }))} /></Field></div> : null}</article>)}</>;
}
