import Link from "next/link";
import { getClassCatalog } from "@/lib/content/classes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gerenciar Classes" };
export default async function ClassesAdminPage() {
  const classes = await getClassCatalog();
  return (
    <div className="admin-content race-catalog-page">
      <section className="race-catalog-hero">
        <div>
          <span className="eyebrow">Conteúdo do jogo // contrato da Arena</span>
          <h1>Classes</h1>
          <p>
            Edite recursos, progressão, caminhos, passivas e operações de combate sem alterar
            código.
          </p>
        </div>
        <Link className="button button--primary" href="/admin/classes/nova">
          Criar nova classe ＋
        </Link>
      </section>
      <section className="race-catalog-stats">
        <div>
          <span>Total</span>
          <strong>{classes.length}</strong>
        </div>
        <div>
          <span>Publicadas</span>
          <strong>{classes.filter((item) => item.status === "published").length}</strong>
        </div>
        <div>
          <span>Rascunhos</span>
          <strong>{classes.filter((item) => item.status === "draft").length}</strong>
        </div>
        <div>
          <span>Habilidades</span>
          <strong>
            {classes.reduce(
              (sum, item) =>
                sum +
                item.payload.progression.length +
                item.payload.paths.reduce((pathSum, path) => pathSum + path.skills.length, 0),
              0,
            )}
          </strong>
        </div>
      </section>
      <section className="class-admin-grid">
        {classes.map((item) => (
          <article className="class-admin-card" key={item.id}>
            <div>
              <span>{"★".repeat(item.payload.difficulty)}</span>
              <span className={`content-status content-status--${item.status}`}>
                {item.status === "published" ? "Publicada" : "Rascunho"}
              </span>
            </div>
            <h2>{item.name}</h2>
            <p>{item.payload.specialization}</p>
            <dl>
              <div>
                <dt>Recurso</dt>
                <dd>{item.payload.resource.name}</dd>
              </div>
              <div>
                <dt>Habilidades</dt>
                <dd>{item.payload.progression.length}</dd>
              </div>
              <div>
                <dt>Caminhos</dt>
                <dd>{item.payload.paths.length}</dd>
              </div>
              <div>
                <dt>Revisão</dt>
                <dd>{item.revision}</dd>
              </div>
            </dl>
            <Link className="button button--primary" href={`/admin/classes/${item.id}`}>
              Editar classe
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
