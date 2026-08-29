import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { getCurrentAccount } from "@/lib/auth/account";
import { PlayerPresence } from "@/components/player-presence";
import { getActiveCharacterCosmetics } from "@/lib/content/active-character";

/*
 * Sistema visual do Wonderland:
 * 1. uma única base global, responsável por navegação, superfícies e controles;
 * 2. a camada de reparo cobre os componentes específicos já existentes;
 * 3. rank-visuals é isolado nos emblemas, retratos e efeitos de Rank.
 * CSS Modules continuam isolados em seus próprios componentes.
 */
import "./theme-tokens.css";
import "./themes/catedral-ultimo-eclipse.css";
import "./visual-contract.css";
import "./wonderland-base.css";
import "./wonderland-repair.css";
import "./rank-visuals.css";
import "./wonderland-medieval.css";
import "./presence-experience.css";
import "./event-period.css";
import "./ranking-experience.css";
import "./site-experience.css";
import "./contrast-guard.css";
import "./experience-polish.css";
import "./requested-visual-overhaul.css";
import "./theme-legacy-bridge.css";

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
  const cosmetics = account ? await getActiveCharacterCosmetics(account.id) : null;
  const theme =
    cosmetics?.theme === "catedral-ultimo-eclipse" ? "catedral-ultimo-eclipse" : undefined;

  return (
    <html data-wl-theme={theme} lang="pt-BR">
      <body data-wl-theme={theme}>
        {account ? <PlayerPresence /> : null}
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
