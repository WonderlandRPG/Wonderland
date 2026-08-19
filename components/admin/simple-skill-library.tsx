"use client";

import { useMemo, useState, useTransition } from "react";
import { replaceSkillInClassAction } from "@/app/admin/estudio/edit-actions";
import type { SimpleSkillDraft } from "@/lib/admin/simple-skill-builder";
import styles from "./admin-creation-studio.module.css";

type SkillRow = { key: string; name: string; level: number; draft: SimpleSkillDraft };
type ClassRow = { id: string; name: string; status: string; skills: SkillRow[] };

export function SimpleSkillLibrary({ classes }: { classes: ClassRow[] }) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const currentClass = useMemo(() => classes.find((item) => item.id === classId) ?? classes[0], [classes, classId]);
  const [skillKey, setSkillKey] = useState(currentClass?.skills[0]?.key ?? "");
  const selected = currentClass?.skills.find((item) => item.key === skillKey) ?? currentClass?.skills[0];
  const [draft, setDraft] = useState<SimpleSkillDraft | null>(selected?.draft ?? null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function chooseClass(nextId: string) {
    setClassId(nextId);
    const next = classes.find((item) => item.id === nextId);
    const first = next?.skills[0];
    setSkillKey(first?.key ?? "");
    setDraft(first?.draft ?? null);
    setMessage("");
  }
  function chooseSkill(key: string) {
    setSkillKey(key);
    const row = currentClass?.skills.find((item) => item.key === key);
    setDraft(row?.draft ?? null);
    setMessage("");
  }
  const patch = <K extends keyof SimpleSkillDraft>(key: K, value: SimpleSkillDraft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
  function save() {
    if (!draft || !currentClass || !skillKey) return;
    startTransition(async () => {
      const result = await replaceSkillInClassAction({ classId: currentClass.id, existingKey: skillKey, draft });
      setMessage(result.message);
    });
  }

  return (
    <section className={styles.shortcuts} style={{ marginTop: 24 }}>
      <div className={styles.sectionHeading}>
        <div><span>05</span><h2>Editar habilidade existente · modo simples</h2></div>
        <p>Altere os números mais usados sem abrir o contrato técnico.</p>
      </div>
      <div className={styles.grid}>
        <label><span>Classe</span><select value={classId} onChange={(e) => chooseClass(e.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span>Habilidade</span><select value={skillKey} onChange={(e) => chooseSkill(e.target.value)}>{(currentClass?.skills ?? []).map((item) => <option key={item.key} value={item.key}>Nv. {item.level} · {item.name}</option>)}</select></label>
      </div>
      {!draft ? <p>Nenhuma habilidade universal cadastrada nesta classe.</p> : (
        <div className={styles.formCard} style={{ marginTop: 16 }}>
          <label className={styles.full}><span>Texto para o jogador</span><textarea rows={4} value={draft.description} onChange={(e) => patch("description", e.target.value)} /></label>
          <div className={styles.grid}>
            <label><span>Quantidade de alvos</span><select value={draft.targetCount} onChange={(e) => patch("targetCount", Number(e.target.value))}>{[1,2,3,4].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label><span>Atributo</span><select value={draft.attribute} onChange={(e) => patch("attribute", e.target.value as SimpleSkillDraft["attribute"])}>{["FOR","DEF","RES","INI","INT","ARC"].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span>Multiplicador</span><select value={draft.multiplier} onChange={(e) => patch("multiplier", Number(e.target.value))}>{[0,.5,1,1.5,2,2.5,3,3.5,4,5].map((n) => <option key={n} value={n}>{n === 0 ? "Sem multiplicador" : `${n}x`}</option>)}</select></label>
            <label><span>Valor base</span><input type="number" min={0} value={draft.baseValue} onChange={(e) => patch("baseValue", Number(e.target.value))} /></label>
            <label><span>Custo</span><input type="number" min={0} value={draft.cost} onChange={(e) => patch("cost", Number(e.target.value))} /></label>
            <label><span>Recarga</span><select value={draft.cooldown} onChange={(e) => patch("cooldown", Number(e.target.value))}>{[0,1,2,3,4,5,6,8,10].map((n) => <option key={n}>{n}</option>)}</select></label>
          </div>
          <button className={styles.aiButton} disabled={pending} onClick={save} type="button">{pending ? "Salvando…" : "Salvar edição simples"}</button>
          {message ? <p className={styles.success}>{message}</p> : null}
        </div>
      )}
    </section>
  );
}
