'use client';

import React, { memo } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Rocket,
  UserPlus,
  Trophy,
  FileText,
  Calendar,
  Upload,
  Share2,
  LogIn,
  UserCog,
  Shield,
  CreditCard,
  MessageCircle,
  Activity as ActivityIcon,
} from 'lucide-react';
import { usePlatformFeed, useMyActivities } from '@shared/hooks/useActivities';
import type { PlatformActivity, Activity } from '@shared/hooks/useActivities';

const ACTIVITY_META: Record<string, { label: string; icon: React.ElementType }> = {
  forum_post: { label: 'Created a forum post', icon: MessageSquare },
  forum_vote: { label: 'Voted on a post', icon: ThumbsUp },
  project_created: { label: 'Created a project', icon: Rocket },
  project_joined: { label: 'Joined a project', icon: UserPlus },
  bounty_submitted: { label: 'Submitted a bounty', icon: Trophy },
  bounty_proposal: { label: 'Submitted a proposal', icon: FileText },
  meeting_created: { label: 'Created meeting notes', icon: Calendar },
  document_uploaded: { label: 'Uploaded a document', icon: Upload },
  document_shared: { label: 'Shared a document', icon: Share2 },
  comment_posted: { label: 'Posted a comment', icon: MessageCircle },
  login: { label: 'Logged in', icon: LogIn },
  profile_updated: { label: 'Updated profile', icon: UserCog },
  role_granted: { label: 'Received a role', icon: Shield },
  subscription_created: { label: 'Started a subscription', icon: CreditCard },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface ActivityFeedProps {
  variant: 'platform' | 'personal';
  limit?: number;
  showHeader?: boolean;
}

function PlatformFeedContent({ limit }: { limit?: number }) {
  const { data: feed, isLoading } = usePlatformFeed(limit);

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!feed || feed.length === 0) {
    return (
      <div className="text-center py-8">
        <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {feed.map((item: PlatformActivity) => {
          const meta = ACTIVITY_META[item.activityType] || { label: item.activityType, icon: ActivityIcon };
          const Icon = meta.icon;
          return (
            <div key={item.id} className="relative flex items-start gap-3 pl-2">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{item.username || 'Anonymous'}</span>{' '}
                  <span className="text-gray-600">{meta.label.toLowerCase()}</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {timeAgo(item.createdAt)}
                  {item.pointsAwarded > 0 && (
                    <span className="ml-2 text-violet-600">+{item.pointsAwarded} pts</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PersonalFeedContent({ limit }: { limit?: number }) {
  const { data: activities, isLoading } = useMyActivities({ limit });

  if (isLoading) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <ActivityIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No activity yet</p>
        <p className="text-gray-400 text-sm mt-1">Start contributing to see your activity here</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
      <div className="space-y-4">
        {activities.map((item: Activity) => {
          const meta = ACTIVITY_META[item.activityType] || { label: item.activityType, icon: ActivityIcon };
          const Icon = meta.icon;
          return (
            <div key={item.id} className="relative flex items-start gap-3 pl-2">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900">{meta.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {timeAgo(item.createdAt)}
                  {item.pointsAwarded > 0 && (
                    <span className="ml-2 text-violet-600">+{item.pointsAwarded} pts</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed({ variant, limit, showHeader = false }: ActivityFeedProps) {
  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
      {showHeader && (
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {variant === 'platform' ? 'Platform Activity' : 'Your Activity'}
        </h2>
      )}
      {variant === 'platform' ? (
        <PlatformFeedContent limit={limit} />
      ) : (
        <PersonalFeedContent limit={limit} />
      )}
    </div>
  );
}

export default memo(ActivityFeed);
