"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  IdCard,
  Loader2,
  LogIn,
  Stamp,
  Trophy,
  UserPlus,
} from "lucide-react";
import {
  useRoundtableCheckIn,
  useRoundtableCheckInStatus,
} from "@shared/hooks/useCheckIn";

function formatEventDate(startsAt: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(startsAt));
}

function formatEventTime(timestamp: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(timestamp));
}

function onboardingHref() {
  return "/onboarding?intent=check-in&returnTo=/check-in";
}

export function CheckInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoCheckIn = searchParams.get("auto") === "1";
  const status = useRoundtableCheckInStatus();
  const checkIn = useRoundtableCheckIn();
  const autoAttemptedRef = useRef(false);
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin({
    onComplete: () => {
      router.replace("/check-in?auto=1");
    },
  });

  const latestResult =
    checkIn.data?.success === true ? checkIn.data.data : null;
  const latestError =
    checkIn.data?.success === false
      ? checkIn.data.error
      : checkIn.error instanceof Error
        ? checkIn.error.message
        : null;

  const event = latestResult?.event ?? status.data?.event;
  const eventDate = useMemo(() => {
    if (!event) return "Wednesdays at 12:00 PM CT";
    return formatEventDate(event.startsAt, event.timeZone);
  }, [event]);
  const eventWindow = useMemo(() => {
    if (!event) return "Check-in: 11:30 AM-2:30 PM CT";
    const opensAt = formatEventTime(event.checkInOpensAt, event.timeZone);
    const closesAt = formatEventTime(event.checkInClosesAt, event.timeZone);
    return `Check-in: ${opensAt}-${closesAt}`;
  }, [event]);

  const checkedIn = !!latestResult || !!status.data?.checkedIn;
  const checkInClosed = !!status.data && !status.data.canCheckIn && !checkedIn;
  const alreadyCheckedIn =
    latestResult?.alreadyCheckedIn ?? status.data?.checkedIn ?? false;
  const totalPoints =
    latestResult?.totalPoints ?? status.data?.totalPoints ?? null;
  const pointsAwarded =
    latestResult?.pointsAwarded ?? status.data?.pointsAwarded ?? 10;

  useEffect(() => {
    if (!autoCheckIn || !status.data || autoAttemptedRef.current) return;

    if (!status.data.authenticated) return;

    if (status.data.needsOnboarding) {
      autoAttemptedRef.current = true;
      router.replace(onboardingHref());
      return;
    }

    if (status.data.canCheckIn && !status.data.checkedIn) {
      autoAttemptedRef.current = true;
      checkIn.mutate();
    }
  }, [autoCheckIn, checkIn, router, status.data]);

  const handlePrimaryAction = () => {
    if (!ready) return;
    if (!authenticated) {
      login();
      return;
    }
    if (status.data?.needsOnboarding) {
      router.push(onboardingHref());
      return;
    }
    if (!status.data?.canCheckIn) return;
    checkIn.mutate();
  };

  const primaryLabel = !ready
    ? "Loading"
    : checkInClosed
      ? "Check-In Closed"
      : !authenticated
        ? "Sign In To Check In"
        : status.data?.needsOnboarding
          ? "Create Passport"
          : checkedIn
            ? "Checked In"
            : "Check In";
  const PrimaryIcon = !ready
    ? Loader2
    : !authenticated
      ? LogIn
      : status.data?.needsOnboarding
        ? UserPlus
        : checkedIn
          ? CheckCircle2
          : Stamp;

  return (
    <main className="relative min-h-screen overflow-hidden bg-dao-charcoal text-dao-warm selection:bg-dao-gold/30 selection:text-dao-warm">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/fw-background.webp')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        />
        <div className="absolute inset-0 bg-dao-charcoal/90" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 text-dao-warm/70 transition-colors hover:text-dao-warm"
            aria-label="Fort Worth DAO home"
          >
            <img
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 opacity-80"
            />
            <span className="text-xs font-semibold uppercase">
              Fort Worth DAO
            </span>
          </Link>

          {authenticated && (
            <Link
              href="/passport"
              className="inline-flex items-center gap-2 rounded-sm border border-dao-warm/15 px-4 py-2 text-sm font-semibold text-dao-warm/70 transition-colors hover:border-dao-gold/60 hover:text-dao-gold"
            >
              <IdCard className="h-4 w-4" />
              Passport
            </Link>
          )}
        </header>

        <section className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 border border-dao-gold/30 bg-dao-gold/10 px-3 py-1.5 text-xs font-semibold uppercase text-dao-gold">
                <CalendarDays className="h-4 w-4" />
                Wednesdays, 12:00 PM CT
              </div>
              <h1 className="font-display text-5xl leading-none text-dao-warm sm:text-6xl lg:text-7xl">
                Community Roundtable
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-dao-cool sm:text-lg">
                Check in with your DAO passport and add attendance to your
                contribution record.
              </p>
            </div>

            <div className="rounded-lg border border-dao-border/70 bg-dao-dark/90 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-dao-border/60 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-dao-cool/70">
                    Next Roundtable
                  </p>
                  <p className="mt-2 text-xl font-semibold text-dao-warm">
                    {event?.name ?? "Community Roundtable"}
                  </p>
                  <p className="mt-1 text-sm text-dao-cool">{eventDate}</p>
                  <p className="mt-1 text-xs text-dao-cool/70">{eventWindow}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-dao-gold/15 text-dao-gold">
                  <Award className="h-6 w-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-5">
                <div className="rounded-sm border border-dao-border/60 bg-dao-surface/50 p-4">
                  <p className="text-xs uppercase text-dao-cool/60">
                    Attendance
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-dao-warm">
                    +{pointsAwarded}
                  </p>
                  <p className="text-xs text-dao-cool">points</p>
                </div>
                <div className="rounded-sm border border-dao-border/60 bg-dao-surface/50 p-4">
                  <p className="text-xs uppercase text-dao-cool/60">
                    Running Total
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-dao-warm">
                    {totalPoints ?? "--"}
                  </p>
                  <p className="text-xs text-dao-cool">points</p>
                </div>
              </div>

              {status.isLoading ? (
                <div
                  className="flex items-center gap-3 rounded-sm border border-dao-border/60 bg-dao-surface/40 p-4 text-sm text-dao-cool"
                  role="status"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading check-in
                </div>
              ) : checkedIn ? (
                <div className="rounded-sm border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
                    <div>
                      <p className="font-semibold text-green-300">
                        {alreadyCheckedIn
                          ? "Already checked in"
                          : "Check-in recorded"}
                      </p>
                      <p className="mt-1 text-sm text-green-100/70">
                        Your passport now includes this Roundtable attendance.
                      </p>
                    </div>
                  </div>
                </div>
              ) : checkInClosed ? (
                <div className="rounded-sm border border-dao-border/60 bg-dao-surface/40 p-4 text-sm text-dao-cool">
                  {status.data?.unavailableReason ??
                    "Check-in is not open yet."}
                </div>
              ) : status.data?.needsOnboarding ? (
                <div className="rounded-sm border border-dao-gold/30 bg-dao-gold/10 p-4 text-sm text-dao-warm/80">
                  A DAO passport is required before attendance can be recorded.
                </div>
              ) : (
                <div className="rounded-sm border border-dao-border/60 bg-dao-surface/40 p-4 text-sm text-dao-cool">
                  {authenticated
                    ? "Ready for attendance."
                    : "Sign in with your existing account or create a DAO passport."}
                </div>
              )}

              {latestError && (
                <div
                  role="alert"
                  className="mt-4 rounded-sm border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200"
                >
                  {latestError}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={
                    !ready ||
                    checkIn.isPending ||
                    status.isLoading ||
                    checkInClosed ||
                    (checkedIn && !status.data?.needsOnboarding)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-dao-gold px-5 py-3 text-sm font-semibold uppercase text-dao-charcoal transition-colors hover:bg-dao-gold-light disabled:cursor-not-allowed disabled:bg-dao-border disabled:text-dao-cool/50"
                >
                  {checkIn.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PrimaryIcon
                      className={`h-4 w-4 ${!ready ? "animate-spin" : ""}`}
                    />
                  )}
                  {checkIn.isPending ? "Checking In" : primaryLabel}
                </button>

                {checkedIn ? (
                  <Link
                    href="/passport"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-dao-warm/15 px-5 py-3 text-sm font-semibold uppercase text-dao-warm/75 transition-colors hover:border-dao-gold/70 hover:text-dao-gold"
                  >
                    <Trophy className="h-4 w-4" />
                    View Passport
                  </Link>
                ) : status.data?.needsOnboarding ? (
                  <Link
                    href={onboardingHref()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm border border-dao-warm/15 px-5 py-3 text-sm font-semibold uppercase text-dao-warm/75 transition-colors hover:border-dao-gold/70 hover:text-dao-gold"
                  >
                    <UserPlus className="h-4 w-4" />
                    Onboarding
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
