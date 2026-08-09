interface RankAtmosphereProps {
  rank?: string;
}

export function RankAtmosphere({ rank }: RankAtmosphereProps) {
  if (!rank) return null;

  return (
    <div className="rank-atmosphere" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <i key={index} style={{ "--particle-index": index } as React.CSSProperties} />
      ))}
    </div>
  );
}
