import { PortalShell } from "@/components/portal-shell";
import { requireActiveCharacter } from "@/lib/content/active-character";

export const metadata = { title: "Mapas" };

export default async function MapsPage() {
  await requireActiveCharacter("/mapas");
  return (
    <PortalShell
      eyebrow="Campo estratégico"
      title="Mapa de Wonderland"
      description="Três rotas conectam os reinos, com rios, selvas, torres e objetivos que transformam cada confronto."
    >
      <section className="world-battle-map" aria-label="Mapa estratégico de Wonderland">
        <div className="map-river" />
        <div className="map-lane map-lane--top" />
        <div className="map-lane map-lane--mid" />
        <div className="map-lane map-lane--bottom" />
        <div className="map-base map-base--dawn">
          <b>☀</b>
          <span>Bastião da Alvorada</span>
        </div>
        <div className="map-base map-base--dusk">
          <b>☾</b>
          <span>Fortaleza do Crepúsculo</span>
        </div>
        <div className="map-objective map-objective--north">
          <b>🐉</b>
          <span>Dragão Primordial</span>
        </div>
        <div className="map-objective map-objective--south">
          <b>👁️</b>
          <span>Guardião do Abismo</span>
        </div>
        <div className="map-kingdom map-kingdom--forest">
          <b>🌲</b>
          <span>Aokigahara</span>
        </div>
        <div className="map-kingdom map-kingdom--ice">
          <b>❄️</b>
          <span>Oymyakon</span>
        </div>
        <div className="map-kingdom map-kingdom--sand">
          <b>☀️</b>
          <span>Lesedi</span>
        </div>
        <div className="map-kingdom map-kingdom--sea">
          <b>🌊</b>
          <span>Namida</span>
        </div>
        <div className="map-kingdom map-kingdom--sky">
          <b>☁️</b>
          <span>Skypiece</span>
        </div>
        {Array.from({ length: 10 }, (_, index) => (
          <i className={`map-camp map-camp--${index + 1}`} key={index} />
        ))}
      </section>
      <div className="map-legend">
        <span>
          <i className="is-lane" /> Rotas
        </span>
        <span>
          <i className="is-river" /> Rio
        </span>
        <span>
          <i className="is-camp" /> Acampamentos
        </span>
        <span>
          <i className="is-objective" /> Objetivos
        </span>
      </div>
    </PortalShell>
  );
}
