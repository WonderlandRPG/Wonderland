import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-visual__backdrop" />
        <div className="auth-visual__grid" />
        <div className="auth-visual__brand">
          <BrandMark inverse />
        </div>

        <div className="auth-visual__content">
          <span className="eyebrow">Portal dos jogadores</span>
          <h2>Todo aventureiro começa com uma identidade.</h2>
          <p>
            Sua conta será o ponto de entrada para personagens, presença diária e todos os sistemas
            do Wonderland.
          </p>
        </div>

        <div className="auth-visual__security">
          <span className="signal-dot" />
          <div>
            <strong>Conexão protegida</strong>
            <small>Acesso seguro à sua conta</small>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <Link className="auth-back-link" href="/">
            <span aria-hidden="true">←</span>
            Voltar ao portal
          </Link>
          <header className="auth-heading">
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
