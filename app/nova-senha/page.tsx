import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { NewPasswordForm } from "@/components/auth/new-password-form";

export const metadata: Metadata = { title: "Criar nova senha" };

export default function NewPasswordPage() {
  return (
    <AuthShell
      eyebrow="Nova credencial"
      title="Proteja seu acesso."
      description="Escolha uma nova senha para continuar explorando o Wonderland."
    >
      <NewPasswordForm />
    </AuthShell>
  );
}
