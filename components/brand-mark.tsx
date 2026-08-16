import Link from "next/link";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark(_props: BrandMarkProps) {
  return <Link href="/">Wonderland</Link>;
}
