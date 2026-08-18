export type MusicTrackDefinition = {
  label: string;
  source: string;
  fallback?: string;
};

const audioVersion = "20260817-4";

export const musicTracks = {
  tema: {
    label: "Tema de Wonderland",
    source: `/assets/music/tema.mp3?v=${audioVersion}`,
  },
  mapa: {
    label: "Mapa dos Reinos",
    source: `/assets/music/mapa.mp3?v=${audioVersion}`,
  },
  biblioteca: {
    label: "Biblioteca de Wonderland",
    source: `/assets/music/biblioteca.mp3?v=${audioVersion}`,
  },
  historia: {
    label: "Wonderland at Dawn",
    source: "https://cdn1.suno.ai/ac996da0-8f87-4750-ab49-916e09b71773.mp3",
    fallback: `/assets/music/tema.mp3?v=${audioVersion}`,
  },
  pvp: {
    label: "Arena de Wonderland",
    source: `/assets/music/pvp.mp3?v=${audioVersion}`,
  },
} satisfies Record<string, MusicTrackDefinition>;

export type MusicTrack = keyof typeof musicTracks;

export function musicTrackForPath(pathname: string): MusicTrack {
  if (pathname.startsWith("/arena")) return "pvp";
  if (pathname.startsWith("/historia")) return "historia";
  if (pathname.startsWith("/mapas") || pathname.startsWith("/reinos")) return "mapa";
  if (pathname.startsWith("/loja")) return "biblioteca";
  return "tema";
}
