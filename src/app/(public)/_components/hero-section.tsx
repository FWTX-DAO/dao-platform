'use client';

import { useLogin } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

const MATRIX_CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF{}[]<>/\\|=+*&^%$#@!';

function useMatrixRain(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const columnsRef = useRef<number[]>([]);
  const rafRef = useRef<number>(0);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Semi-transparent black to create fade trail
    ctx.fillStyle = 'rgba(10, 18, 38, 0.06)';
    ctx.fillRect(0, 0, w, h);

    const fontSize = 14;
    const cols = Math.floor(w / fontSize);

    // Initialize columns if needed
    if (columnsRef.current.length !== cols) {
      columnsRef.current = Array.from({ length: cols }, () =>
        Math.random() * -100
      );
    }

    const drops = columnsRef.current;

    for (let i = 0; i < drops.length; i++) {
      const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!;
      const x = i * fontSize;
      const y = (drops[i] ?? 0) * fontSize;

      // Head character — bright cyan-white
      if (y > 0 && y < h) {
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = 'rgba(160, 220, 255, 0.9)';
        ctx.fillText(char, x, y);

        // Trail characters — blue shades with decreasing opacity
        for (let t = 1; t <= 6; t++) {
          const trailY = y - t * fontSize;
          if (trailY > 0) {
            const opacity = 0.5 - t * 0.07;
            const green = 120 + Math.floor(Math.random() * 40);
            const blue = 200 + Math.floor(Math.random() * 55);
            ctx.fillStyle = `rgba(30, ${green}, ${blue}, ${opacity})`;
            const trailChar = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]!;
            ctx.fillText(trailChar, x, trailY);
          }
        }
      }

      drops[i] = (drops[i] ?? 0) + 0.5 + Math.random() * 0.3;

      // Reset with randomness for organic feel
      if ((drops[i] ?? 0) * fontSize > h && Math.random() > 0.975) {
        drops[i] = Math.random() * -20;
      }
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return; // skip animation entirely

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columnsRef.current = [];
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = 0;
    const interval = 1000 / 20; // ~20 FPS for that choppy matrix feel

    const loop = (time: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (time - lastTime < interval) return;
      lastTime = time;
      draw(ctx, canvas.width, canvas.height);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef, draw]);
}

export function HeroSection() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push('/dashboard'),
  });

  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useMatrixRain(canvasRef);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="relative min-h-screen bg-dao-charcoal overflow-hidden selection:bg-dao-gold/30 selection:text-dao-warm">
      {/* Skip to content — keyboard accessibility */}
      <a
        href="#hero-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-dao-gold focus:text-dao-charcoal focus:text-sm focus:font-semibold focus:rounded-md"
      >
        Skip to content
      </a>

      {/* Background image + overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/fw-background.webp')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute inset-0 bg-linear-to-b from-dao-charcoal/95 via-dao-charcoal/80 to-dao-charcoal" />
      </div>

      {/* Blue Matrix rain overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-10 pointer-events-none opacity-35"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header */}
        <header role="banner" className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-4 md:py-5">
          <a href="/" className="flex items-center gap-3 group" aria-label="Fort Worth DAO — Home">
            <img
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              className="h-7 w-7 md:h-8 md:w-8 opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <span className="text-dao-warm/60 text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold group-hover:text-dao-warm/80 transition-colors">
              Fort Worth DAO
            </span>
          </a>

          <nav aria-label="Primary">
            <button
              onClick={login}
              className="inline-flex items-center gap-2 px-5 py-2 md:px-6 md:py-2.5 border border-dao-gold/60 text-dao-gold text-xs md:text-sm font-semibold tracking-wide uppercase rounded-sm hover:bg-dao-gold hover:text-dao-charcoal transition-all duration-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:ring-offset-2 focus-visible:ring-offset-dao-charcoal focus-visible:outline-hidden active:scale-[0.97]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                  clipRule="evenodd"
                />
              </svg>
              Sign In
            </button>
          </nav>
        </header>

        {/* Hero */}
        <div id="hero-content" className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-16 py-12">
          <div className="max-w-5xl">
            <div
              className="transition-[opacity,transform] duration-1000 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(16px)',
              }}
            >
              <h1 className="font-display text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] text-dao-warm leading-none tracking-[-0.01em]">
                Digital Sovereignty
                <br />
                <span className="text-dao-gold italic">is Mission Critical.</span>
              </h1>
            </div>

            <div
              className="mt-8 md:mt-10 mb-7 md:mb-9 h-px bg-linear-to-r from-dao-gold/50 to-transparent transition-[width,opacity] duration-1000 delay-200 ease-out"
              style={{
                width: mounted ? '5rem' : '0',
                opacity: mounted ? 1 : 0,
              }}
            />

            <div
              className="transition-[opacity,transform] duration-1000 delay-300 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              <p className="text-dao-cool text-base md:text-lg lg:text-xl max-w-xl leading-relaxed">
                Fort Worth DAO — advancing decentralized governance, cyber workforce
                development, digital sovereignty, AI accelerationism, and civic
                innovation lab for our City&apos;s future.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-4 mt-10 md:mt-12 transition-[opacity,transform] duration-1000 delay-500 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              <button
                onClick={login}
                className="group relative px-7 md:px-9 py-3 md:py-3.5 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal text-sm md:text-base font-semibold tracking-wide transition-colors duration-300 hover:shadow-lg hover:shadow-dao-gold/15 active:scale-[0.98] touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
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
                className="px-7 md:px-9 py-3 md:py-3.5 border border-dao-warm/15 hover:border-dao-warm/30 text-dao-warm/60 hover:text-dao-warm/90 text-sm md:text-base tracking-wide transition-colors duration-300 active:scale-[0.98] touch-manipulation focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
              >
                Whitepaper &amp; Constitution
              </a>
            </div>

            <div
              className="flex flex-wrap gap-x-6 md:gap-x-8 gap-y-2 mt-14 md:mt-20 transition-opacity duration-1000 delay-700 ease-out"
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
        <footer role="contentinfo" className="px-6 md:px-12 lg:px-16 pb-6 md:pb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-dao-warm/6 pt-5">
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
