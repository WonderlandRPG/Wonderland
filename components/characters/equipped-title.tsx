export type EquippedTitleData = {
  name: string;
  rarity: string;
  titleStyle: { primary: string; secondary: string; glow: string } | null;
};

export function EquippedTitle({ title }: { title: EquippedTitleData | null }) {
  if (!title) return null;
  return <span>{title.name}</span>;
}
