"use client";

import { useId } from "react";

type ItemArtworkProps = {
  name: string;
  rarity: string;
  slot: string;
  className?: string;
};

const rarityLight: Record<string, string> = {
  common: "#d7e0e5",
  uncommon: "#92f0ad",
  rare: "#91c9ff",
  epic: "#d9a6ff",
  legendary: "#ffd477",
  mythic: "#ff8b8b",
  awakened: "#8fffea",
};

function hashName(name: string) {
  return [...name].reduce((value, character) => (value * 31 + character.charCodeAt(0)) >>> 0, 7);
}

function Weapon({ name, variant }: { name: string; variant: number }) {
  const value = name.toLocaleLowerCase("pt-BR");
  if (value.includes("arco")) return <><path d="M19 8C9 13 7 34 16 52"/><path d="M19 8c17 7 24 27 5 45M19 8l5 45"/><path d="m22 28 28-15-18 25"/><path d="m46 14 5-2-3 5"/></>;
  if (value.includes("cajado") || value.includes("báculo")) return <><path d="M25 57 38 18"/><path d="M38 18c-9-4-6-14 3-12 10 2 10 16 1 20"/><path d="m41 8 5 8-8 6-6-7Z"/><circle cx="41" cy="15" r="5"/><path d="m22 48 8 3M27 38l8 3"/></>;
  if (value.includes("machado")) return <><path d="m20 57 24-42"/><path d="M37 11c10-4 18 0 21 8-8 1-12 6-16 13l-13-8c5-4 7-8 8-13Z"/><path d="m26 45 9 5M32 35l9 5"/></>;
  if (value.includes("lança")) return <><path d="M16 57 47 17"/><path d="m47 17 1-12 10 7-11 5Z"/><path d="m20 47 7 6M26 39l7 6"/><path d="m43 22 6 5"/></>;
  if (value.includes("espada") || value.includes("montante")) return <><path d="m13 55 9-12 25-35 9-2-2 9-29 31Z"/><path d="m22 43 8 8M18 39l15 15M13 55l-4 3 7-1"/><path d="M47 8 54 15"/><path d="m27 39 18-26"/></>;
  return <><path d={variant % 2 ? "m10 52 11-15L44 8l12-2-4 12-27 24Z" : "m12 54 9-17L46 7l11-1-3 12-28 24Z"}/><path d="m21 37 7 7M17 34l14 14"/><path d="m12 54-4 3 7-1M47 9l7 8"/><path d={variant % 3 ? "M27 36 47 11" : "m28 36 17-23"}/></>;
}

function Armor({ slot, variant }: { slot: string; variant: number }) {
  if (slot === "head") return <><path d="M13 49V30C13 15 21 7 32 7s19 8 19 23v19"/><path d="M8 49h48M19 49V33h26v16M17 28h30"/><path d={variant % 2 ? "m25 8 7-6 7 6" : "M32 7V1"}/><path d="m24 34 8 7 8-7"/></>;
  if (slot === "torso") return <><path d="m21 8-12 9 7 14 6-4v30h20V27l6 4 7-14-12-9"/><path d="M24 8c1 7 15 7 16 0M22 27h20M32 15v42"/><path d={variant % 2 ? "m25 31 7 7 7-7" : "m24 33 8-5 8 5"}/></>;
  if (slot === "hands") return <><path d="M8 53 5 34l5-20 8 2 3 17-4 20Z"/><path d="m46 53 4-20 4-17-8-2-7 19 2 20Z"/><path d="m9 27 10 2M42 29l10-2M8 39l11 2M41 41l11-2"/></>;
  if (slot === "legs") return <><path d="M20 7h24l4 23-7 28H30l2-26-3 26H18l-4-28Z"/><path d="M16 23h31M32 8v24"/><path d="m20 30 9 5M44 30l-10 5"/></>;
  if (slot === "feet") return <><path d="M9 7v32L3 50v7h25V46l-7-7V7ZM43 7v32l-7 7v11h25v-7l-6-11V7Z"/><path d="M9 31h12M43 31h12M4 50h23M37 50h23"/></>;
  if (slot === "cape") return <><path d="M20 7h24l11 52-23-13L9 59Z"/><path d="M22 7c1 9 19 9 20 0M32 15v31"/><path d={variant % 2 ? "m17 47 15-10 15 10" : "M15 50c12-13 22-13 34 0"}/></>;
  return null;
}

function Accessory({ slot, variant }: { slot: string; variant: number }) {
  if (slot.startsWith("ring")) return <><ellipse cx="32" cy="39" rx="17" ry="19"/><path d="m22 20 10-15 10 15-10 9Z"/><path d="m27 15 5-8 5 8-5 6Z"/><path d="M17 37h30"/></>;
  if (slot.startsWith("earring")) return <><path d="M42 11c-15-12-30 5-18 17v10"/><path d="m24 37 11 12-11 12-11-12Z"/><path d={variant % 2 ? "m24 41 6 8-6 7-6-7Z" : "M18 49h12"}/><circle cx="28" cy="17" r="5"/></>;
  if (slot === "necklace") return <><path d="M9 7c0 23 7 36 23 47C48 43 55 30 55 7"/><path d="m32 35 11 12-11 14-11-14Z"/><path d="m27 47 5-8 5 8-5 7Z"/><circle cx="15" cy="18" r="2"/><circle cx="49" cy="18" r="2"/></>;
  if (slot === "title") return <><path d="m32 4 7 15 17 2-12 12 3 17-15-8-15 8 3-17L8 21l17-2Z"/><path d="M18 58h28M23 52h18"/><circle cx="32" cy="29" r={variant % 2 ? 6 : 4}/></>;
  return null;
}

export function ItemArtwork({ name, rarity, slot, className = "" }: ItemArtworkProps) {
  const id = useId().replace(/:/g, "");
  const variant = hashName(name);
  const highlight = rarityLight[rarity] ?? "#d7e0e5";
  const normalized = slot.startsWith("ring") ? "ring" : slot.startsWith("earring") ? "earring" : slot;
  const accessory = ["ring", "earring", "necklace", "title"].includes(normalized);
  const armor = ["head", "torso", "hands", "legs", "feet", "cape"].includes(normalized);
  return (
    <svg className={`item-artwork ${className}`} viewBox="0 0 64 64" fill="none" aria-label={`Ilustração de ${name}`} role="img">
      <defs>
        <linearGradient id={`${id}-metal`} x1="8" y1="5" x2="55" y2="59"><stop stopColor={highlight}/><stop offset=".45" stopColor="currentColor"/><stop offset="1" stopColor={highlight} stopOpacity=".35"/></linearGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={rarity === "common" ? 0.5 : 2.2} result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="32" cy="32" r="27" stroke={highlight} strokeOpacity=".12" strokeDasharray={`${3 + (variant % 5)} 5`}/>
      <g stroke={`url(#${id}-metal)`} strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${id}-glow)`}>
        {armor ? <Armor slot={normalized} variant={variant}/> : accessory ? <Accessory slot={normalized} variant={variant}/> : normalized === "off_weapon" ? <><path d="M32 4 9 14v17c0 16 10 25 23 31 13-6 23-15 23-31V14Z"/><path d="M32 11v43M16 27h32"/><path d={variant % 2 ? "m22 36 10 9 10-9" : "m21 21 11 9 11-9"}/></> : <Weapon name={name} variant={variant}/>} 
      </g>
      {rarity !== "common" ? <g fill={highlight}><circle cx="8" cy="21" r="1"/><circle cx="54" cy="44" r="1.2"/><circle cx="48" cy="8" r=".8"/></g> : null}
    </svg>
  );
}
