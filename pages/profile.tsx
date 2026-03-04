import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useProfile, useUpdateProfile } from '@shared/hooks/useProfile';
import { useActiveSubscription } from '@shared/hooks/useSubscriptions';
import AppLayout from '@components/AppLayout';
import ActivityFeed from '@components/ActivityFeed';
import ProfileCompletenessBar from '@components/ProfileCompletenessBar';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import IndustrySelect from '@components/IndustrySelect';
import { getNaicsLabel } from '@shared/constants/naics';
import type { UpdateProfileInput } from '@shared/hooks/useProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { data: profile, isLoading } = useProfile();
  const { data: subscription } = useActiveSubscription();
  const updateProfile = useUpdateProfile();

  const [editSection, setEditSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateProfileInput>({});
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  if (isLoading) {
    return (
      <AppLayout title="Profile - Fort Worth TX DAO">
        <div className="py-16 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout title="Profile - Fort Worth TX DAO">
        <div className="text-center py-16 text-gray-500">Profile not found</div>
      </AppLayout>
    );
  }

  const startEdit = (section: string) => {
    setEditSection(section);
    setSaveError('');
    setEditData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      employer: profile.employer || '',
      jobTitle: profile.jobTitle || '',
      industry: profile.industry || '',
      civicInterests: profile.civicInterests || '',
      skills: profile.skills || '',
      availability: profile.availability || '',
      city: profile.city || '',
      state: profile.state || '',
      zip: profile.zip || '',
      linkedinUrl: profile.linkedinUrl || '',
      twitterUrl: profile.twitterUrl || '',
      githubUrl: profile.githubUrl || '',
      websiteUrl: profile.websiteUrl || '',
    });
  };

  const handleSave = async () => {
    setSaveError('');
    try {
      await updateProfile.mutateAsync(editData);
      setEditSection(null);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save');
    }
  };

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'Member';
  const memberSince = profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  return (
    <AppLayout title="Profile - Fort Worth TX DAO">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
              <UserCircleIcon className="h-10 w-10 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{fullName}</h1>
              {profile.username && (
                <p className="text-gray-500">@{profile.username}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {memberSince && <span>Member since {memberSince}</span>}
                <span className="inline-flex items-center gap-1 text-violet-600 font-medium">
                  <SparklesIcon className="h-4 w-4" />
                  {profile.contributionPoints} pts
                </span>
                {profile.tierDisplayName && (
                  <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {profile.tierDisplayName}
                  </span>
                )}
              </div>
              {profile.roleNames?.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {profile.roleNames.map((role) => (
                    <span key={role} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <ProfileCompletenessBar completeness={profile.profileCompleteness} />
        </div>

        {/* Personal Information */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            {editSection !== 'personal' ? (
              <button onClick={() => startEdit('personal')} className="text-violet-600 hover:text-violet-700 text-sm font-medium inline-flex items-center gap-1">
                <PencilIcon className="h-4 w-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={updateProfile.isPending} className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" /> Save
                </button>
                <button onClick={() => setEditSection(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center gap-1">
                  <XMarkIcon className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>
          {saveError && editSection === 'personal' && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">{saveError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editSection === 'personal' ? (
              <>
                <Field label="First Name" value={editData.firstName || ''} onChange={(v) => setEditData({ ...editData, firstName: v })} />
                <Field label="Last Name" value={editData.lastName || ''} onChange={(v) => setEditData({ ...editData, lastName: v })} />
                <Field label="Email" value={editData.email || ''} onChange={(v) => setEditData({ ...editData, email: v })} type="email" />
                <Field label="Phone" value={editData.phone || ''} onChange={(v) => setEditData({ ...editData, phone: v })} type="tel" />
                <Field label="City" value={editData.city || ''} onChange={(v) => setEditData({ ...editData, city: v })} />
                <Field label="State" value={editData.state || ''} onChange={(v) => setEditData({ ...editData, state: v })} />
                <Field label="ZIP" value={editData.zip || ''} onChange={(v) => setEditData({ ...editData, zip: v })} />
              </>
            ) : (
              <>
                <InfoItem label="First Name" value={profile.firstName} />
                <InfoItem label="Last Name" value={profile.lastName} />
                <InfoItem label="Email" value={profile.email} />
                <InfoItem label="Phone" value={profile.phone} />
                <InfoItem label="City" value={profile.city} />
                <InfoItem label="State" value={profile.state} />
                <InfoItem label="ZIP" value={profile.zip} />
              </>
            )}
          </div>
        </div>

        {/* Professional Information */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Professional</h2>
            {editSection !== 'professional' ? (
              <button onClick={() => startEdit('professional')} className="text-violet-600 hover:text-violet-700 text-sm font-medium inline-flex items-center gap-1">
                <PencilIcon className="h-4 w-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={updateProfile.isPending} className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" /> Save
                </button>
                <button onClick={() => setEditSection(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center gap-1">
                  <XMarkIcon className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editSection === 'professional' ? (
              <>
                <Field label="Employer" value={editData.employer || ''} onChange={(v) => setEditData({ ...editData, employer: v })} />
                <Field label="Job Title" value={editData.jobTitle || ''} onChange={(v) => setEditData({ ...editData, jobTitle: v })} />
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Industry</label>
                  <IndustrySelect
                    value={editData.industry || ''}
                    onChange={(code) => setEditData({ ...editData, industry: code })}
                  />
                </div>
                <Field label="Availability" value={editData.availability || ''} onChange={(v) => setEditData({ ...editData, availability: v })} />
                <div className="md:col-span-2">
                  <Field label="Skills" value={editData.skills || ''} onChange={(v) => setEditData({ ...editData, skills: v })} />
                </div>
                <div className="md:col-span-2">
                  <Field label="Civic Interests" value={editData.civicInterests || ''} onChange={(v) => setEditData({ ...editData, civicInterests: v })} />
                </div>
              </>
            ) : (
              <>
                <InfoItem label="Employer" value={profile.employer} />
                <InfoItem label="Job Title" value={profile.jobTitle} />
                <InfoItem label="Industry" value={profile.industry ? getNaicsLabel(profile.industry) : null} />
                <InfoItem label="Availability" value={profile.availability} />
                <div className="md:col-span-2">
                  <InfoItem label="Skills" value={profile.skills} />
                </div>
                <div className="md:col-span-2">
                  <InfoItem label="Civic Interests" value={profile.civicInterests} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
          {subscription ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {profile.tierDisplayName || 'Active Plan'}
                </p>
                <p className="text-sm text-gray-500">Status: {subscription.status}</p>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-gray-500">
                    Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => router.push('/subscriptions')}
                className="px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition"
              >
                Manage
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Free Plan</p>
              <button
                onClick={() => router.push('/subscriptions')}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition"
              >
                Upgrade
              </button>
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Social Links</h2>
            {editSection !== 'social' ? (
              <button onClick={() => startEdit('social')} className="text-violet-600 hover:text-violet-700 text-sm font-medium inline-flex items-center gap-1">
                <PencilIcon className="h-4 w-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={updateProfile.isPending} className="text-green-600 hover:text-green-700 text-sm font-medium inline-flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" /> Save
                </button>
                <button onClick={() => setEditSection(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium inline-flex items-center gap-1">
                  <XMarkIcon className="h-4 w-4" /> Cancel
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editSection === 'social' ? (
              <>
                <Field label="LinkedIn URL" value={editData.linkedinUrl || ''} onChange={(v) => setEditData({ ...editData, linkedinUrl: v })} />
                <Field label="Twitter URL" value={editData.twitterUrl || ''} onChange={(v) => setEditData({ ...editData, twitterUrl: v })} />
                <Field label="GitHub URL" value={editData.githubUrl || ''} onChange={(v) => setEditData({ ...editData, githubUrl: v })} />
                <Field label="Website URL" value={editData.websiteUrl || ''} onChange={(v) => setEditData({ ...editData, websiteUrl: v })} />
              </>
            ) : (
              <>
                <SocialLink label="LinkedIn" url={profile.linkedinUrl} />
                <SocialLink label="Twitter" url={profile.twitterUrl} />
                <SocialLink label="GitHub" url={profile.githubUrl} />
                <SocialLink label="Website" url={profile.websiteUrl} />
              </>
            )}
          </div>
        </div>

        {/* Activity */}
        <ActivityFeed variant="personal" limit={10} showHeader />
      </div>
    </AppLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  );
}

function SocialLink({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm">
        {url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
            <LinkIcon className="h-3.5 w-3.5" /> {url.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </dd>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm"
      />
    </div>
  );
}
