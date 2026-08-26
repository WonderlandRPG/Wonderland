"use client";

import { useMemo, useRef, useState } from "react";
import { UpdateBlocks } from "@/components/updates/update-blocks";
import type { UpdateBlock } from "@/lib/game/update-content";

const labels: Record<UpdateBlock["type"], string> = {
  heading: "Título de seção",
  subheading: "Subtítulo",
  paragraph: "Parágrafo",
  highlight: "Destaque",
  list: "Lista",
  stat: "Estatística",
  image: "Imagem",
};

function newBlock(type: UpdateBlock["type"] = "paragraph"): UpdateBlock {
  return { id: crypto.randomUUID(), type, content: "", ...(type === "stat" ? { label: "" } : {}) };
}

function textToBlocks(value: string): UpdateBlock[] {
  const lines = value.replace(/\r/g, "").split("\n");
  const result: UpdateBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (paragraph.length)
      result.push({ id: crypto.randomUUID(), type: "paragraph", content: paragraph.join(" ") });
    if (list.length)
      result.push({ id: crypto.randomUUID(), type: "list", content: list.join("\n") });
    paragraph = [];
    list = [];
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bullet) {
      if (paragraph.length) flush();
      list.push(bullet[1]);
      continue;
    }
    if (/^#{1,2}\s+/.test(line)) {
      flush();
      result.push({
        id: crypto.randomUUID(),
        type: "heading",
        content: line.replace(/^#{1,2}\s+/, ""),
      });
      continue;
    }
    if (/^#{3,6}\s+/.test(line)) {
      flush();
      result.push({
        id: crypto.randomUUID(),
        type: "subheading",
        content: line.replace(/^#{3,6}\s+/, ""),
      });
      continue;
    }
    if (/^>\s+/.test(line)) {
      flush();
      result.push({
        id: crypto.randomUUID(),
        type: "highlight",
        content: line.replace(/^>\s+/, ""),
      });
      continue;
    }
    if (list.length) flush();
    paragraph.push(line);
  }
  flush();
  return result.filter((block) => block.content.trim());
}

export function UpdateComposer({ initial = [] }: { initial?: UpdateBlock[] }) {
  const [blocks, setBlocks] = useState<UpdateBlock[]>(
    initial.length ? initial : [{ id: "draft-1", type: "paragraph", content: "" }],
  );
  const [importing, setImporting] = useState(false);
  const importRef = useRef<HTMLTextAreaElement>(null);
  const serialized = useMemo(() => JSON.stringify(blocks), [blocks]);
  const update = (id: string, patch: Partial<UpdateBlock>) =>
    setBlocks((current) =>
      current.map((block) => (block.id === id ? { ...block, ...patch } : block)),
    );
  const move = (index: number, direction: -1 | 1) =>
    setBlocks((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  async function uploadImage(file: File) {
    const data = new FormData();
    data.set("image", file);
    const response = await fetch("/api/admin/update-images", { method: "POST", body: data });
    const result = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "Falha no upload.");
    setBlocks((current) => [
      ...current,
      { id: crypto.randomUUID(), type: "image", content: result.url!, label: file.name },
    ]);
  }
  return (
    <div className="structured-composer">
      <input name="notes" type="hidden" value={serialized} />
      <div className="structured-composer__toolbar">
        <div>
          <button
            className="is-primary"
            onClick={() => setImporting((current) => !current)}
            type="button"
          >
            {importing ? "Fechar importação" : "✦ Colar texto pronto"}
          </button>
          <strong>Conteúdo da atualização</strong>
          <small>Escolha o formato; o site cuida do estilo.</small>
        </div>
        <div>
          {Object.entries(labels).map(([type, label]) => (
            <button
              key={type}
              onClick={() =>
                setBlocks((current) => [...current, newBlock(type as UpdateBlock["type"])])
              }
              type="button"
            >
              ＋ {label}
            </button>
          ))}
          <label className="structured-composer__upload">
            ↑ Enviar imagem
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  await uploadImage(file);
                } catch (error) {
                  window.alert(error instanceof Error ? error.message : "Falha no upload.");
                }
                event.target.value = "";
              }}
              type="file"
            />
          </label>
        </div>
      </div>
      {importing ? (
        <section className="structured-composer__import">
          <div>
            <strong>Cole seu texto aqui</strong>
            <small>
              Títulos, parágrafos e listas serão organizados automaticamente. Use # para título, -
              para lista e &gt; para destaque.
            </small>
          </div>
          <textarea
            ref={importRef}
            rows={9}
            placeholder={
              "# Título da seção\n\nEscreva ou cole o texto normalmente.\n\n- Primeiro item\n- Segundo item"
            }
          />
          <button
            type="button"
            onClick={() => {
              const imported = textToBlocks(importRef.current?.value ?? "");
              if (!imported.length) return;
              setBlocks(imported);
              setImporting(false);
            }}
          >
            Organizar e criar publicação
          </button>
        </section>
      ) : null}
      <div className="structured-composer__workspace">
        <div className="structured-composer__fields">
          {blocks.map((block, index) => (
            <article key={block.id}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <select
                  aria-label="Tipo do bloco"
                  value={block.type}
                  onChange={(event) =>
                    update(block.id, { type: event.target.value as UpdateBlock["type"] })
                  }
                >
                  {Object.entries(labels).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
                <nav>
                  <button
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    type="button"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    disabled={index === blocks.length - 1}
                    onClick={() => move(index, 1)}
                    type="button"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    className="is-danger"
                    disabled={blocks.length === 1}
                    onClick={() =>
                      setBlocks((current) => current.filter((entry) => entry.id !== block.id))
                    }
                    type="button"
                    aria-label="Remover bloco"
                  >
                    ×
                  </button>
                </nav>
              </header>
              {block.type === "stat" ? (
                <input
                  aria-label="Nome da estatística"
                  placeholder="Ex.: Itens criados"
                  value={block.label ?? ""}
                  onChange={(event) => update(block.id, { label: event.target.value })}
                />
              ) : null}
              {block.type === "image" ? (
                <input
                  aria-label="Legenda da imagem"
                  placeholder="Legenda da imagem"
                  value={block.label ?? ""}
                  onChange={(event) => update(block.id, { label: event.target.value })}
                />
              ) : null}
              <textarea
                aria-label={`Conteúdo de ${labels[block.type]}`}
                placeholder={
                  block.type === "image"
                    ? "URL da imagem enviada"
                    : block.type === "list"
                      ? "Um item por linha"
                      : `Escreva o ${labels[block.type].toLowerCase()}`
                }
                rows={block.type === "paragraph" || block.type === "list" ? 4 : 2}
                readOnly={block.type === "image"}
                value={block.content}
                onChange={(event) => update(block.id, { content: event.target.value })}
                required
              />
            </article>
          ))}
        </div>
        <aside className="structured-composer__preview">
          <small>PRÉVIA PARA O JOGADOR</small>
          <UpdateBlocks blocks={blocks.filter((block) => block.content.trim())} />
        </aside>
      </div>
    </div>
  );
}
