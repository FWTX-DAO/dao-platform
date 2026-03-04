'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

interface UpgradeCTAProps {
  allowed: boolean;
  children: React.ReactNode;
  /** Describes what action is gated, e.g. "create projects" */
  feature: string;
  mode?: 'inline' | 'banner';
}

export function UpgradeCTA({ allowed, children, feature, mode = 'inline' }: UpgradeCTAProps) {
  if (allowed) return <>{children}</>;

  if (mode === 'banner') {
    return (
      <div className="rounded-lg border border-dao-gold/20 bg-dao-gold/5 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-dao-gold/60 shrink-0" />
          <div>
            <p className="text-sm font-medium text-dao-warm">
              Membership required to {feature}
            </p>
            <p className="text-xs text-dao-cool/60 mt-0.5">
              Upgrade your plan to unlock this feature.
            </p>
          </div>
        </div>
        <Link
          href="/subscriptions"
          className="shrink-0 px-4 py-2 text-xs font-semibold bg-dao-gold text-dao-charcoal rounded hover:bg-dao-gold-light transition-colors"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  // mode === 'inline': renders a link styled as a locked button
  return (
    <Link
      href="/subscriptions"
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-pointer hover:border-violet-300 hover:text-violet-600 transition-colors group"
      title={`Upgrade to ${feature}`}
    >
      <Lock className="h-4 w-4 group-hover:text-violet-500 transition-colors" />
      <span className="group-hover:text-violet-600 transition-colors">
        Upgrade to {feature}
      </span>
    </Link>
  );
}
