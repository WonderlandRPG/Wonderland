"use client";

import { useEffect, useRef, useState } from "react";

export function LoreRichEditor({ initial = "" }: { initial?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initial) {
      editorRef.current.innerHTML = initial;
    }
  }, [initial]);

  const sync = () => setValue(editorRef.current?.innerHTML ?? "");
  const command = (name: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    sync();
  };
  const createLink = () => {
    const url = window.prompt("Cole o endereço do link:", "https://");
    if (!url || !/^https?:\/\//i.test(url)) return;
    command("createLink", url);
  };

  return (
    <div className="lore-rich-editor">
      <input name="bodyHtml" type="hidden" value={value} readOnly />
      <div className="lore-rich-editor__toolbar" role="toolbar" aria-label="Ferramentas de edição">
        <button type="button" onClick={() => command("undo")} title="Desfazer">↶</button>
        <button type="button" onClick={() => command("redo")} title="Refazer">↷</button>
        <span />
        <button type="button" onClick={() => command("formatBlock", "h2")} title="Título grande">H2</button>
        <button type="button" onClick={() => command("formatBlock", "h3")} title="Subtítulo">H3</button>
        <button type="button" onClick={() => command("formatBlock", "p")} title="Parágrafo">¶</button>
        <span />
        <button type="button" onClick={() => command("bold")} title="Negrito"><b>B</b></button>
        <button type="button" onClick={() => command("italic")} title="Itálico"><i>I</i></button>
        <button type="button" onClick={() => command("underline")} title="Sublinhado"><u>U</u></button>
        <button type="button" onClick={() => command("strikeThrough")} title="Tachado"><s>S</s></button>
        <span />
        <button type="button" onClick={() => command("insertUnorderedList")} title="Lista com marcadores">• Lista</button>
        <button type="button" onClick={() => command("insertOrderedList")} title="Lista numerada">1. Lista</button>
        <button type="button" onClick={() => command("formatBlock", "blockquote")} title="Citação">❝</button>
        <span />
        <button type="button" onClick={() => command("justifyLeft")} title="Alinhar à esquerda">≡</button>
        <button type="button" onClick={() => command("justifyCenter")} title="Centralizar">≣</button>
        <button type="button" onClick={() => command("justifyRight")} title="Alinhar à direita">≡◂</button>
        <button type="button" onClick={createLink} title="Inserir link">🔗</button>
        <button type="button" onClick={() => command("removeFormat")} title="Limpar formatação">Tx</button>
      </div>
      <div
        className="lore-rich-editor__paper"
        contentEditable
        onInput={sync}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        data-placeholder="Comece a escrever o conto de Wonderland..."
        suppressContentEditableWarning
      />
      <footer>
        <span>Editor de crônicas</span>
        <small>Use títulos, negrito, listas, citações, alinhamento e links como em um documento.</small>
      </footer>
    </div>
  );
}
