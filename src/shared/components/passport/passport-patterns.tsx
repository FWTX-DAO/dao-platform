'use client';

export function GuillochePattern({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'overlay', opacity: 0.12 }}
      preserveAspectRatio="none"
      viewBox="0 0 600 400"
    >
      {Array.from({ length: 16 }, (_, i) => (
        <path
          key={i}
          d={`M0,${25 * i} Q150,${25 * i + 15 * Math.sin(i)} 300,${25 * i} T600,${25 * i}`}
          fill="none"
          stroke="#c4963a"
          strokeWidth="0.5"
        />
      ))}
      {Array.from({ length: 24 }, (_, i) => (
        <path
          key={`v-${i}`}
          d={`M${25 * i},0 Q${25 * i + 10 * Math.cos(i)},200 ${25 * i},400`}
          fill="none"
          stroke="#c4963a"
          strokeWidth="0.3"
        />
      ))}
    </svg>
  );
}

export function PassportWatermark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ opacity: 0.03 }}
    >
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-12 -rotate-12">
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="text-dao-gold font-display text-4xl tracking-[0.2em] whitespace-nowrap select-none"
          >
            FORT WORTH DAO
          </span>
        ))}
      </div>
    </div>
  );
}

export function SecurityBorder({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Outer border */}
      <div className="absolute inset-1 border border-dao-gold/20 rounded-sm" />
      {/* Inner border */}
      <div className="absolute inset-2.5 border border-dao-gold/10 rounded-xs" />
      {/* Corner ornaments */}
      {(['top-1 left-1', 'top-1 right-1', 'bottom-1 left-1', 'bottom-1 right-1'] as const).map(
        (pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-4 h-4`}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" className="w-full h-full text-dao-gold/30">
              <path
                d={
                  i === 0
                    ? 'M0,8 L0,0 L8,0'
                    : i === 1
                      ? 'M8,0 L16,0 L16,8'
                      : i === 2
                        ? 'M0,8 L0,16 L8,16'
                        : 'M8,16 L16,16 L16,8'
                }
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )
      )}
    </div>
  );
}
