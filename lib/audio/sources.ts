export type SoundEffect = "open" | "click" | "confirm" | "error" | "close";

export const themeSource = "/assets/music/tema.mp3";

export const effectSources: Record<SoundEffect, string> = {
  open: "/assets/effects/open.mp3",
  click: "/assets/effects/click.mp3",
  confirm: "/assets/effects/confirm.mp3",
  error: "/assets/effects/error.mp3",
  close: "/assets/effects/close.mp3",
};
