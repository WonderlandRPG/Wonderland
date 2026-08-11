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

        <div className="auth-visual__content" aria-hidden="true" />
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
