import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { getCurrentAccount } from "@/lib/auth/account";
import { PlayerPresence } from "@/components/player-presence";

/*
 * Sistema visual do Wonderland:
 * 1. base global para navegação, superfícies e controles;
 * 2. reparo estrutural dos componentes específicos;
 * 3. cenários ilustrados isolados em uma folha que só controla atmosfera/fundo;
 * 4. acabamento pontual das áreas que antes dependiam das folhas antigas.
 * CSS Modules continuam isolados em seus próprios componentes.
 */
import "./wonderland-base.css";
import "./wonderland-repair.css";
import "./wonderland-art.css";
import "./wonderland-polish.css";

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

  return (
    <html lang="pt-BR">
      <body>
        {account ? <PlayerPresence /> : null}
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
