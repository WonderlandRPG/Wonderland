import Link from "next/link";

import { SignOutButton } from "@/components/account/sign-out-button";
import { BrandMark } from "@/components/brand-mark";
import { getAccountNavigation } from "@/lib/auth/access";
import type { CurrentAccount } from "@/lib/auth/roles";

export function AccountHeader({ account }: { account: CurrentAccount }) {
  const navigation = getAccountNavigation(account.role);

  return (
    <header className="account-header">
      <BrandMark inverse />
      <nav aria-label="Áreas da conta">
        {navigation.map((area) => (
          <Link href={area.href} key={area.key}>
            {area.shortLabel}
          </Link>
        ))}
        <SignOutButton compact />
      </nav>
    </header>
  );
}
