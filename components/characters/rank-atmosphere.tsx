interface RankAtmosphereProps {
  rank?: string;
}

export function RankAtmosphere({ rank }: RankAtmosphereProps) {
  if (!rank) return null;

  return (
    <div className="rank-atmosphere" data-rank-atmosphere={rank} aria-hidden="true">
      <span className="rank-atmosphere__veil" />
      {Array.from({ length: 24 }, (_, index) => (
        <i key={index} style={{ "--particle-index": index } as React.CSSProperties}>
          <span />
        </i>
      ))}
    </div>
  );
}
