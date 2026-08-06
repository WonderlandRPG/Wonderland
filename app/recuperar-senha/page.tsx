import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RecoveryForm } from "@/components/auth/recovery-form";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <AuthShell
      eyebrow="Recuperação de acesso"
      title="Vamos recuperar sua conta."
      description="Informe o e-mail cadastrado e enviaremos um link seguro para criar uma nova senha."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
