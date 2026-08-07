import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getCurrentAccount } from "@/lib/auth/account";

export const metadata: Metadata = { title: "Criar conta" };

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const account = await getCurrentAccount();

  if (account) redirect("/perfil");

  return (
    <AuthShell
      eyebrow="Novo aventureiro"
      title="Crie sua conta."
      description="Este será o seu acesso permanente ao universo do Wonderland."
    >
      <SignUpForm />
    </AuthShell>
  );
}
