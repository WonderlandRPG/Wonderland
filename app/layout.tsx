import type { Metadata } from "next";
import { AudioProvider } from "@/components/audio/audio-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wonderland RPG",
    template: "%s — Wonderland RPG",
  },
  description:
    "Wonderland é um RPG online em reconstrução, com regras unificadas e conteúdo administrável.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
