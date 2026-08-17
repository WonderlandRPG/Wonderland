export type MusicTrackDefinition = {
  label: string;
  source: string;
  fallback?: string;
};

export const musicTracks = {
  tema: { label: "Tema de Wonderland", source: "/assets/music/tema.mp3" },
  mapa: { label: "Mapa dos Reinos", source: "/assets/music/mapa.mp3" },
  biblioteca: { label: "Biblioteca Real", source: "/assets/music/biblioteca.mp3" },
  historia: {
    label: "Wonderland at Dawn",
    source: "https://cdn1.suno.ai/ac996da0-8f87-4750-ab49-916e09b71773.mp3",
    fallback: "/assets/music/biblioteca.mp3",
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
