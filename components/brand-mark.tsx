import Image from "next/image";
import Link from "next/link";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Link className={`brand-mark ${compact ? "brand-mark--compact" : ""}`} href="/" aria-label="Wonderland — página inicial">
      <span className="brand-mark__crest" aria-hidden="true">
        <Image src="/brand/wonderland-logo.png" alt="" width={46} height={46} priority />
      </span>
      <span className="brand-mark__copy">
        <strong>Wonderland</strong>
        {!compact ? <small>Role-playing game</small> : null}
      </span>
    </Link>
  );
}
