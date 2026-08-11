import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { RankAtmosphere } from "@/components/characters/rank-atmosphere";
import { getCurrentAccount } from "@/lib/auth/account";
import { getActiveCharacterId } from "@/lib/content/active-character";
import { getCharacterSheet } from "@/lib/content/characters";
import { getAdventureRank } from "@/lib/game/ranks";
import { ThemeControl } from "@/components/theme/theme-control";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wonderland RPG",
    template: "%s — Wonderland RPG",
  },
  description:
    "Entre em Wonderland, crie seus personagens e viva batalhas, histórias e aventuras em um RPG online de fantasia.",
};

export const dynamic = "force-dynamic";

const themeBootScript = `(()=>{try{const t=localStorage.getItem("wonderland:theme");document.documentElement.dataset.theme=t==="accessible"?"accessible":"classic"}catch{document.documentElement.dataset.theme="classic"}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const account = await getCurrentAccount();
  const activeCharacterId = account ? await getActiveCharacterId(account.id) : null;
  const activeCharacter = activeCharacterId ? await getCharacterSheet(activeCharacterId) : null;
  const rank = activeCharacter ? getAdventureRank(activeCharacter.adventure_rank) : null;

  return (
    <html data-theme="classic" lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
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
          <ThemeControl />
        </AudioProvider>
      </body>
    </html>
  );
}
