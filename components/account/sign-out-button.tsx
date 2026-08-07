import { signOutAction } from "@/app/auth/actions";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction}>
      <button className={compact ? "sign-out-button is-compact" : "sign-out-button"} type="submit">
        Sair da conta
      </button>
    </form>
  );
}
