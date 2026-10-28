"use client";

import { useCallback, useState } from "react";
import {
  Briefcase,
  Check,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/ui/sheet";
import {
  TALENT_OPTION_LABELS,
  type TalentProfile,
} from "@services/talent/types";
import {
  formatTalentDate,
  safeHttpUrl,
  TalentStatusBadge,
} from "./talent-format";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-5 border-b border-gray-100 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Chips({ values }: { values: string[] }) {
  if (values.length === 0)
    return <p className="text-sm text-gray-400">None provided</p>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li
          key={value}
          className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700"
        >
          {TALENT_OPTION_LABELS[value] ?? value}
        </li>
      ))}
    </ul>
  );
}

function Answer({ value }: { value: string | null }) {
  return value ? (
    <p className="text-sm text-gray-700 whitespace-pre-line break-words">
      {value}
    </p>
  ) : (
    <p className="text-sm text-gray-400">No answer</p>
  );
}

interface TalentDetailSheetProps {
  profile: TalentProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TalentDetailSheet({
  profile,
  open,
  onOpenChange,
}: TalentDetailSheetProps) {
  const [copied, setCopied] = useState(false);

  const email = profile?.email;
  const copyEmail = useCallback(() => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [email]);

  if (!profile) return null;

  const links = [
    { label: "LinkedIn", value: profile.linkedinUrl },
    { label: "GitHub", value: profile.githubUrl },
    { label: "X", value: profile.xUrl },
    { label: "Instagram", value: profile.instagramUrl },
    { label: "Portfolio", value: profile.portfolioUrl },
    ...profile.otherSocialUrls.map((value) => ({ label: "Other", value })),
  ].filter((link) => link.value);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto bg-white"
      >
        <SheetHeader className="text-left pb-5 border-b border-gray-100 pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="text-xl text-gray-900">
              {profile.fullName}
            </SheetTitle>
            <TalentStatusBadge status={profile.status} />
          </div>
          <SheetDescription className="space-y-1.5 text-gray-600">
            <span className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
              <span className="break-words">{profile.currentWork}</span>
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              {profile.location}
            </span>
          </SheetDescription>
        </SheetHeader>

        <Section title="Contact">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-gray-400" />
              <a
                href={`mailto:${profile.email}`}
                className="text-violet-700 hover:underline break-all"
              >
                {profile.email}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                aria-label={copied ? "Email copied" : "Copy email"}
                className="p-1 rounded-sm text-gray-400 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                <a
                  href={`tel:${profile.phone.replace(/[^\d+]/g, "")}`}
                  className="text-violet-700 hover:underline"
                >
                  {profile.phone}
                </a>
              </div>
            )}
          </div>
        </Section>

        <Section title="Links">
          {links.length === 0 ? (
            <p className="text-sm text-gray-400">None provided</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {links.map(({ label, value }) => {
                const href = safeHttpUrl(value);
                return (
                  <li key={`${label}-${value}`}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {label}
                      </a>
                    ) : (
                      <span className="inline-flex px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs text-gray-500 break-all">
                        {label}: {value}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Skills">
          <Chips values={profile.skills} />
        </Section>

        <Section title="Open to">
          <Chips values={profile.opportunityInterests} />
        </Section>

        <Section title="Work preferences">
          <Chips values={profile.workPreferences} />
        </Section>

        <Section title="What they want to build">
          <Answer value={profile.whatDoYouWantToBuild} />
        </Section>

        <Section title="Where they see themselves in 25 years">
          <Answer value={profile.vision25Years} />
        </Section>

        <Section title="Anything else">
          <Answer value={profile.anythingElse} />
        </Section>

        <Section title="Record">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-gray-500">Submitted</dt>
            <dd className="text-gray-900 tabular-nums">
              {formatTalentDate(profile.createdAt, true)}
            </dd>
            <dt className="text-gray-500">Updated</dt>
            <dd className="text-gray-900 tabular-nums">
              {formatTalentDate(profile.updatedAt, true)}
            </dd>
            <dt className="text-gray-500">Consented</dt>
            <dd className="text-gray-900 tabular-nums">
              {formatTalentDate(profile.consentedAt, true)}
            </dd>
            <dt className="text-gray-500">Source</dt>
            <dd className="text-gray-900">{profile.source}</dd>
            <dt className="text-gray-500">ID</dt>
            <dd className="text-gray-500 font-mono text-xs break-all">
              {profile.id}
            </dd>
          </dl>
        </Section>
      </SheetContent>
    </Sheet>
  );
}
