'use client';

import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-screen bg-dao-charcoal overflow-hidden selection:bg-dao-gold/30 selection:text-dao-warm">
      {/* Background image + overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/fw-background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dao-charcoal/95 via-dao-charcoal/80 to-dao-charcoal" />
      </div>

      {/* Subtle horizontal scan lines */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <style>{`
          @keyframes scan {
            from { transform: translateY(-100%); }
            to { transform: translateY(100vh); }
          }
          .scan-line {
            position: absolute;
            left: 0;
            width: 100%;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent 0%,
              rgba(196, 150, 58, 0.08) 20%,
              rgba(196, 150, 58, 0.12) 50%,
              rgba(196, 150, 58, 0.08) 80%,
              transparent 100%
            );
            animation: scan 12s linear infinite;
          }
          @keyframes gridFade {
            0%, 100% { opacity: 0.03; }
            50% { opacity: 0.06; }
          }
          .grid-overlay {
            background-image:
              linear-gradient(rgba(196, 150, 58, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(196, 150, 58, 0.06) 1px, transparent 1px);
            background-size: 60px 60px;
            animation: gridFade 10s ease-in-out infinite;
          }
        `}</style>
        <div className="absolute inset-0 grid-overlay" />
        <div className="scan-line" style={{ animationDelay: '0s' }} />
        <div className="scan-line" style={{ animationDelay: '4s' }} />
        <div className="scan-line" style={{ animationDelay: '8s' }} />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 md:px-12 lg:px-16 pt-6 md:pt-8">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Fort Worth DAO" className="h-7 w-7 md:h-8 md:w-8 opacity-70" />
            <span className="text-dao-warm/50 text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold">
              Fort Worth DAO
            </span>
          </div>
          <button
            onClick={login}
            className="text-xs md:text-sm text-dao-gold/80 hover:text-dao-gold transition-colors tracking-wide uppercase"
          >
            Sign In
          </button>
        </header>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12">
          <div className="max-w-5xl">
            <div
              className="transition-all duration-1000 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] text-dao-warm leading-[1] tracking-[-0.01em]">
                Digital Sovereignty
                <br />
                <span className="text-dao-gold italic">is Mission Critical.</span>
              </h1>
            </div>

            <div
              className="mt-8 md:mt-10 mb-7 md:mb-9 h-px bg-gradient-to-r from-dao-gold/50 to-transparent transition-all duration-1000 delay-200 ease-out"
              style={{
                width: mounted ? '5rem' : '0',
                opacity: mounted ? 1 : 0,
              }}
            />

            <div
              className="transition-all duration-1000 delay-300 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              <p className="text-dao-cool text-base md:text-lg lg:text-xl max-w-xl leading-relaxed">
                Fort Worth&apos;s civic innovation laboratory — advancing cryptographic governance,
                digital property rights, and AI literacy for our city&apos;s future.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-4 mt-10 md:mt-12 transition-all duration-1000 delay-500 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              <button
                onClick={login}
                className="group relative px-7 md:px-9 py-3 md:py-3.5 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal text-sm md:text-base font-semibold tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-dao-gold/15 active:scale-[0.98] touch-manipulation"
              >
                <span>Enter Platform</span>
                <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </button>

              <a
                href="https://constitution.fwtx.city"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 md:px-9 py-3 md:py-3.5 border border-dao-warm/15 hover:border-dao-warm/30 text-dao-warm/60 hover:text-dao-warm/90 text-sm md:text-base tracking-wide transition-all duration-300 active:scale-[0.98] touch-manipulation"
              >
                Whitepaper &amp; Constitution
              </a>
            </div>

            <div
              className="flex flex-wrap gap-x-6 md:gap-x-8 gap-y-2 mt-14 md:mt-20 transition-all duration-1000 delay-700 ease-out"
              style={{ opacity: mounted ? 1 : 0 }}
            >
              {['Digital Sovereignty', 'Convergent Technology', 'Civic Innovation', 'Blockchain Governance'].map(
                (tag, i) => (
                  <span
                    key={tag}
                    className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-dao-gold/35"
                    style={{ transitionDelay: `${700 + i * 100}ms` }}
                  >
                    {tag}
                  </span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 md:px-12 lg:px-16 pb-6 md:pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-dao-warm/[0.06] pt-5">
            <p className="text-[11px] text-dao-cool/30">
              Governed by{' '}
              <a
                href="https://fwtx.city"
                target="_blank"
                rel="noopener noreferrer"
                className="text-dao-gold/40 hover:text-dao-gold/70 transition-colors"
              >
                Fort Worth DAO LCA
              </a>
            </p>
            <p className="text-[11px] text-dao-cool/20 tracking-[0.15em] uppercase">fwtx.city</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
