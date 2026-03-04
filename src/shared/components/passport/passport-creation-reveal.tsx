'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import type { PassportData } from './types';
import { PassportInside } from './passport-inside';

interface PassportCreationRevealProps {
  data: PassportData;
  onComplete: () => void;
}

export function PassportCreationReveal({ data, onComplete }: PassportCreationRevealProps) {
  const [phase, setPhase] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  // 0 = typing text, 1 = cover materializes, 2 = cover opens + data, 3 = seal, 4 = welcome

  useEffect(() => {
    if (shouldReduceMotion) {
      // Skip directly to final phase
      setPhase(4);
      return;
    }
    const timers = [
      setTimeout(() => setPhase(1), 1200),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4000),
      setTimeout(() => setPhase(4), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [shouldReduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: '#0f1b33', overscrollBehavior: 'contain' }}
      role="dialog"
      aria-modal="true"
      aria-label="Passport creation"
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Phase 0: Typing text */}
        <AnimatePresence>
          {phase === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              className="text-center"
            >
              <div aria-live="polite">
                <TypingText text={`Issuing your Fort Worth DAO Passport\u2026`} shouldReduceMotion={!!shouldReduceMotion} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 1: Cover materializes */}
        <AnimatePresence>
          {phase >= 1 && phase < 2 && (
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ rotateY: -180, opacity: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="relative"
              style={{ perspective: '1200px' }}
            >
              {/* Passport cover */}
              <div
                className="relative w-56 h-72 sm:w-64 sm:h-80 rounded-md overflow-hidden flex flex-col items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #1a2744 0%, #0f1b33 50%, #1a2744 100%)',
                  boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                }}
              >
                <div className="absolute inset-0 border border-dao-gold/15 rounded-md" />
                <span className="text-dao-gold tracking-[0.3em] uppercase font-display text-xs mb-6">
                  Passport
                </span>
                <Image src="/logo.svg" alt="" width={64} height={64} className="opacity-80 mb-5" />
                <span className="text-dao-gold/90 tracking-[0.15em] uppercase text-[10px] font-semibold">
                  Fort Worth DAO
                </span>

                {/* Gold shimmer sweep */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ duration: shouldReduceMotion ? 0 : 1.2, delay: shouldReduceMotion ? 0 : 0.3, ease: 'easeInOut' }}
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'linear-gradient(105deg, transparent 40%, rgba(196,150,58,0.15) 50%, transparent 60%)',
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2: Inside page with staggered fields */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.4, 0, 0.2, 1] }}
              className="relative"
            >
              <PassportInside data={data} className="w-72 sm:w-80" />

              {/* Phase 3: Gold seal stamp */}
              {phase >= 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: shouldReduceMotion ? 1 : [0, 1.1, 1], opacity: 1 }}
                  transition={shouldReduceMotion ? { duration: 0 } : {
                    type: 'spring',
                    stiffness: 260,
                    damping: 15,
                    duration: 0.5,
                  }}
                  className="absolute -bottom-3 -right-3 w-16 h-16 flex items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-dao-gold/90 flex items-center justify-center shadow-lg">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="w-7 h-7 text-dao-charcoal" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 4: Welcome + button */}
        <AnimatePresence>
          {phase >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.2 }}
              className="mt-8 text-center"
            >
              <h2 className="font-display text-2xl sm:text-3xl text-dao-warm mb-2">
                Welcome to Fort Worth DAO
              </h2>
              <p className="text-dao-cool/60 text-sm mb-6">
                Your passport has been issued
              </p>
              <button
                onClick={onComplete}
                className="px-8 py-3 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal font-semibold rounded transition-colors active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
              >
                Enter Platform
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TypingText({ text, shouldReduceMotion }: { text: string; shouldReduceMotion: boolean }) {
  const [displayed, setDisplayed] = useState(shouldReduceMotion ? text : '');

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayed(text);
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [text, shouldReduceMotion]);

  return (
    <span className="font-display text-xl sm:text-2xl text-dao-warm">
      {displayed}
      {shouldReduceMotion ? (
        <span
          className="inline-block w-0.5 h-5 bg-dao-gold ml-0.5 align-middle"
          aria-hidden="true"
        />
      ) : (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-0.5 h-5 bg-dao-gold ml-0.5 align-middle"
          aria-hidden="true"
        />
      )}
    </span>
  );
}
