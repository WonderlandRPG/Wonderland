import { attributeKeys } from "@/lib/game/schemas";
import type { ClassPayload } from "@/lib/game/classes";

export function ClassPreview({ name, payload }: { name: string; payload: ClassPayload }) {
  return (
    <article className="race-preview class-preview">
      <div
        className={`race-preview__visual ${payload.imageUrl ? "has-image" : ""}`}
        style={payload.imageUrl ? { backgroundImage: `url("${payload.imageUrl}")` } : undefined}
      >
        <div className="race-preview__visual-grid" />
        <span className="race-preview__monogram">
          {name.trim().slice(0, 2).toUpperCase() || "CL"}
        </span>
        <span className="race-preview__difficulty">
          {"★".repeat(payload.difficulty)}
          <span>{"★".repeat(5 - payload.difficulty)}</span>
        </span>
      </div>
      <div className="race-preview__body">
        <span className="eyebrow">Classe de Wonderland</span>
        <h2>{name || "Classe sem nome"}</h2>
        <p className="race-preview__description">{payload.description || "Sem descrição."}</p>
        <div className="race-preview__vitals">
          <div>
            <span>Especialização</span>
            <strong>{payload.specialization}</strong>
          </div>
          <div>
            <span>Complexidade</span>
            <strong>{payload.complexity}</strong>
          </div>
          <div>
            <span>Caminhos</span>
            <strong>{payload.paths.length}</strong>
          </div>
        </div>
        <div className="race-preview__attributes" aria-label="Afinidades de atributos">
          {attributeKeys.map((attribute) => (
            <div key={attribute}>
              <span>{attribute}</span>
              <strong>{"★".repeat(payload.affinities[attribute])}</strong>
              <small>
                {payload.primaryAttributes.includes(attribute) ? "Central" : "Afinidade"}
              </small>
            </div>
          ))}
        </div>
        <PreviewGroup
          eyebrow="Mecânica exclusiva"
          items={[
            {
              meta: "Recurso de classe",
              title: payload.mechanic.name,
              description: payload.mechanic.description,
            },
          ]}
        />
        <PreviewGroup
          eyebrow="Passiva da classe"
          items={[
            {
              meta: "Passiva permanente",
              title: payload.passive.name,
              description: payload.passive.description,
            },
          ]}
        />
        <PreviewGroup
          eyebrow="Progressão da classe"
          items={[...payload.progression]
            .sort((left, right) => left.level - right.level)
            .map((skill) => ({
              meta: `Nível ${skill.level} · ${skill.category}`,
              title: skill.name,
              description: skill.effect,
            }))}
        />
        {payload.paths.map((path) => (
          <PreviewGroup
            eyebrow={`Caminho · ${path.name}`}
            items={[
              { meta: "Identidade", title: path.name, description: path.description },
              {
                meta: "Nova passiva",
                title: path.passive.name,
                description: path.passive.description,
              },
              ...path.skills.map((skill) => ({
                meta: skill.type,
                title: skill.name,
                description: skill.effect,
              })),
            ]}
            key={path.key}
          />
        ))}
      </div>
    </article>
  );
}

function PreviewGroup({
  eyebrow,
  items,
}: {
  eyebrow: string;
  items: Array<{ meta: string; title: string; description: string }>;
}) {
  return (
    <section className="race-preview__collection">
      <span>{eyebrow}</span>
      <div>
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`}>
            <small>{item.meta}</small>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
