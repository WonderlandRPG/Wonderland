"use client";

import { useEffect, useMemo, useRef } from "react";

type FeedbackKind = "damage" | "heal" | "shield" | "control" | "buff" | "neutral";

function classify(message: string): FeedbackKind {
  const text = message.toLocaleLowerCase("pt-BR");
  if (/paralis|atordo|stun|sil[eê]n|enraiz|medo|provoc/.test(text)) return "control";
  if (/cura|curou|recuperou|regener/.test(text)) return "heal";
  if (/escudo|barreira|guarda/.test(text)) return "shield";
  if (/buff|aument|fortale|b[oô]nus/.test(text)) return "buff";
  if (/dano|causou|atingiu|golpe|sangramento|queimadura|veneno/.test(text)) return "damage";
  return "neutral";
}

function amountFrom(message: string) {
  const match = message.match(
    /(?:causou|recuperou|curou|escudo(?: de)?|barreira(?: de)?)\s+(\d[\d.]*)/i,
  );
  return match?.[1] ?? "";
}

function playCue(kind: FeedbackKind) {
  if (kind === "neutral" || typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const settings = {
    damage: [150, "sawtooth"],
    heal: [620, "sine"],
    shield: [360, "triangle"],
    control: [95, "square"],
    buff: [480, "sine"],
  } as const;
  const [frequency, wave] = settings[kind];
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    kind === "damage" || kind === "control" ? frequency / 2 : frequency * 1.35,
    context.currentTime + 0.16,
  );
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.075, context.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.2);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.21);
  oscillator.addEventListener("ended", () => void context.close());
}

export function CombatFeedbackLayer({
  message,
  iconUrls = [],
}: {
  message: string;
  iconUrls?: Array<string | null | undefined>;
}) {
  const mounted = useRef(false);
  const kind = useMemo(() => classify(message), [message]);
  const amount = useMemo(() => amountFrom(message), [message]);
  const iconKey = iconUrls.filter((url): url is string => Boolean(url)).join("|");
  useEffect(() => {
    [...new Set(iconKey.split("|").filter(Boolean))].forEach((url) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = url;
    });
  }, [iconKey]);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    playCue(kind);
  }, [kind, message]);
  if (kind === "neutral") return null;
  const labels: Record<FeedbackKind, string> = {
    damage: amount ? `−${amount}` : "IMPACTO",
    heal: amount ? `+${amount}` : "CURA",
    shield: amount ? `+${amount}` : "ESCUDO",
    control: "CONTROLE",
    buff: "FORTALECIDO",
    neutral: "",
  };
  return (
    <div className={`combat-feedback combat-feedback--${kind}`} key={message} aria-live="polite">
      <strong>{labels[kind]}</strong>
      <span>{kind === "control" ? "✦" : kind === "shield" ? "◇" : "◆"}</span>
    </div>
  );
}
