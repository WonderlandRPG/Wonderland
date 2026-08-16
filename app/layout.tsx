import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { getCurrentAccount } from "@/lib/auth/account";
import { ThemeControl } from "@/components/theme/theme-control";
import { getThemeConfiguration } from "@/lib/content/themes";
import { isAdministrativeRole } from "@/lib/auth/roles";
import { PlayerPresence } from "@/components/player-presence";

import "./globals.css";
import "./fantasy-theme.css";
import "./immersive-rpg.css";
import "./immersive-cleanup.css";

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
  const [account, themeConfiguration] = await Promise.all([
    getCurrentAccount(),
    getThemeConfiguration(),
  ]);
  return (
    <html data-theme={themeConfiguration.defaultTheme} lang="pt-BR">
      <body>
        {account ? <PlayerPresence /> : null}
        <div className="game-world-atmosphere" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <AudioProvider>
          {children}
          <ThemeControl
            availability={themeConfiguration.availability}
            defaultTheme={themeConfiguration.defaultTheme}
            isAdmin={Boolean(account && isAdministrativeRole(account.role))}
          />
        </AudioProvider>
      </body>
    </html>
  );
}
