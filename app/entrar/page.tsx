import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAccount } from "@/lib/auth/account";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

export const metadata: Metadata = { title: "Entrar" };

export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  "sessao-encerrada": "Sua sessão foi encerrada com segurança.",
  "link-invalido": "Este link expirou ou já foi utilizado. Entre com sua senha ou solicite outro.",
  "configuracao-indisponivel": "A conexão de contas está temporariamente indisponível.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; status?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeRedirectPath(params.next);
  const account = await getCurrentAccount();

  if (account) redirect(nextPath);

  return (
    <AuthShell
      eyebrow="Acesso à conta"
      title="Volte para Wonderland."
      description="Entre, escolha seu personagem e retome exatamente de onde sua jornada parou."
    >
      {params.status && statusMessages[params.status] ? (
        <div className="auth-status-banner" role="status">
          {statusMessages[params.status]}
        </div>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}
