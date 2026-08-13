import type { UpdateBlock } from "@/lib/game/update-content";

export function UpdateBlocks({ blocks }: { blocks: UpdateBlock[] }) {
  return (
    <div className="update-blocks">
      {blocks.map((block) => {
        if (block.type === "image")
          return (
            <figure className="update-image" key={block.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={block.label || "Imagem da atualização"} src={block.content} />
              {block.label ? <figcaption>{block.label}</figcaption> : null}
            </figure>
          );
        if (block.type === "heading") return <h3 key={block.id}>{block.content}</h3>;
        if (block.type === "subheading") return <h4 key={block.id}>{block.content}</h4>;
        if (block.type === "highlight")
          return <blockquote key={block.id}>{block.content}</blockquote>;
        if (block.type === "stat")
          return (
            <div className="update-stat" key={block.id}>
              <small>{block.label || "Destaque"}</small>
              <strong>{block.content}</strong>
            </div>
          );
        if (block.type === "list")
          return (
            <ul key={block.id}>
              {block.content
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, index) => (
                  <li key={`${block.id}-${index}`}>{line}</li>
                ))}
            </ul>
          );
        return <p key={block.id}>{block.content}</p>;
      })}
    </div>
  );
}
