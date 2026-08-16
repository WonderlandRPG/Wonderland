import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";
import { getCurrentAccount } from "@/lib/auth/account";
import { PlayerPresence } from "@/components/player-presence";

/*
 * Ordem de estilos do Wonderland:
 * 1. fundos e correções históricas que ainda cobrem componentes reais;
 * 2. camada canônica atual;
 * 3. reparo final, carregado por último para impedir novas regressões.
 */
import "./wonderland-backgrounds.css";
import "./wonderland-fixes.css";
import "./wonderland-hotfix.css";
import "./wonderland-ui.css";
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
