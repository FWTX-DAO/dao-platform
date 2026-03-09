import { useMemo, useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { NAICS_CODES, type NaicsCode } from '@shared/constants/naics';

interface IndustrySelectProps {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export default function IndustrySelect({ value, onChange, className, variant = 'light' }: IndustrySelectProps) {
  const [query, setQuery] = useState('');

  const selected = NAICS_CODES.find((n) => n.code === value) ?? null;

  const filtered = useMemo(() => {
    if (!query) return NAICS_CODES;
    const q = query.toLowerCase();
    return NAICS_CODES.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        n.sector.toLowerCase().includes(q) ||
        n.code.includes(q),
    );
  }, [query]);

  const texasCodes = filtered.filter((n) => n.texasFocus);
  const otherCodes = filtered.filter((n) => !n.texasFocus);

  const isDark = variant === 'dark';

  const inputClass = isDark
    ? 'w-full px-4 py-2.5 bg-[#1a1f29] border border-[#252b37] rounded-sm text-dao-warm placeholder-dao-cool/40 focus-visible:outline-hidden focus-visible:border-dao-gold/50 focus-visible:ring-1 focus-visible:ring-dao-gold/30 transition pr-10 text-sm'
    : 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-violet-500 transition pr-10 text-sm';

  const dropdownClass = isDark
    ? 'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm bg-[#12161d] border border-[#252b37] shadow-lg py-1 text-sm'
    : 'absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white border border-gray-200 shadow-lg py-1 text-sm';

  const emptyClass = isDark ? 'px-4 py-2 text-dao-cool/60' : 'px-4 py-2 text-gray-500';

  const sectionHeaderTexas = isDark
    ? 'px-4 py-1.5 text-xs font-semibold text-dao-gold bg-dao-gold/10 sticky top-0'
    : 'px-4 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 sticky top-0';

  const sectionHeaderAll = isDark
    ? 'px-4 py-1.5 text-xs font-semibold text-dao-cool/60 bg-[#1a1f29] sticky top-0'
    : 'px-4 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0';

  return (
    <Combobox
      value={selected}
      onChange={(val: NaicsCode | null) => onChange(val?.code ?? '')}
      onClose={() => setQuery('')}
    >
      <div className={`relative ${className ?? ''}`}>
        <ComboboxInput
          displayValue={(n: NaicsCode | null) => (n ? `${n.code} — ${n.label}` : '')}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, sector, or code..."
          className={inputClass}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3" aria-label="Toggle industry list">
          <ChevronsUpDown className={`h-5 w-5 ${isDark ? 'text-dao-cool/40' : 'text-gray-400'}`} />
        </ComboboxButton>

        <ComboboxOptions className={dropdownClass}>
          {filtered.length === 0 ? (
            <div className={emptyClass}>No matching industries</div>
          ) : (
            <>
              {texasCodes.length > 0 && (
                <>
                  {!query && (
                    <div className={sectionHeaderTexas}>Popular in Texas</div>
                  )}
                  {texasCodes.map((n) => (
                    <IndustryOption key={n.code} item={n} variant={variant} />
                  ))}
                </>
              )}
              {otherCodes.length > 0 && (
                <>
                  {!query && texasCodes.length > 0 && (
                    <div className={sectionHeaderAll}>All Industries</div>
                  )}
                  {otherCodes.map((n) => (
                    <IndustryOption key={n.code} item={n} variant={variant} />
                  ))}
                </>
              )}
            </>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

function IndustryOption({ item, variant = 'light' }: { item: NaicsCode; variant?: 'light' | 'dark' }) {
  const isDark = variant === 'dark';
  const optionClass = isDark
    ? 'cursor-pointer select-none px-4 py-2 data-focus:bg-dao-gold/10 data-selected:bg-dao-gold/15 flex items-center justify-between text-dao-warm'
    : 'cursor-pointer select-none px-4 py-2 data-focus:bg-violet-50 data-selected:bg-violet-100 flex items-center justify-between';

  return (
    <ComboboxOption value={item} className={optionClass}>
      {({ selected }) => (
        <>
          <span>
            <span className={`font-mono text-xs mr-2 ${isDark ? 'text-dao-cool/50' : 'text-gray-400'}`}>{item.code}</span>
            {item.label}
            <span className={`ml-2 text-xs ${isDark ? 'text-dao-cool/40' : 'text-gray-400'}`}>({item.sector})</span>
          </span>
          {selected && <Check className={`h-4 w-4 shrink-0 ${isDark ? 'text-dao-gold' : 'text-violet-600'}`} />}
        </>
      )}
    </ComboboxOption>
  );
}
