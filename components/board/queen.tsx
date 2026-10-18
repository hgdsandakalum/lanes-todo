/** An octagon centred on the board, flat sides top/bottom, sized by its circumradius. */
const oct = (r: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = ((i * 45 + 22.5) * Math.PI) / 180;
    return `${(60 + r * Math.cos(a)).toFixed(2)},${(60 + r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/**
 * The centre of the board, cut as octagons to match its eight-point rosette. A picked deep task
 * fills the queen; an empty slot is a dashed outline, the board's line form for "waiting".
 */
export function QueenMedallion({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 120" className={className}>
      <polygon points={oct(58)} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="miter" />
      <polygon points={oct(50)} fill="none" stroke="var(--line)" strokeWidth="1.5" strokeLinejoin="miter" />
      {/* the rosette's eight points */}
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          d="M60 11 L64 26 L56 26 Z"
          fill="var(--line)"
          transform={`rotate(${i * 45} 60 60)`}
        />
      ))}
      {filled ? (
        <>
          <polygon points={oct(28)} fill="var(--queen)" />
          <polygon points={oct(20)} fill="none" stroke="var(--queen-ink)" strokeOpacity="0.45" strokeWidth="1.5" />
        </>
      ) : (
        <polygon points={oct(27)} fill="none" stroke="var(--queen)" strokeWidth="2.5" strokeDasharray="6 6" />
      )}
    </svg>
  );
}
