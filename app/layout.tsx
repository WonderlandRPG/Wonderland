import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { getCurrentAccount } from "@/lib/auth/account";
import { PlayerPresence } from "@/components/player-presence";

/*
 * Sistema visual do Wonderland:
 * 1. uma única base global, responsável por navegação, superfícies e controles;
 * 2. a camada de reparo cobre os componentes específicos já existentes.
 * CSS Modules continuam isolados em seus próprios componentes.
 */
import "./wonderland-base.css";
import "./wonderland-repair.css";

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
