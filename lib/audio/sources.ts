export const musicTracks = {
  tema: { label: "Tema de Wonderland", source: "/assets/music/tema.mp3" },
  mapa: { label: "Mapa dos Reinos", source: "/assets/music/mapa.mp3" },
  biblioteca: { label: "Biblioteca Real", source: "/assets/music/biblioteca.mp3" },
  pvp: { label: "Arena de Wonderland", source: "/assets/music/pvp.mp3?v=20260813-2" },
} as const;

export type MusicTrack = keyof typeof musicTracks;

export function musicTrackForPath(pathname: string): MusicTrack {
  if (pathname.startsWith("/arena")) return "pvp";
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
