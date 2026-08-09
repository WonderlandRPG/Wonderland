import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentAccount } from "@/lib/auth/account";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

const statusMessages: Record<string, string> = {
  "sessao-encerrada": "Sua sessão foi encerrada com segurança.",
  "link-invalido": "Este link expirou ou já foi utilizado. Entre com sua senha ou solicite outro.",
  "configuracao-indisponivel": "A conexão de contas está temporariamente indisponível.",
};

interface LoginScreenProps {
  next?: string;
  status?: string;
}

export async function LoginScreen({ next, status }: LoginScreenProps) {
  const nextPath = getSafeRedirectPath(next);
  const account = await getCurrentAccount();

  if (account) redirect(nextPath);

  return (
    <AuthShell
      backHref={null}
      eyebrow="Acesso à conta"
      title="Bem-vindo de volta."
      description="Entre para acessar seu perfil, personagens, inventário e a Arena de Wonderland."
    >
      {status && statusMessages[status] ? (
        <div className="auth-status-banner" data-sfx-on-mount="confirm" role="status">
          {statusMessages[status]}
        </div>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}
