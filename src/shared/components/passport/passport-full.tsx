'use client';

import { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PassportCover } from './passport-cover';
import { PassportInside } from './passport-inside';
import type { PassportData } from './types';

interface PassportFullProps {
  data: PassportData;
  defaultOpen?: boolean;
}

export function PassportFull({ data, defaultOpen = false }: PassportFullProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const shouldReduceMotion = useReducedMotion();

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <>
      {/* Desktop: 3D flip */}
      <div className="hidden sm:block">
        <div
          className="relative cursor-pointer"
          style={{ perspective: '1200px' }}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Toggle passport view"
        >
          <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
            {/* Cover (front) */}
            <motion.div
              animate={{ rotateY: isOpen ? -180 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                transformOrigin: 'left center',
              }}
              className="relative z-10"
            >
              <PassportCover size="lg" />
            </motion.div>

            {/* Inside (back) — positioned behind cover */}
            <motion.div
              animate={{ opacity: isOpen ? 1 : 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: isOpen ? (shouldReduceMotion ? 0 : 0.4) : 0 }}
              className="absolute top-0 left-0"
            >
              <PassportInside data={data} className="w-72 h-96" />
            </motion.div>
          </div>

          <p className="mt-4 text-center text-xs text-dao-cool/50">
            {isOpen ? 'Click to close' : 'Click to open passport'}
          </p>
        </div>
      </div>

      {/* Mobile: stacked view */}
      <div className="sm:hidden flex flex-col items-center gap-6">
        <PassportCover size="md" />
        <PassportInside data={data} />
      </div>
    </>
  );
}
