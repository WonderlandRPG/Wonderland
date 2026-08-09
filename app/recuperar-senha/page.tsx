import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = { title: "Recuperar senha" };

const statusMessages: Record<string, string> = {
  "link-invalido": "Este link expirou ou já foi utilizado. Solicite uma nova recuperação abaixo.",
};

export default async function RecoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  return (
    <AuthShell
      eyebrow="Recuperação de acesso"
      title="Vamos recuperar sua conta."
      description="Informe o e-mail cadastrado e enviaremos um link seguro para criar uma nova senha."
    >
      {status && statusMessages[status] ? (
        <div
          className="auth-status-banner auth-status-banner--error"
          data-sfx-on-mount="error"
          role="alert"
        >
          {statusMessages[status]}
        </div>
      ) : null}
      <RecoveryForm />
    </AuthShell>
  );
}
