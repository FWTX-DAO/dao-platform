'use client';

import type { PassportStamp } from './types';

const EVENT_TYPE_STYLES: Record<string, { color: string; border: string; bg: string; label: string }> = {
  townhall:   { color: 'text-amber-700',   border: 'border-amber-600/40',   bg: 'bg-amber-50',    label: 'Town Hall' },
  workshop:   { color: 'text-blue-700',    border: 'border-blue-600/40',    bg: 'bg-blue-50',     label: 'Workshop' },
  meetup:     { color: 'text-emerald-700', border: 'border-emerald-600/40', bg: 'bg-emerald-50',  label: 'Meetup' },
  hackathon:  { color: 'text-purple-700',  border: 'border-purple-600/40',  bg: 'bg-purple-50',   label: 'Hackathon' },
  conference: { color: 'text-rose-700',    border: 'border-rose-600/40',    bg: 'bg-rose-50',     label: 'Conference' },
  social:     { color: 'text-cyan-700',    border: 'border-cyan-600/40',    bg: 'bg-cyan-50',     label: 'Social' },
};

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return ((hash % 17) - 8); // -8 to +8
}

function formatStampDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

interface PassportStampsProps {
  stamps: PassportStamp[];
}

export function PassportStamps({ stamps }: PassportStampsProps) {
  if (stamps.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <span className="text-[9px] uppercase tracking-widest text-dao-cool/25 italic">
          No stamps yet
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center py-2">
      {stamps.slice(0, 8).map((stamp) => {
        const style = EVENT_TYPE_STYLES[stamp.eventType] ?? EVENT_TYPE_STYLES['meetup']!;
        const rotation = seededRandom(stamp.id);

        return (
          <div
            key={stamp.id}
            className={`
              relative flex flex-col items-center justify-center
              w-[72px] h-[72px] rounded-full
              border-2 border-dashed ${style.border} ${style.bg}
              opacity-80 hover:opacity-100 transition-opacity
            `}
            style={{ transform: `rotate(${rotation}deg)` }}
            title={`${stamp.eventName} - ${formatStampDate(stamp.eventDate)}`}
          >
            <span className={`text-[7px] font-bold uppercase tracking-wide ${style.color} text-center leading-tight px-1`}>
              {style.label}
            </span>
            <span className={`text-[6px] ${style.color}/70 text-center leading-tight px-1 mt-0.5 line-clamp-2`}>
              {stamp.eventName.length > 18 ? stamp.eventName.slice(0, 16) + '\u2026' : stamp.eventName}
            </span>
            {stamp.eventDate && (
              <span suppressHydrationWarning className={`text-[6px] ${style.color}/50 mt-0.5`}>
                {formatStampDate(stamp.eventDate)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
