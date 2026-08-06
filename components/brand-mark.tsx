import Image from "next/image";
import Link from "next/link";

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <Link
      className={`brand-mark ${compact ? "brand-mark--compact" : ""} ${inverse ? "brand-mark--inverse" : ""}`}
      href="/"
      aria-label="Wonderland — página inicial"
    >
      <span className="brand-mark__emblem" aria-hidden="true">
        <Image src="/brand/wonderland-logo.png" alt="" width={58} height={58} priority />
      </span>
      {!compact && (
        <span className="brand-mark__copy">
          <strong>Wonderland</strong>
          <small>Role-playing game</small>
        </span>
      )}
    </Link>
  );
}
