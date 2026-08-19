"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  addSkillToClassAction,
  generateSkillWithAiAction,
  initialStudioAiState,
} from "@/app/admin/estudio/actions";
import {
  buildClassSkillFromSimpleDraft,
  simpleDraftDefaults,
  type SimpleSkillDraft,
} from "@/lib/admin/simple-skill-builder";
import styles from "./admin-creation-studio.module.css";

type ClassOption = { id: string; name: string; status: string };
const attributes = ["FOR", "DEF", "RES", "INI", "INT", "ARC"] as const;

export function AdminCreationStudio({ classes, aiConfigured }: { classes: ClassOption[]; aiConfigured: boolean }) {
  const [draft, setDraft] = useState<SimpleSkillDraft>(simpleDraftDefaults());
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [aiState, aiAction, aiPending] = useActionState(generateSkillWithAiAction, initialStudioAiState);
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState("");
  const skill = useMemo(() => {
    try { return buildClassSkillFromSimpleDraft(draft); } catch { return null; }
  }, [draft]);

  useEffect(() => {
    if (aiState.status === "success") setDraft(aiState.draft);
  }, [aiState]);

  const update = <K extends keyof SimpleSkillDraft>(key: K, value: SimpleSkillDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const showModifier = draft.effectType === "buff" || draft.effectType === "debuff";
  const showDuration = showModifier || draft.effectType === "stun";
  const showDamageType = draft.effectType === "damage";

  function saveSkill() {
    if (!classId || !skill) return;
    setMessage("");
    startSaving(async () => {
      const result = await addSkillToClassAction({ classId, draft });
      setMessage(result.message);
    });
  }

  return (
    <div className={styles.studio}>
      <header className={styles.hero}>
        <div>
          <span>STUDIO DE CRIAÇÃO · WONDERLAND</span>
          <h1>Crie conteúdo sem programar</h1>
          <p>Descreva para a IA ou use o modo simples. O Wonderland converte suas escolhas para o contrato técnico do combate e valida tudo antes de salvar.</p>
        </div>
        <div className={`${styles.aiStatus} ${aiConfigured ? styles.online : ""}`}>
          <i />
          <small>Assistente de Wonderland</small>
          <strong>{aiConfigured ? "IA pronta" : "Aguardando chave da API"}</strong>
        </div>
      </header>

      <section className={styles.aiPanel}>
        <div className={styles.sectionHeading}>
          <div><span>01</span><h2>Pedir para a IA</h2></div>
          <p>Você pode escrever naturalmente e anexar uma imagem como referência.</p>
        </div>
        <form action={aiAction} className={styles.aiForm}>
          <textarea name="prompt" required rows={5} placeholder={'Ex.: "Crie uma habilidade para Guerreiro que cause dano físico em 2 inimigos e reduza a DEF deles por 2 turnos. Quero algo agressivo, mas equilibrado."'} />
          <label className={styles.fileField}>
            <span>Imagem de referência</span>
            <input accept="image/*" name="image" type="file" />
            <small>A imagem ajuda a IA a entender tema, aparência e identidade da habilidade.</small>
          </label>
          <button className={styles.aiButton} disabled={aiPending || !aiConfigured} type="submit">
            {aiPending ? "Criando proposta…" : "✦ Gerar proposta com IA"}
          </button>
        </form>
        {aiState.status !== "idle" ? <p className={aiState.status === "error" ? styles.error : styles.success}>{aiState.message}</p> : null}
      </section>

      <section className={styles.builder}>
        <div className={styles.sectionHeading}>
          <div><span>02</span><h2>Criar / ajustar habilidade</h2></div>
          <p>Campos simples. As regras internas são montadas automaticamente.</p>
        </div>

        <div className={styles.editorLayout}>
          <div className={styles.formCard}>
            <label className={styles.full}><span>Nome da habilidade</span><input value={draft.name} onChange={(e) => update("name", e.target.value)} /></label>
            <label className={styles.full}><span>Texto da habilidade</span><textarea rows={5} value={draft.description} onChange={(e) => update("description", e.target.value)} /></label>

            <div className={styles.grid}>
              <label><span>O que ela faz?</span><select value={draft.effectType} onChange={(e) => update("effectType", e.target.value as SimpleSkillDraft["effectType"])}><option value="damage">Dá dano</option><option value="heal">Cura</option><option value="shield">Cria escudo</option><option value="buff">Dá Buff</option><option value="debuff">Dá Debuff</option><option value="stun">Atordoa</option></select></label>
              <label><span>Em quem?</span><select value={draft.targetSide} onChange={(e) => update("targetSide", e.target.value as SimpleSkillDraft["targetSide"])}><option value="enemy">Inimigo</option><option value="ally">Aliado</option><option value="self">Próprio personagem</option></select></label>
              <label><span>Quantos alvos?</span><select value={draft.targetCount} onChange={(e) => update("targetCount", Number(e.target.value))}>{[1,2,3,4].map((n) => <option key={n} value={n}>{n} alvo{n > 1 ? "s" : ""}</option>)}</select></label>
              <label><span>Desbloqueia em qual nível?</span><input min={1} max={100} type="number" value={draft.level} onChange={(e) => update("level", Number(e.target.value))} /></label>
              <label><span>Atributo principal</span><select value={draft.attribute} onChange={(e) => update("attribute", e.target.value as SimpleSkillDraft["attribute"])}>{attributes.map((a) => <option key={a}>{a}</option>)}</select></label>
              <label><span>Multiplicador</span><select value={draft.multiplier} onChange={(e) => update("multiplier", Number(e.target.value))}>{[0,0.5,1,1.5,2,2.5,3,3.5,4,5].map((n) => <option key={n} value={n}>{n === 0 ? "Sem multiplicador" : `${n}x`}</option>)}</select></label>
              <label><span>Valor base</span><input min={0} type="number" value={draft.baseValue} onChange={(e) => update("baseValue", Number(e.target.value))} /></label>
              {showDamageType ? <label><span>Tipo de dano</span><select value={draft.damageType} onChange={(e) => update("damageType", e.target.value as SimpleSkillDraft["damageType"])}><option value="physical">Físico</option><option value="magic">Mágico</option><option value="true">Verdadeiro</option></select></label> : null}
              <label><span>Recurso usado</span><select value={draft.resource} onChange={(e) => update("resource", e.target.value as SimpleSkillDraft["resource"])}><option value="none">Sem custo</option><option value="special">Recurso da classe</option><option value="mana">Mana</option><option value="life">Vida</option></select></label>
              <label><span>Custo</span><input min={0} type="number" value={draft.cost} onChange={(e) => update("cost", Number(e.target.value))} /></label>
              <label><span>Recarga</span><select value={draft.cooldown} onChange={(e) => update("cooldown", Number(e.target.value))}>{[0,1,2,3,4,5,6,8,10].map((n) => <option key={n} value={n}>{n === 0 ? "Sem recarga" : `${n} turno(s)`}</option>)}</select></label>
              <label><span>Chance de acerto</span><select value={draft.chance} onChange={(e) => update("chance", Number(e.target.value))}>{[100,90,80,75,70,60,50].map((n) => <option key={n} value={n}>{n}%</option>)}</select></label>
              {showDuration ? <label><span>Duração</span><select value={draft.duration} onChange={(e) => update("duration", Number(e.target.value))}>{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} turno(s)</option>)}</select></label> : null}
              {showModifier ? <><label><span>Atributo afetado</span><select value={draft.modifierAttribute} onChange={(e) => update("modifierAttribute", e.target.value as SimpleSkillDraft["modifierAttribute"])}>{attributes.map((a) => <option key={a}>{a}</option>)}</select></label><label><span>Força do {draft.effectType === "buff" ? "Buff" : "Debuff"}</span><input min={0} type="number" value={draft.modifierValue} onChange={(e) => update("modifierValue", Number(e.target.value))} /></label></> : null}
              {(showModifier || draft.effectType === "stun") ? <label><span>Nome do efeito</span><input placeholder="Ex.: Armadura Quebrada" value={draft.statusName} onChange={(e) => update("statusName", e.target.value)} /></label> : null}
            </div>
          </div>

          <aside className={styles.preview}>
            <span>PRÉVIA DO JOGADOR</span>
            <h3>{draft.name || "Nova habilidade"}</h3>
            <p>{draft.description}</p>
            <dl>
              <div><dt>Efeito</dt><dd>{draft.effectType.toUpperCase()}</dd></div>
              <div><dt>Alvos</dt><dd>{draft.targetCount}</dd></div>
              <div><dt>Escala</dt><dd>{draft.multiplier ? `${draft.multiplier}x ${draft.attribute}` : "—"}</dd></div>
              <div><dt>Custo</dt><dd>{draft.cost ? `${draft.cost} · ${draft.resource}` : "Sem custo"}</dd></div>
              <div><dt>Recarga</dt><dd>{draft.cooldown ? `${draft.cooldown}T` : "—"}</dd></div>
            </dl>
            {skill ? <div className={styles.valid}>✓ Contrato válido para o motor</div> : <div className={styles.invalid}>! Revise os campos</div>}
          </aside>
        </div>
      </section>

      <section className={styles.savePanel}>
        <div>
          <span>03</span>
          <div><h2>Adicionar à classe</h2><p>A habilidade entra na progressão da classe escolhida. Nada é publicado sem esta confirmação.</p></div>
        </div>
        <select value={classId} onChange={(e) => setClassId(e.target.value)}>{classes.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status === "published" ? "publicada" : "rascunho"}</option>)}</select>
        <button disabled={saving || !skill || !classId} onClick={saveSkill} type="button">{saving ? "Salvando…" : "Adicionar habilidade"}</button>
        {message ? <p>{message}</p> : null}
      </section>

      <section className={styles.shortcuts}>
        <div className={styles.sectionHeading}><div><span>04</span><h2>Outras criações do painel</h2></div><p>Acesso direto aos editores existentes enquanto eles recebem o mesmo modo simples.</p></div>
        <div className={styles.shortcutGrid}>
          <Link href="/admin/classes"><b>Classes</b><span>Criar, editar, caminhos e progressão →</span></Link>
          <Link href="/admin/racas"><b>Raças</b><span>Criar, editar, passivas e habilidades raciais →</span></Link>
          <Link href="/admin/itens"><b>Itens</b><span>Equipamentos, atributos, raridades e efeitos →</span></Link>
          <Link href="/admin/titulos"><b>Títulos</b><span>Atributos, aparência e recompensas →</span></Link>
          <Link href="/admin/missoes"><b>Missões</b><span>Contratos, requisitos e recompensas →</span></Link>
          <Link href="/admin/balanceamento"><b>Balanceamento</b><span>Números globais do combate →</span></Link>
        </div>
      </section>
    </div>
  );
}
