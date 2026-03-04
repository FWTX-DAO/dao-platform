import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getAccessToken, usePrivy } from '@privy-io/react-auth';
import Head from 'next/head';
import Portal from '@components/graphics/portal';
import { validateUsernameFormat } from '@utils/onboarding';
import { useCompleteOnboarding } from '@shared/hooks/useOnboarding';
import { CheckIcon } from '@heroicons/react/24/solid';

const STEPS = ['Identity', 'Professional', 'Community'];

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

const NAICS_SECTORS = [
  { value: '', label: 'Select industry...' },
  { value: '11', label: '11 - Agriculture, Forestry, Fishing & Hunting' },
  { value: '21', label: '21 - Mining, Quarrying & Oil/Gas Extraction' },
  { value: '22', label: '22 - Utilities' },
  { value: '23', label: '23 - Construction' },
  { value: '31-33', label: '31-33 - Manufacturing' },
  { value: '42', label: '42 - Wholesale Trade' },
  { value: '44-45', label: '44-45 - Retail Trade' },
  { value: '48-49', label: '48-49 - Transportation & Warehousing' },
  { value: '51', label: '51 - Information' },
  { value: '52', label: '52 - Finance & Insurance' },
  { value: '53', label: '53 - Real Estate & Rental/Leasing' },
  { value: '54', label: '54 - Professional, Scientific & Technical Services' },
  { value: '55', label: '55 - Management of Companies & Enterprises' },
  { value: '56', label: '56 - Administrative & Waste Management Services' },
  { value: '61', label: '61 - Educational Services' },
  { value: '62', label: '62 - Health Care & Social Assistance' },
  { value: '71', label: '71 - Arts, Entertainment & Recreation' },
  { value: '72', label: '72 - Accommodation & Food Services' },
  { value: '81', label: '81 - Other Services (except Public Admin)' },
  { value: '92', label: '92 - Public Administration' },
];

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Select availability...' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'occasional', label: 'Occasional' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeOnboarding = useCompleteOnboarding();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

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
    if (!usernameVal.valid) {
      newErrors.username = usernameVal.error || 'Invalid username';
    }

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email address';
    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    setGlobalError('');
    setIsSubmitting(true);

    try {
      // Step 1: Set username via existing onboard endpoint
      const accessToken = await getAccessToken();
      const usernameRes = await fetch('/api/users/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          bio: null,
        }),
      });

      if (!usernameRes.ok) {
        const data = await usernameRes.json().catch(() => ({}));
        setGlobalError(data.error || 'Failed to set username');
        setIsSubmitting(false);
        return;
      }

      // Step 2: Complete onboarding with profile data
      await completeOnboarding.mutateAsync({
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
      });

      router.push('/dashboard');
    } catch (err: any) {
      setGlobalError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!ready || !authenticated) return null;

  return (
    <>
      <Head>
        <title>Welcome to Fort Worth TX DAO</title>
      </Head>

      <main className="relative flex min-h-screen min-w-full overflow-hidden bg-gradient-to-br from-violet-50 via-white to-blue-50">
        {/* Cybernetic Animation Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(180deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.5; }
            }
            .cyber-grid {
              position: absolute;
              width: 100%;
              height: 100%;
              background-image:
                linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
              background-size: 50px 50px;
              animation: float 20s ease-in-out infinite;
            }
            .cyber-particle {
              position: absolute;
              width: 4px;
              height: 4px;
              background: radial-gradient(circle, rgba(139, 92, 246, 0.6), transparent);
              border-radius: 50%;
              animation: pulse 3s ease-in-out infinite;
            }
          `}</style>
          <div className="cyber-grid" />
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="cyber-particle"
              style={{
                left: `${10 + (i * 6) % 90}%`,
                top: `${5 + (i * 7) % 90}%`,
                animationDelay: `${(i * 0.3) % 3}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-1 p-6 justify-center items-center">
          <div className="max-w-2xl w-full">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 md:p-12 border border-violet-100">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24">
                    <Portal style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Welcome to Fort Worth TX DAO
                </h1>
                <p className="text-sm text-gray-500">
                  Complete your profile to join our community
                </p>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-8">
                {STEPS.map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                          i <= step
                            ? 'bg-violet-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={`text-xs mt-1 ${i === step ? 'text-violet-600 font-medium' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 mb-4 ${i < step ? 'bg-violet-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Identity */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      placeholder="e.g., civicbuilder"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${
                        errors.username ? 'border-red-500' : 'border-gray-300'
                      }`}
                      maxLength={30}
                    />
                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                    <p className="mt-1 text-xs text-gray-500">3-30 characters, letters, numbers, underscores, hyphens.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateField('firstName', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateField('lastName', e.target.value)}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${
                          errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.termsAccepted}
                      onChange={(e) => updateField('termsAccepted', e.target.checked)}
                      className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      I accept the{' '}
                      <a
                        href="https://constitution.fwtx.city"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet-600 hover:text-violet-700 underline"
                      >
                        DAO Constitution & Terms
                      </a>{' '}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                  {errors.termsAccepted && <p className="text-sm text-red-600">{errors.termsAccepted}</p>}
                </div>
              )}

              {/* Step 2: Professional */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">All fields are optional. You can update these later.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employer</label>
                      <input
                        type="text"
                        value={formData.employer}
                        onChange={(e) => updateField('employer', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={(e) => updateField('jobTitle', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                      <select
                        value={formData.industry}
                        onChange={(e) => updateField('industry', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      >
                        {NAICS_SECTORS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <select
                      value={formData.availability}
                      onChange={(e) => updateField('availability', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Community */}
              {step === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">Help us connect you with the right initiatives.</p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Civic Interests</label>
                    <textarea
                      value={formData.civicInterests}
                      onChange={(e) => updateField('civicInterests', e.target.value)}
                      placeholder="e.g., urban planning, education, public safety"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated list of interests</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                    <textarea
                      value={formData.skills}
                      onChange={(e) => updateField('skills', e.target.value)}
                      placeholder="e.g., web development, project management, data analysis"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated list of skills</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => updateField('city', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => updateField('state', e.target.value)}
                        maxLength={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                      <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => updateField('zip', e.target.value)}
                        maxLength={10}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {globalError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{globalError}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium"
                >
                  Back
                </button>

                {step < STEPS.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition text-sm font-medium"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition text-sm font-medium"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Completing...
                      </span>
                    ) : (
                      'Complete Profile & Join DAO'
                    )}
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <a
                  href="https://constitution.fwtx.city"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Read our Constitution →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
