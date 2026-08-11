import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { getCurrentAccount } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { getAdventureRank } from "@/lib/game/ranks";
import { ThemeControl } from "@/components/theme/theme-control";
import { getThemeAvailability } from "@/lib/content/themes";
import { isAdministrativeRole } from "@/lib/auth/roles";

import "./globals.css";
import "./theme-overrides.css";

export const metadata: Metadata = {
  title: {
    default: "Wonderland RPG",
    template: "%s — Wonderland RPG",
  },
  description:
    "Entre em Wonderland, crie seus personagens e viva batalhas, histórias e aventuras em um RPG online de fantasia.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccount();
  const activeCharacterId = account ? await getActiveCharacterId(account.id) : null;
  const activeCharacter = activeCharacterId ? await getCharacterSheet(activeCharacterId) : null;
  const [rank, themeAvailability] = await Promise.all([
    Promise.resolve(activeCharacter ? getAdventureRank(activeCharacter.adventure_rank) : null),
    getThemeAvailability(),
  ]);

  return (
    <html data-theme="classic" lang="pt-BR">
      <body
        data-rank={rank?.key}
        style={rank ? ({ "--hud-rank": rank.color } as React.CSSProperties) : undefined}
      >
        <div className="game-world-atmosphere" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <RankAtmosphere rank={rank?.key} />
        <AudioProvider>
          {children}
          <ThemeControl availability={themeAvailability} isAdmin={Boolean(account && isAdministrativeRole(account.role))} />
        </AudioProvider>
      </body>
    </html>
  );
}
