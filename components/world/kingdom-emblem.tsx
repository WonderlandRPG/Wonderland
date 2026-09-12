type KingdomEmblemProps = {
  realmKey: string;
  className?: string;
  title?: string;
};

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2.1,
};

export function KingdomEmblem({ realmKey, className, title }: KingdomEmblemProps) {
  const label = title ?? `Brasão de ${realmKey}`;

  return (
    <svg
      aria-label={label}
      className={className}
      role="img"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      {realmKey === "aokigahara" ? (
        <g {...common}>
          <path d="M24 39V24" />
          <path d="M24 25c-7 0-11-4-11-9 0-4 3-7 7-7 1-4 4-6 8-6 5 0 9 4 9 9 4 1 6 4 6 8 0 5-4 9-10 9-3 0-6-1-9-4Z" />
          <path d="M24 29c-3 5-7 8-13 10M24 29c3 5 7 8 13 10M24 34c-2 3-4 5-7 7M24 34c2 3 4 5 7 7" />
        </g>
      ) : null}

      {realmKey === "oymyakon" ? (
        <g {...common}>
          <path d="M24 5v38M5 24h38M10.5 10.5l27 27M37.5 10.5l-27 27" />
          <path d="m24 9-4 4M24 9l4 4M24 39l-4-4M24 39l4-4M9 24l4-4M9 24l4 4M39 24l-4-4M39 24l-4 4" />
          <path d="m13 13 1 5 5 1M35 13l-5 1-1 5M13 35l1-5 5-1M35 35l-5-1-1-5" />
        </g>
      ) : null}

      {realmKey === "namida" ? (
        <g {...common}>
          <path d="M24 5v29" />
          <path d="m15 13 9-8 9 8M15 13v7c0 5 4 9 9 9s9-4 9-9v-7" />
          <path d="M8 29c5-4 10-4 16 0s11 4 16 0M8 36c5-4 10-4 16 0s11 4 16 0" />
          <path d="m20 34 4 9 4-9" />
        </g>
      ) : null}

      {realmKey === "darkya" ? (
        <g {...common}>
          <path d="M8 22c3-9 9-14 16-14s13 5 16 14c-3-2-6-2-8 0-3-2-6-2-8 0-3-2-6-2-8 0-3-2-6-2-8 0Z" />
          <path d="M24 8v24c0 6 3 9 7 9 3 0 5-2 5-5" />
          <path d="M13 30v5M37 30v5M16 39h-5M37 39h-5" />
        </g>
      ) : null}

      {realmKey === "skypiece" ? (
        <g {...common}>
          <path d="m24 5 8 12-8 16-8-16 8-12Z" />
          <path d="M8 31c4-5 8-6 13-3M40 31c-4-5-8-6-13-3" />
          <path d="M10 36c3-3 7-3 10 0M38 36c-3-3-7-3-10 0" />
          <path d="M24 33v10M20 39h8" />
        </g>
      ) : null}

      {realmKey === "lesedi" ? (
        <g {...common}>
          <circle cx="24" cy="24" r="8" />
          <path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M38.1 9.9l-5 5M14.9 33.1l-5 5" />
          <path d="m24 13 3 5 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1 3-5Z" />
        </g>
      ) : null}
    </svg>
  );
}
