'use client';

import { useMemberDirectory } from '@hooks/useMemberDirectory';
import { useState } from 'react';

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [availability, setAvailability] = useState('');

  const { data: members = [], isLoading } = useMemberDirectory({
    search: search || undefined,
    city: city || undefined,
    industry: industry || undefined,
    availability: availability || undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Member Directory</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          name="search"
          aria-label="Search members"
          autoComplete="off"
          className="rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
        />
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          name="city"
          aria-label="Filter by city"
          autoComplete="off"
          className="rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
        />
        <input
          type="text"
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          name="industry"
          aria-label="Filter by industry"
          autoComplete="off"
          className="rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
        />
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          name="sort"
          aria-label="Sort by"
          autoComplete="off"
          className="rounded-md border border-gray-300 px-3 py-2 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-none"
        >
          <option value="">All Availability</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="volunteer">Volunteer</option>
          <option value="occasional">Occasional</option>
        </select>
      </div>
      {isLoading ? (
        <div className="py-8 text-center text-gray-500">Loading…</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No members found matching your criteria.</div>
      ) : (
        <div className="space-y-4">
          {members.map((member: any) => (
            <div key={member.id} className="bg-white shadow rounded-lg p-6">
              <h3 className="font-semibold text-gray-900">{member.username || member.firstName}</h3>
              {member.jobTitle && <p className="text-sm text-gray-600">{member.jobTitle}{member.employer ? ` at ${member.employer}` : ''}</p>}
              {member.city && <p className="text-xs text-gray-500 mt-1">{member.city}, {member.state}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
