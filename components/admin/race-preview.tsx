import { attributeKeys } from "@/lib/game/schemas";
import { attributeLabels, getRaceBonusTotal, type RacePayload } from "@/lib/game/races";

export function RacePreview({
  name,
  payload,
  compact = false,
}: {
  name: string;
  payload: RacePayload;
  compact?: boolean;
}) {
  const bonusTotal = getRaceBonusTotal(payload.attributeBonuses);

  return (
    <article className={`race-preview ${compact ? "race-preview--compact" : ""}`}>
      <div
        className={`race-preview__visual ${payload.imageUrl ? "has-image" : ""}`}
        style={payload.imageUrl ? { backgroundImage: `url("${payload.imageUrl}")` } : undefined}
      >
        <div className="race-preview__visual-grid" />
        <span className="race-preview__monogram" aria-hidden="true">
          {name.trim().slice(0, 2).toUpperCase() || "RA"}
        </span>
        <span className="race-preview__difficulty" aria-label={`${payload.difficulty} estrelas`}>
          {"★".repeat(payload.difficulty)}
          <span>{"★".repeat(5 - payload.difficulty)}</span>
        </span>
      </div>

      <div className="race-preview__body">
        <span className="eyebrow">Raça de Wonderland</span>
        <h2>{name.trim() || "Raça sem nome"}</h2>
        <p className="race-preview__description">
          {payload.description.trim() || "A descrição da raça aparecerá aqui."}
        </p>

        <div className="race-preview__vitals">
          <div>
            <span>HP inicial</span>
            <strong>{payload.baseHp}</strong>
          </div>
          <div>
            <span>Mana inicial</span>
            <strong>{payload.baseMana}</strong>
          </div>
          <div>
            <span>Bônus racial</span>
            <strong>{bonusTotal}/25</strong>
          </div>
        </div>

        <div className="race-preview__attributes" aria-label="Bônus de atributos">
          {attributeKeys.map((attribute) => (
            <div key={attribute}>
              <span>{attribute}</span>
              <strong>+{payload.attributeBonuses[attribute]}</strong>
              <small>{attributeLabels[attribute]}</small>
            </div>
          ))}
        </div>

        {!compact ? (
          <>
            <PreviewCollection
              empty="Nenhuma mecânica racial cadastrada."
              eyebrow="Mecânica racial"
              items={payload.mechanics.map((mechanic) => ({
                meta: "Sistema exclusivo",
                title: mechanic.name,
                description: mechanic.description,
              }))}
            />
            <PreviewCollection
              empty="Nenhuma passiva cadastrada."
              eyebrow="Traços raciais"
              items={payload.traits.map((trait) => ({
                meta: "Passiva",
                title: trait.name,
                description: trait.description,
              }))}
            />
            <PreviewCollection
              empty="Nenhuma habilidade de progressão cadastrada."
              eyebrow="Progressão racial"
              items={[...payload.progression]
                .sort((left, right) => left.level - right.level)
                .map((entry) => ({
                  meta: `Nível ${entry.level}`,
                  title: entry.title,
                  description: entry.description,
                }))}
            />
          </>
        ) : null}
      </div>
    </article>
  );
}

function PreviewCollection({
  eyebrow,
  empty,
  items,
}: {
  eyebrow: string;
  empty: string;
  items: Array<{ meta: string; title: string; description: string }>;
}) {
  return (
    <section className="race-preview__collection">
      <span>{eyebrow}</span>
      {items.length > 0 ? (
        <div>
          {items.map((item, index) => (
            <article key={`${item.title}-${index}`}>
              <small>{item.meta}</small>
              <h3>{item.title || "Sem título"}</h3>
              <p>{item.description || "Sem descrição."}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="race-preview__empty">{empty}</p>
      )}
    </section>
  );
}
