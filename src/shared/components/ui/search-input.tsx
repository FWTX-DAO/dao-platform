'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  'aria-label'?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  debounceMs = 300,
  className,
  'aria-label': ariaLabel,
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(next), debounceMs);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder.replace('…', '')}
        className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 bg-white placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden min-h-[44px]"
      />
    </div>
  );
}
