type KingdomEmblemProps = {
  realmKey: string;
  className?: string;
  title?: string;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 2.2,
};

export function KingdomEmblem({ realmKey, className, title }: KingdomEmblemProps) {
  const label = title ?? `Brasão de ${realmKey}`;

  return (
    <svg aria-label={label} className={className} role="img" viewBox="0 0 64 72" xmlns="http://www.w3.org/2000/svg">
      <title>{label}</title>
      <path d="M32 3 55 12v22c0 16-9 27-23 35C18 61 9 50 9 34V12L32 3Z" fill="currentColor" opacity=".12" />
      <path d="M32 3 55 12v22c0 16-9 27-23 35C18 61 9 50 9 34V12L32 3Z" {...stroke} />
      <path d="M18 14h28M16 19h32" {...stroke} opacity=".65" />

      {realmKey === "aokigahara" ? (
        <g {...stroke}>
          <path d="M32 53V29" />
          <path d="M20 31c0-6 4-10 9-10 2-5 6-8 11-8 7 0 12 5 12 12 4 2 6 5 6 9 0 7-5 12-12 12-4 0-8-2-12-5-3 3-7 5-12 5-7 0-12-5-12-12 0-6 4-11 10-12Z" />
          <path d="M32 39c-5 6-10 10-18 14M32 39c5 6 10 10 18 14M32 45c-3 4-6 7-10 10M32 45c3 4 6 7 10 10" />
          <path d="M22 28c3 3 6 5 10 5s7-2 10-5" opacity=".7" />
        </g>
      ) : null}

      {realmKey === "oymyakon" ? (
        <g {...stroke}>
          <path d="M32 16v38M14 35h36M19 22l26 26M45 22 19 48" />
          <path d="m32 17-4 5M32 17l4 5M32 53l-4-5M32 53l4-5M15 35l5-4M15 35l5 4M49 35l-5-4M49 35l-5 4" />
          <path d="m22 25 1 6 6 1M42 25l-6 1-1 6M22 45l1-6 6-1M42 45l-6-1-1-6" />
          <path d="m32 26 4 9-4 9-4-9 4-9Z" fill="currentColor" opacity=".18" />
        </g>
      ) : null}

      {realmKey === "namida" ? (
        <g {...stroke}>
          <path d="M32 16v32" />
          <path d="m22 25 10-9 10 9M22 25v8c0 6 4 11 10 11s10-5 10-11v-8" />
          <path d="M15 45c6-5 12-5 17 0s11 5 17 0M17 52c5-4 10-4 15 0s10 4 15 0" />
          <path d="m28 47 4 10 4-10" />
          <path d="M24 21c2 2 5 3 8 3s6-1 8-3" opacity=".7" />
        </g>
      ) : null}

      {realmKey === "darkya" ? (
        <g {...stroke}>
          <path d="M16 34c4-11 10-17 16-17s12 6 16 17c-4-2-7-2-10 1-4-3-8-3-12 0-3-3-6-3-10-1Z" />
          <path d="M32 17v27c0 7 3 11 8 11 3 0 6-2 6-6" />
          <path d="M20 43v5M44 42v5M18 54h-5M51 54h-5" />
          <path d="M17 24h30" opacity=".65" />
        </g>
      ) : null}

      {realmKey === "skypiece" ? (
        <g {...stroke}>
          <path d="m32 15 10 14-10 18-10-18 10-14Z" />
          <path d="M13 46c5-6 10-7 16-4M51 46c-5-6-10-7-16-4" />
          <path d="M16 53c4-4 8-4 12 0M48 53c-4-4-8-4-12 0" />
          <path d="M32 47v11M27 57h10" />
          <path d="m32 20 4 8-4 8-4-8 4-8Z" fill="currentColor" opacity=".18" />
        </g>
      ) : null}

      {realmKey === "lesedi" ? (
        <g {...stroke}>
          <circle cx="32" cy="35" r="9" />
          <path d="M32 15v8M32 47v8M12 35h8M44 35h8M18 21l6 6M46 49l-6-6M46 21l-6 6M18 49l6-6" />
          <path d="m32 24 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z" fill="currentColor" opacity=".18" />
          <path d="M26 35h12" opacity=".7" />
        </g>
      ) : null}
    </svg>
  );
}
