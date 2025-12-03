import Portal from "@components/graphics/portal";
import { useLogin } from "@privy-io/react-auth";
import { PrivyClient } from "@privy-io/server-auth";
import { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { db, users } from "@core/database";
import { eq } from "drizzle-orm";
import { needsOnboarding } from "@utils/onboarding";
import { useState, useEffect, useRef, useCallback } from "react";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const cookieAuthToken = req.cookies["privy-token"];

  // If no cookie is found, skip any further checks
  if (!cookieAuthToken) return { props: {} };

  const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
  const client = new PrivyClient(PRIVY_APP_ID!, PRIVY_APP_SECRET!);

  try {
    const claims = await client.verifyAuthToken(cookieAuthToken);
    console.log({ claims });

    // Check if user needs onboarding
    const privyDid = claims.userId;
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.privyDid, privyDid))
      .limit(1);

    // If user doesn't exist yet, they need onboarding
    if (existingUser.length === 0) {
      return {
        props: {},
        redirect: { destination: "/onboarding", permanent: false },
      };
    }

    // Check if existing user needs onboarding based on username
    const user = existingUser[0];
    if (user && needsOnboarding(user.username)) {
      return {
        props: {},
        redirect: { destination: "/onboarding", permanent: false },
      };
    }

    // User is fully onboarded, send to dashboard
    return {
      props: {},
      redirect: { destination: "/dashboard", permanent: false },
    };
  } catch (error) {
    return { props: {} };
  }
};

export default function LoginPage() {
  const router = useRouter();
  const { login } = useLogin({
    onComplete: () => router.push("/"),
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [smoothPosition, setSmoothPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePosition({ x, y });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, [handleMouseMove]);

  useEffect(() => {
    const animate = () => {
      setSmoothPosition((prev) => ({
        x: prev.x + (mousePosition.x - prev.x) * 0.08,
        y: prev.y + (mousePosition.y - prev.y) * 0.08,
      }));
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [mousePosition]);

  const portalRotateX = smoothPosition.y * -15;
  const portalRotateY = smoothPosition.x * 15;
  const portalTranslateZ = Math.abs(smoothPosition.x * smoothPosition.y) * 20;

  return (
    <>
      <Head>
        <title>Fort Worth TX DAO - Growing Web3 Civic Excellence</title>
      </Head>

      <main
        ref={containerRef}
        className="relative flex min-h-screen min-w-full overflow-hidden"
      >
        {/* Background with industrial gradient */}
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/fw-background.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-emerald-950/40 to-slate-900/80" />
        </div>

        {/* Industrial Grid Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <style jsx>{`
            @keyframes gridShift {
              0%, 100% { transform: perspective(1000px) rotateX(60deg) translateY(0); }
              50% { transform: perspective(1000px) rotateX(60deg) translateY(-50px); }
            }
            @keyframes dataPulse {
              0%, 100% { opacity: 0.1; transform: scaleX(0); }
              50% { opacity: 0.6; transform: scaleX(1); }
            }
            @keyframes particleFloat {
              0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
            .industrial-grid {
              position: absolute;
              width: 200%;
              height: 200%;
              left: -50%;
              top: 50%;
              background-image:
                linear-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.15) 1px, transparent 1px);
              background-size: 80px 80px;
              transform-origin: center;
              animation: gridShift 15s ease-in-out infinite;
            }
            .data-stream {
              position: absolute;
              height: 2px;
              background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), rgba(52, 211, 153, 0.6), transparent);
              animation: dataPulse 4s ease-in-out infinite;
            }
            .hex-particle {
              position: absolute;
              width: 8px;
              height: 8px;
              background: rgba(34, 197, 94, 0.6);
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              animation: particleFloat linear infinite;
            }
          `}</style>
          <div className="industrial-grid" />
          {/* Data streams */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`stream-${i}`}
              className="data-stream"
              style={{
                top: `${15 + i * 15}%`,
                left: "0",
                width: "100%",
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
          {/* Hex particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`hex-${i}`}
              className="hex-particle"
              style={{
                left: `${5 + i * 8}%`,
                animationDuration: `${8 + Math.random() * 6}s`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-20 flex flex-col w-full min-h-screen">
          {/* Header Text - At Top */}
          <div className="pt-4 md:pt-6 lg:pt-8 px-4 md:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Fort Worth DAO
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-light text-emerald-200/90 tracking-wide">
              Web3 Civic Excellence
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 md:gap-3">
              <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs font-mono text-emerald-400/80 border border-emerald-500/30 rounded bg-emerald-950/30">
                DIGITAL SOVEREIGNTY
              </span>
              <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs font-mono text-cyan-400/80 border border-cyan-500/30 rounded bg-cyan-950/30">
                CONVERGENT TECH
              </span>
              <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs font-mono text-teal-400/80 border border-teal-500/30 rounded bg-teal-950/30">
                CIVIC INNOVATION
              </span>
            </div>
          </div>

          {/* 3D Portal Section */}
          <div className="flex-1 flex justify-center items-center px-4 py-4 md:py-6">
            <div
              className="relative"
              style={{
                perspective: "1200px",
                perspectiveOrigin: "50% 50%",
              }}
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 blur-3xl opacity-40"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(34, 197, 94, 0.4) 0%, rgba(20, 184, 166, 0.2) 40%, transparent 70%)`,
                  transform: `translate3d(${smoothPosition.x * 20}px, ${smoothPosition.y * 20}px, 0)`,
                }}
              />

              {/* Portal with 3D transform */}
              <div
                className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 transition-transform duration-100"
                style={{
                  transform: `
                    rotateX(${portalRotateX}deg)
                    rotateY(${portalRotateY}deg)
                    translateZ(${portalTranslateZ}px)
                    scale(${1 + Math.abs(smoothPosition.x * smoothPosition.y) * 0.05})
                  `,
                  transformStyle: "preserve-3d",
                }}
              >
                <Portal
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: `drop-shadow(0 0 30px rgba(34, 197, 94, 0.3)) drop-shadow(0 0 60px rgba(20, 184, 166, 0.2))`,
                  }}
                />

                {/* Reflection plane */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    transform: "rotateX(180deg) translateY(100%) scaleY(0.3)",
                    background: "linear-gradient(to bottom, rgba(34, 197, 94, 0.3), transparent)",
                    filter: "blur(8px)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Actions Section - Bottom */}
          <div className="pb-4 md:pb-8 px-4 md:px-6">
            <div className="flex flex-col items-center gap-3 max-w-2xl mx-auto">
              <button
                className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 md:py-3 px-6 md:px-8 text-white rounded-lg text-base md:text-lg font-medium shadow-lg shadow-emerald-900/30 transform transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/20 active:scale-95 touch-manipulation"
                onClick={login}
              >
                <span className="relative z-10">Enter Platform</span>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity" />
              </button>

              <a
                href="https://constitution.fwtx.city"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-emerald-500/40 hover:border-emerald-400/60 bg-emerald-950/30 hover:bg-emerald-900/40 py-2 px-4 md:px-5 text-emerald-200 rounded-lg text-sm md:text-base font-medium transition-all duration-300 hover:scale-105 active:scale-95 touch-manipulation"
              >
                Whitepaper & Constitution
              </a>

              <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto text-center mt-1 leading-relaxed px-2">
                Advancing cryptographic governance, digital property rights, and AI literacy for Fort Worth's civic future
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pb-4 px-4 md:px-6 text-center">
            <p className="text-xs text-slate-500">
              Governed by{" "}
              <a 
                href="https://fwtx.city" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-400/70 hover:text-emerald-400 transition-colors underline"
              >
                Fort Worth DAO LCA
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
