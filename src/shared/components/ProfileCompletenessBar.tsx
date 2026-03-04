import React, { memo } from 'react';

interface ProfileCompletenessBarProps {
  completeness: number;
}

function ProfileCompletenessBar({ completeness }: ProfileCompletenessBarProps) {
  const clamped = Math.max(0, Math.min(100, completeness));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
        <span className="text-sm font-semibold text-violet-600">{clamped}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-violet-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {clamped < 100 && (
        <p className="text-xs text-gray-500 mt-1.5">
          {clamped < 50
            ? 'Add your name, contact info, and skills to improve your profile.'
            : 'Almost there! Fill in remaining fields to complete your profile.'}
        </p>
      )}
    </div>
  );
}

export default memo(ProfileCompletenessBar);
