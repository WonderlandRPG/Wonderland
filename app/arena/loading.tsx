export default function ArenaLoading() {
  return (
    <main className="arena-page">
      <div className="page-container arena-page__inner">
        <section className="arena-load-state" role="status" aria-live="polite">
          <span className="arena-load-state__sigil">⚔</span>
          <small>PREPARANDO COMBATE</small>
          <h1>Abrindo a Arena…</h1>
          <p>Carregando ficha, habilidades e estado da batalha. Não feche esta página.</p>
          <div className="arena-load-state__bar"><i /></div>
        </section>
      </div>
    </main>
  );
}
