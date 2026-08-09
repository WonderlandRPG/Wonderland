import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string | null;
  backLabel?: string;
  children: React.ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  backHref = "/",
  backLabel = "Voltar para entrar",
  children,
}: AuthShellProps) {
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
            Sua conta será o ponto de entrada para personagens, conquistas, presença diária e todos
            os sistemas do Wonderland.
          </p>
        </div>

        <div className="auth-visual__security">
          <span className="signal-dot" />
          <div>
            <strong>Conexão protegida</strong>
            <small>Senha criptografada pelo Supabase Auth</small>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          {backHref ? (
            <Link className="auth-back-link" href={backHref}>
              <span aria-hidden="true">←</span>
              {backLabel}
            </Link>
          ) : null}
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
