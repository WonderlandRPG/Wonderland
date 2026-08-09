import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { getCurrentAccount } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { getAdventureRank } from "@/lib/game/ranks";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wonderland RPG",
    template: "%s — Wonderland RPG",
  },
  description:
    "Wonderland é um RPG online em reconstrução, com regras unificadas e conteúdo administrável.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccount();
  const activeCharacterId = account ? await getActiveCharacterId(account.id) : null;
  const activeCharacter = activeCharacterId ? await getCharacterSheet(activeCharacterId) : null;
  const rank = activeCharacter ? getAdventureRank(activeCharacter.adventure_rank) : null;

  return (
    <html lang="pt-BR">
      <body
        data-rank={rank?.key}
        style={rank ? ({ "--hud-rank": rank.color } as React.CSSProperties) : undefined}
      >
        <RankAtmosphere rank={rank?.key} />
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
