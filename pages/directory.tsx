import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useMemberDirectory } from '@shared/hooks/useMemberDirectory';
import AppLayout from '@components/AppLayout';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  MapPinIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All availability' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'occasional', label: 'Occasional' },
];

export default function DirectoryPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [availability, setAvailability] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filters = {
    search: debouncedSearch || undefined,
    city: city || undefined,
    industry: industry || undefined,
    availability: availability || undefined,
  };

  const { data: members, isLoading } = useMemberDirectory(filters);

  useEffect(() => {
    if (ready && !authenticated) router.push('/');
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  const hasFilters = searchTerm || city || industry || availability;

  const clearFilters = () => {
    setSearchTerm('');
    setCity('');
    setIndustry('');
    setAvailability('');
  };

  return (
    <AppLayout title="Member Directory - Fort Worth TX DAO">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Member Directory</h1>
          <p className="text-gray-600 mt-1">Connect with fellow DAO members</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, username, skills..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm"
              />
            </div>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm w-full md:w-36"
            />
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Industry"
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm w-full md:w-36"
            />
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition text-sm w-full md:w-40"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition"
              >
                <XMarkIcon className="h-4 w-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
          </div>
        ) : !members || members.length === 0 ? (
          <div className="text-center py-16">
            <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No members found</p>
            {hasFilters && (
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member) => {
              const displayName = [member.firstName, member.lastName].filter(Boolean).join(' ') || member.username || 'Member';
              return (
                <div
                  key={member.id}
                  className="bg-white shadow-sm border border-gray-100 rounded-lg p-5 hover:shadow-md hover:border-violet-200 transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                      <UserCircleIcon className="h-7 w-7 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                      {member.username && (
                        <p className="text-sm text-gray-500 truncate">@{member.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    {member.jobTitle && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <BriefcaseIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{member.jobTitle}</span>
                      </div>
                    )}
                    {(member.city || member.industry) && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPinIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {[member.city, member.industry].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    {member.availability && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        {member.availability}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-violet-600 font-medium ml-auto">
                      <SparklesIcon className="h-3.5 w-3.5" />
                      {member.contributionPoints} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
