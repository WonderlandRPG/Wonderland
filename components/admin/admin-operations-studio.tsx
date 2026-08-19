"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  generateMissionWithAiAction,
  initialMissionAiState,
  saveMissionFromStudioAction,
  updateBalanceSettingFromStudioAction,
} from "@/app/admin/estudio/operations-actions";
import { kingdomMissionNames, missionKingdoms, missionRanks, officialMissionRewards } from "@/lib/game/missions";
import { simpleMissionDefaults, type SimpleMissionDraft } from "@/lib/admin/simple-operations-builder";
import styles from "./admin-creation-studio.module.css";

type BalanceSetting = {
  key: string;
  category: string;
  label: string;
  description: string;
  valueText: string;
  status: string;
  revision: number;
};

export function AdminOperationsStudio({
  missions,
  settings,
  aiConfigured,
}: {
  missions: SimpleMissionDraft[];
  settings: BalanceSetting[];
  aiConfigured: boolean;
}) {
  return (
    <section className={styles.operationsStudio}>
      <header className={styles.sectionHeading}>
        <div><span>06</span><h2>Missões e Balanceamento</h2></div>
        <p>Operações frequentes do ADM sem editar SQL, JSON bruto ou código.</p>
      </header>
      <div className={styles.operationGrid}>
        <MissionStudio missions={missions} aiConfigured={aiConfigured} />
        <BalanceStudio settings={settings} />
      </div>
    </section>
  );
}

function MissionStudio({ missions, aiConfigured }: { missions: SimpleMissionDraft[]; aiConfigured: boolean }) {
  const [draft, setDraft] = useState(simpleMissionDefaults());
  const [aiState, aiAction, aiPending] = useActionState(generateMissionWithAiAction, initialMissionAiState);
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState("");
  useEffect(() => { if (aiState.status === "success") setDraft(aiState.draft); }, [aiState]);
  const reward = officialMissionRewards[draft.rank];
  const selectedId = draft.id || "";

  function load(id: string) {
    setMessage("");
    const found = missions.find((mission) => mission.id === id);
    setDraft(found ? { ...found } : simpleMissionDefaults());
  }
  function save() {
    if (!window.confirm(`${draft.id ? "Salvar alterações em" : "Criar"} “${draft.name}”?`)) return;
    setMessage("");
    startSaving(async () => {
      const result = await saveMissionFromStudioAction(draft);
      setMessage(result.message);
    });
  }

  return (
    <article className={styles.operationCard}>
      <div className={styles.operationTitle}><span>MISSÕES</span><h3>Criar ou editar missão</h3><p>Recompensas são aplicadas automaticamente conforme o Rank.</p></div>
      <label className={styles.studioField}><span>Editar existente</span><select value={selectedId} onChange={(e) => load(e.target.value)}><option value="">Criar nova missão</option>{missions.map((mission) => <option key={mission.id} value={mission.id}>{mission.rank} · {mission.name}</option>)}</select></label>
      <div className={styles.missionAiBox}>
        <strong>✦ Gerar missão com IA</strong>
        <form action={aiAction}>
          <textarea name="prompt" rows={3} required placeholder="Ex.: Crie uma missão Rank C em Darkya sobre investigar um culto que está roubando artefatos do reino." />
          <input accept="image/*" name="image" type="file" />
          <button disabled={!aiConfigured || aiPending}>{aiPending ? "Criando…" : "Gerar proposta"}</button>
        </form>
        {aiState.status !== "idle" ? <small className={aiState.status === "error" ? styles.error : styles.success}>{aiState.message}</small> : null}
      </div>
      <div className={styles.operationFields}>
        <Field label="Nome"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Reino"><select value={draft.kingdom} onChange={(e) => setDraft({ ...draft, kingdom: e.target.value as SimpleMissionDraft["kingdom"] })}>{missionKingdoms.map((value) => <option key={value} value={value}>{kingdomMissionNames[value]}</option>)}</select></Field>
        <Field label="Rank"><select value={draft.rank} onChange={(e) => setDraft({ ...draft, rank: e.target.value as SimpleMissionDraft["rank"] })}>{missionRanks.map((value) => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Nível mínimo"><input min={1} max={100} type="number" value={draft.minLevel} onChange={(e) => setDraft({ ...draft, minLevel: Number(e.target.value) })} /></Field>
        <Field label="Ativa?"><select value={draft.active ? "yes" : "no"} onChange={(e) => setDraft({ ...draft, active: e.target.value === "yes" })}><option value="yes">Sim</option><option value="no">Não</option></select></Field>
        <Field label="Prova de Rank?"><select value={draft.isRankTrial ? "yes" : "no"} onChange={(e) => setDraft({ ...draft, isRankTrial: e.target.value === "yes", promotionRank: e.target.value === "yes" ? (draft.promotionRank ?? "D") : null })}><option value="no">Não</option><option value="yes">Sim</option></select></Field>
        {draft.isRankTrial ? <Field label="Promove para"><select value={draft.promotionRank ?? "D"} onChange={(e) => setDraft({ ...draft, promotionRank: e.target.value as SimpleMissionDraft["promotionRank"] })}>{["D","C","B","A"].map((value) => <option key={value}>{value}</option>)}</select></Field> : null}
      </div>
      <Field label="Descrição"><textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
      <Field label="Objetivo"><textarea rows={3} value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} /></Field>
      <div className={styles.rewardPreview}><span>Recompensa automática</span><strong>{reward.xp.toLocaleString("pt-BR")} XP · {reward.wg.toLocaleString("pt-BR")} WG</strong></div>
      <button className={styles.operationPrimary} disabled={saving} onClick={save} type="button">{saving ? "Salvando…" : draft.id ? "Confirmar edição" : "Criar missão"}</button>
      {message ? <p className={styles.operationMessage}>{message}</p> : null}
    </article>
  );
}

function BalanceStudio({ settings }: { settings: BalanceSetting[] }) {
  const [selectedKey, setSelectedKey] = useState(settings[0]?.key ?? "");
  const selected = useMemo(() => settings.find((setting) => setting.key === selectedKey) ?? settings[0], [settings, selectedKey]);
  const [valueText, setValueText] = useState(selected?.valueText ?? "");
  const [revision, setRevision] = useState(selected?.revision ?? 1);
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState("");
  useEffect(() => { setValueText(selected?.valueText ?? ""); setRevision(selected?.revision ?? 1); setMessage(""); }, [selected]);
  if (!selected) return <article className={styles.operationCard}><h3>Balanceamento</h3><p>Nenhuma configuração global encontrada.</p></article>;
  function save() {
    if (!window.confirm(`Alterar “${selected.label}”? Esta mudança afeta o jogo globalmente.`)) return;
    startSaving(async () => {
      const result = await updateBalanceSettingFromStudioAction({ key: selected.key, revision, valueText });
      setMessage(result.message);
      if (result.ok) setRevision(result.nextRevision);
    });
  }
  return (
    <article className={styles.operationCard}>
      <div className={styles.operationTitle}><span>BALANCEAMENTO GLOBAL</span><h3>Editar regras do jogo</h3><p>O histórico e a revisão são gravados automaticamente.</p></div>
      <label className={styles.studioField}><span>Configuração</span><select value={selected.key} onChange={(e) => setSelectedKey(e.target.value)}>{settings.map((setting) => <option key={setting.key} value={setting.key}>{setting.category} · {setting.label}</option>)}</select></label>
      <div className={styles.balanceDescription}><small>{selected.key} · revisão {revision} · {selected.status}</small><strong>{selected.label}</strong><p>{selected.description}</p></div>
      <Field label="Novo valor"><textarea rows={7} value={valueText} onChange={(e) => setValueText(e.target.value)} /></Field>
      <div className={styles.balanceHelp}><strong>Formato aceito</strong><span>Número: <code>100</code></span><span>Booleano: <code>true</code></span><span>Texto: <code>"valor"</code></span><span>Objeto: <code>{'{"FOR":20,"DEF":20}'}</code></span></div>
      <button className={styles.operationDanger} disabled={saving} onClick={save} type="button">{saving ? "Aplicando…" : "Confirmar alteração global"}</button>
      {message ? <p className={styles.operationMessage}>{message}</p> : null}
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.studioField}><span>{label}</span>{children}</label>;
}
