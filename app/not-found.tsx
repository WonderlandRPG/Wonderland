import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span className="eyebrow">Erro 404 // Fratura detectada</span>
      <h1>Esta região ainda não existe.</h1>
      <p>A rota procurada não faz parte da nova fundação do Wonderland.</p>
      <Link className="button button--primary" href="/">
        Voltar ao portal
      </Link>
    </main>
  );
}
