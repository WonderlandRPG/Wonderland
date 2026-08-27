export default function Loading() {
  return (
    <main className="route-loading" role="status" aria-live="polite" aria-label="Carregando página">
      <section className="route-loading__gate">
        <div className="route-loading__crest" aria-hidden="true"><span>W</span></div>
        <small>ATRAVESSANDO O PORTAL</small>
        <strong>Carregando Wonderland</strong>
        <p>Preparando pergaminhos, personagens e caminhos da sua jornada.</p>
        <div className="route-loading__progress" aria-hidden="true"><i /></div>
      </section>
    </main>
  );
}
