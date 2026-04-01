'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence } from 'framer-motion';
import { getAccessToken } from '@privy-io/react-auth';
import { onboardUser } from '@/app/_actions/users';
import { completeOnboarding } from '@/app/_actions/members';
import IndustrySelect from '@components/IndustrySelect';
import { PassportCreationReveal } from '@components/passport';
import type { PassportData } from '@components/passport';
import { PlanSelector } from './plan-selector';
import { useSubscriptionTiers } from '@shared/hooks/useSubscriptions';

const STEPS = ['Identity', 'Professional', 'Community', 'Membership'] as const;

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  termsAccepted: boolean;
  employer: string;
  jobTitle: string;
  industry: string;
  phone: string;
  availability: string;
  civicInterests: string;
  skills: string;
  city: string;
  state: string;
  zip: string;
}

const INITIAL_FORM: FormData = {
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  termsAccepted: false,
  employer: '',
  jobTitle: '',
  industry: '',
  phone: '',
  availability: '',
  civicInterests: '',
  skills: '',
  city: 'Fort Worth',
  state: 'TX',
  zip: '',
};

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Select availability...' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'occasional', label: 'Occasional' },
];

const inputBase =
  'w-full px-4 py-2.5 bg-dao-surface border border-dao-border rounded-sm text-dao-warm placeholder-dao-cool/40 focus-visible:outline-hidden focus-visible:border-dao-gold/50 focus-visible:ring-1 focus-visible:ring-dao-gold/30 transition text-sm';
const inputError =
  'w-full px-4 py-2.5 bg-dao-surface border border-red-500/50 rounded-sm text-dao-warm placeholder-dao-cool/40 focus-visible:outline-hidden focus-visible:border-red-400 focus-visible:ring-1 focus-visible:ring-red-400/30 transition text-sm';
const labelBase = 'block text-sm text-dao-cool mb-1.5';
const selectBase =
  'w-full px-4 py-2.5 bg-dao-surface border border-dao-border rounded-sm text-dao-warm focus-visible:outline-hidden focus-visible:border-dao-gold/50 focus-visible:ring-1 focus-visible:ring-dao-gold/30 transition text-sm';

function validateUsernameFormat(username: string) {
  if (!username || username.trim().length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
  if (username.length > 30) return { valid: false, error: 'Username must be 30 characters or less' };
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(username))
    return { valid: false, error: 'Must start with a letter or number. Letters, numbers, underscores, hyphens only' };
  return { valid: true, error: null };
}

export function OnboardingForm() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassportReveal, setShowPassportReveal] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const { data: tiers = [] } = useSubscriptionTiers();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!user) return;
    const privyEmail = user.email?.address || (user.google as any)?.email || '';
    if (privyEmail && !formData.email) {
      setFormData((prev) => ({ ...prev, email: privyEmail }));
    }
  }, [user, formData.email]);

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setGlobalError('');
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const usernameVal = validateUsernameFormat(formData.username);
    if (!usernameVal.valid) newErrors.username = usernameVal.error || 'Invalid username';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handlePostOnboarding = async () => {
    if (selectedTierId) {
      // Paid tier selected — redirect to Stripe Checkout
      try {
        const accessToken = await getAccessToken();
        const res = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ tierId: selectedTierId }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        // Checkout returned but no URL — show the error
        console.error('[onboarding] Checkout failed:', data.error || 'No checkout URL returned');
        setGlobalError(data.error || 'Could not start checkout. Redirecting to dashboard.');
      } catch (err) {
        console.error('[onboarding] Checkout request failed:', err);
        setGlobalError('Could not connect to payment service. Redirecting to dashboard.');
      }
    }
    // Small delay so user can see the error before redirect
    await new Promise((r) => setTimeout(r, 2000));
    router.push('/dashboard');
  };

  const handleSubmit = async () => {
    setGlobalError('');
    setIsSubmitting(true);

    try {
      // Step 1: Set username
      const userResult = await onboardUser({
        username: formData.username.trim(),
        bio: null,
      });

      if (!userResult.success) {
        setGlobalError(userResult.error || 'Failed to set username');
        setIsSubmitting(false);
        return;
      }

      // Get wallet address from Privy to sync to DB
      const walletForSync = user?.linkedAccounts?.find(
        (a: any) => a.type === 'wallet' && a.chainType === 'ethereum'
      ) as any;

      // Step 2: Complete onboarding profile
      const onboardingResult = await completeOnboarding({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        termsAccepted: true,
        phone: formData.phone.trim() || undefined,
        employer: formData.employer.trim() || undefined,
        jobTitle: formData.jobTitle.trim() || undefined,
        industry: formData.industry.trim() || undefined,
        availability: formData.availability || undefined,
        civicInterests: formData.civicInterests.trim() || undefined,
        skills: formData.skills.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        zip: formData.zip.trim() || undefined,
        walletAddress: walletForSync?.address || undefined,
      });

      if (!onboardingResult.success) {
        setGlobalError(onboardingResult.error || 'Failed to complete onboarding');
        setIsSubmitting(false);
        return;
      }

      // Build passport data and show reveal
      const walletAccount = user?.linkedAccounts?.find(
        (a: any) => a.type === 'wallet'
      ) as any;

      setPassportData({
        avatarUrl: null,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        memberId: userResult.data.memberId || 'PENDING',
        membershipType: selectedTierId ? 'member' : 'observer',
        joinedAt: new Date().toISOString(),
        contributionPoints: 0,
        votingPower: 0,
        skills: formData.skills || null,
        civicInterests: formData.civicInterests || null,
        city: formData.city || null,
        state: formData.state || null,
        walletAddress: walletAccount?.address || null,
        tierDisplayName: selectedTierId
          ? tiers.find((t) => t.id === selectedTierId)?.displayName || 'Member'
          : 'Observer',
        roleNames: [selectedTierId ? 'member' : 'guest'],
      });
      setShowPassportReveal(true);
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!ready || !authenticated) return null;

  const isEmailFromPrivy =
    !!formData.email &&
    (formData.email === user?.email?.address || formData.email === (user?.google as any)?.email);

  return (
    <>
    <AnimatePresence>
      {showPassportReveal && passportData && (
        <PassportCreationReveal
          data={passportData}
          onComplete={handlePostOnboarding}
        />
      )}
    </AnimatePresence>
    <main className="relative min-h-screen bg-dao-charcoal overflow-hidden selection:bg-dao-gold/30 selection:text-dao-warm">
      <div className="absolute inset-0 pointer-events-none">
        <style>{`
          .grid-bg {
            background-image: linear-gradient(rgba(196, 150, 58, 0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(196, 150, 58, 0.04) 1px, transparent 1px);
            background-size: 60px 60px;
          }
        `}</style>
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-dao-charcoal/60" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="flex items-center gap-3 px-6 md:px-12 pt-6 md:pt-8">
          <img src="/logo.svg" alt="Fort Worth DAO" width={28} height={28} className="h-7 w-7 opacity-60" />
          <span className="text-dao-warm/40 text-[11px] tracking-[0.25em] uppercase font-semibold">
            Fort Worth DAO
          </span>
        </header>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 md:py-12">
          <div
            className="w-full max-w-2xl transition-opacity duration-700 ease-out"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            <div className="bg-dao-dark/80 backdrop-blur-xs border border-dao-border/60 rounded-lg p-6 sm:p-8 md:p-10">
              <div className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl text-dao-warm mb-2">Join the DAO</h1>
                <p className="text-sm text-dao-cool/60">Complete your profile to become a member</p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center mb-8">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300 ${
                          i < step
                            ? 'bg-dao-gold text-dao-charcoal'
                            : i === step
                              ? 'border-2 border-dao-gold text-dao-gold'
                              : 'border border-dao-border text-dao-cool/40'
                        }`}
                      >
                        {i < step ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1.5 tracking-wide uppercase ${
                          i === step ? 'text-dao-gold' : i < step ? 'text-dao-cool/60' : 'text-dao-cool/30'
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-3 mb-5 transition-colors duration-300 ${
                          i < step ? 'bg-dao-gold/40' : 'bg-dao-border'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Identity */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label htmlFor="username" className={labelBase}>
                      Username <span className="text-dao-gold/70">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      autoComplete="username"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      placeholder="e.g., civicbuilder"
                      className={errors.username ? inputError : inputBase}
                      maxLength={30}
                    />
                    {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username}</p>}
                    <p className="mt-1 text-[11px] text-dao-cool/40">3-30 characters. Letters, numbers, underscores, hyphens.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className={labelBase}>
                        First Name <span className="text-dao-gold/70">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        autoComplete="given-name"
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className={errors.firstName ? inputError : inputBase}
                      />
                      {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelBase}>
                        Last Name <span className="text-dao-gold/70">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        autoComplete="family-name"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className={errors.lastName ? inputError : inputBase}
                      />
                      {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className={labelBase}>
                      Email <span className="text-dao-gold/70">*</span>
                      {isEmailFromPrivy && (
                        <span className="ml-2 text-[10px] tracking-wider uppercase text-dao-gold/60 bg-dao-gold/10 px-2 py-0.5 rounded-sm">
                          verified
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={errors.email ? inputError : inputBase}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                  </div>

                  <div className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateField('termsAccepted', e.target.checked)}
                      className="mt-0.5 rounded-sm border-dao-border bg-dao-surface text-dao-gold focus:ring-dao-gold/30 focus:ring-offset-0"
                    />
                    <label htmlFor="terms" className="text-sm text-dao-cool/70">
                      I accept the{' '}
                      <a
                        href="https://constitution.fwtx.city"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dao-gold/80 hover:text-dao-gold underline underline-offset-2 transition-colors"
                      >
                        DAO Constitution &amp; Terms
                      </a>{' '}
                      <span className="text-dao-gold/70">*</span>
                    </label>
                  </div>
                  {errors.termsAccepted && <p className="text-xs text-red-400">{errors.termsAccepted}</p>}
                </div>
              )}

              {/* Step 2: Professional */}
              {step === 1 && (
                <div className="space-y-5">
                  <p className="text-sm text-dao-cool/50 mb-1">All fields are optional. You can update these later in your profile.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="employer" className={labelBase}>Employer</label>
                      <input type="text" id="employer" name="employer" autoComplete="organization" value={formData.employer} onChange={(e) => updateField('employer', e.target.value)} className={inputBase} />
                    </div>
                    <div>
                      <label htmlFor="jobTitle" className={labelBase}>Job Title</label>
                      <input type="text" id="jobTitle" name="jobTitle" autoComplete="organization-title" value={formData.jobTitle} onChange={(e) => updateField('jobTitle', e.target.value)} className={inputBase} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="industry" className={labelBase}>Industry (NAICS)</label>
                    <IndustrySelect value={formData.industry} onChange={(code) => updateField('industry', code)} variant="dark" />
                    <p className="mt-1 text-[11px] text-dao-cool/40">Type to search or browse by name, sector, or code</p>
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelBase}>Phone</label>
                    <input type="tel" id="phone" name="phone" autoComplete="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputBase} />
                  </div>
                  <div>
                    <label htmlFor="availability" className={labelBase}>Availability</label>
                    <select id="availability" name="availability" value={formData.availability} onChange={(e) => updateField('availability', e.target.value)} className={selectBase}>
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Community */}
              {step === 2 && (
                <div className="space-y-5">
                  <p className="text-sm text-dao-cool/50 mb-1">Help us connect you with the right initiatives.</p>
                  <div>
                    <label htmlFor="civicInterests" className={labelBase}>Civic Interests</label>
                    <textarea
                      id="civicInterests"
                      name="civicInterests"
                      value={formData.civicInterests}
                      onChange={(e) => updateField('civicInterests', e.target.value)}
                      placeholder="e.g., urban planning, education, public safety"
                      rows={3}
                      className={`${inputBase} resize-none`}
                    />
                    <p className="text-[11px] text-dao-cool/40 mt-1">Comma-separated list of interests</p>
                  </div>
                  <div>
                    <label htmlFor="skills" className={labelBase}>Skills</label>
                    <textarea
                      id="skills"
                      name="skills"
                      value={formData.skills}
                      onChange={(e) => updateField('skills', e.target.value)}
                      placeholder="e.g., web development, project management, data analysis"
                      rows={3}
                      className={`${inputBase} resize-none`}
                    />
                    <p className="text-[11px] text-dao-cool/40 mt-1">Comma-separated list of skills</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className={labelBase}>City</label>
                      <input type="text" id="city" name="city" autoComplete="address-level2" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className={inputBase} />
                    </div>
                    <div>
                      <label htmlFor="state" className={labelBase}>State</label>
                      <input type="text" id="state" name="state" autoComplete="address-level1" value={formData.state} onChange={(e) => updateField('state', e.target.value)} maxLength={2} className={inputBase} />
                    </div>
                    <div>
                      <label htmlFor="zip" className={labelBase}>ZIP</label>
                      <input type="text" id="zip" name="zip" autoComplete="postal-code" value={formData.zip} onChange={(e) => updateField('zip', e.target.value)} maxLength={10} className={inputBase} />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Membership */}
              {step === 3 && (
                <PlanSelector selectedTierId={selectedTierId} onSelect={setSelectedTierId} />
              )}

              {globalError && (
                <div role="alert" className="mt-5 p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
                  <p className="text-sm text-red-400">{globalError}</p>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-dao-border/40">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="px-6 py-2.5 text-sm text-dao-cool/60 hover:text-dao-warm border border-dao-border hover:border-dao-warm/20 rounded-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-dao-cool/60 disabled:hover:border-dao-border"
                >
                  Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="group px-6 py-2.5 bg-dao-gold hover:bg-dao-gold-light text-dao-charcoal text-sm font-semibold rounded-sm transition-colors active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <span className="inline-block ml-1.5 transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-dao-gold hover:bg-dao-gold-light disabled:bg-dao-border disabled:text-dao-cool/40 disabled:cursor-not-allowed text-dao-charcoal text-sm font-semibold rounded-sm transition-colors active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin motion-reduce:animate-none -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Completing{'…'}
                      </span>
                    ) : selectedTierId ? (
                      'Join DAO & Subscribe'
                    ) : (
                      'Complete & Join DAO'
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="https://constitution.fwtx.city"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-dao-gold/40 hover:text-dao-gold/70 tracking-wide transition-colors"
              >
                Read our Constitution
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}
