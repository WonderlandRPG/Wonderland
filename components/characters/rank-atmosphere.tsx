interface RankAtmosphereProps {
  rank?: string;
}

export function RankAtmosphere({ rank }: RankAtmosphereProps) {
  if (!rank) return null;

  return (
    <div className="rank-atmosphere" data-rank-atmosphere={rank} aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <i key={index} style={{ "--particle-index": index } as React.CSSProperties}>
          <span />
        </i>
      ))}
    </div>
  );
}
