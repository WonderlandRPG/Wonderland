const paths: Record<string, React.ReactNode> = {
  head: (
    <>
      <path d="M5 18v-7a7 7 0 0 1 14 0v7" />
      <path d="M3 18h18M8 18v-4h8v4" />
    </>
  ),
  torso: (
    <>
      <path d="m8 4-4 3 2 5 2-1v9h8v-9l2 1 2-5-4-3" />
      <path d="M10 4a2 2 0 0 0 4 0" />
    </>
  ),
  hands: (
    <>
      <path d="M7 20 4 14V7a1 1 0 0 1 2 0v4-6a1 1 0 0 1 2 0v6-7a1 1 0 0 1 2 0v7-5a1 1 0 0 1 2 0v8l-3 6" />
      <path d="M17 20v-7l2-3a1.5 1.5 0 0 1 2 2l-2 5" />
    </>
  ),
  legs: (
    <>
      <path d="M8 3h8l1 8-2 10h-4l1-9-1 9H7L6 11Z" />
    </>
  ),
  feet: (
    <>
      <path d="M6 4v10l-3 3v3h8v-4l-1-12ZM16 4v10l-3 3v3h8v-3l-3-3V4Z" />
    </>
  ),
  main_weapon: (
    <>
      <path d="m14 3 7 0-9 9-3 0v-3Z" />
      <path d="m10 11-7 7 3 3 7-7M7 16l2 2" />
    </>
  ),
  off_weapon: (
    <>
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6Z" />
      <path d="M12 7v10M8 11h8" />
    </>
  ),
  necklace: (
    <>
      <path d="M5 4c0 7 2 11 7 14 5-3 7-7 7-14" />
      <path d="m12 14 3 4-3 3-3-3Z" />
    </>
  ),
  ring: (
    <>
      <circle cx="12" cy="14" r="6" />
      <path d="m9 8 3-5 3 5-3 3Z" />
    </>
  ),
  earring: (
    <>
      <path d="M15 5a4 4 0 1 0-6 3.5V13" />
      <path d="m9 13 3 4-3 4-3-4Z" />
    </>
  ),
  cape: (
    <>
      <path d="M8 4h8l3 17-7-4-7 4Z" />
      <path d="M9 4a3 3 0 0 0 6 0" />
    </>
  ),
  title: (
    <>
      <path d="m12 3 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z" />
      <path d="M8 21h8" />
    </>
  ),
};

export function ItemGlyph({ slot, className = "" }: { slot: string; className?: string }) {
  const normalized = slot.startsWith("ring")
    ? "ring"
    : slot.startsWith("earring")
      ? "earring"
      : slot;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[normalized] ?? paths.main_weapon}
    </svg>
  );
}
