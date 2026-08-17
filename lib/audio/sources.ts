export type MusicTrackDefinition = {
  label: string;
  source: string;
  fallback?: string;
  mimeType?: string;
  parts?: readonly string[];
};

const historyTrackParts = [
  "/assets/music/history/part-00.b64",
  "/assets/music/history/part-01.b64",
  "/assets/music/history/part-02.b64",
  "/assets/music/history/part-03.b64",
  "/assets/music/history/part-04.b64",
  "/assets/music/history/part-05.b64",
  "/assets/music/history/part-06.b64",
  "/assets/music/history/part-07.b64",
  "/assets/music/history/part-08.b64",
  "/assets/music/history/part-09.b64",
  "/assets/music/history/part-10.b64",
  "/assets/music/history/part-11.b64",
] as const;

export const musicTracks = {
  tema: { label: "Tema de Wonderland", source: "/assets/music/tema.mp3" },
  mapa: { label: "Mapa dos Reinos", source: "/assets/music/mapa.mp3" },
  biblioteca: { label: "Biblioteca Real", source: "/assets/music/biblioteca.mp3" },
  historia: {
    label: "Wonderland at Dawn",
    source: "",
    fallback: "/assets/music/biblioteca.mp3",
    mimeType: "audio/mp4",
    parts: historyTrackParts,
  },
  pvp: { label: "Arena de Wonderland", source: "/assets/music/pvp.mp3?v=20260813-2" },
} satisfies Record<string, MusicTrackDefinition>;

export type MusicTrack = keyof typeof musicTracks;

export function musicTrackForPath(pathname: string): MusicTrack {
  if (pathname.startsWith("/arena")) return "pvp";
  if (pathname.startsWith("/historia")) return "historia";
  if (pathname.startsWith("/mapas")) return "mapa";
  if (
    pathname.startsWith("/ranking") ||
    pathname.startsWith("/ranks") ||
    pathname.startsWith("/eventos") ||
    pathname.startsWith("/atualizacoes") ||
    pathname.startsWith("/loja")
  ) {
    return "biblioteca";
  }
  return "tema";
}
