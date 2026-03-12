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
import { Skeleton } from '@components/ui/skeleton';
import { EmptyState } from '@components/ui/empty-state';

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
  return new Date(dateStr).toLocaleDateString('en-US');
}

function FeedSkeleton() {
  return (
    <div role="status" aria-label="Loading activity" className="space-y-4 py-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 pl-2">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading&hellip;</span>
    </div>
  );
}

interface ActivityFeedProps {
  variant: 'platform' | 'personal';
  limit?: number;
  showHeader?: boolean;
}

function PlatformFeedContent({ limit }: { limit?: number }) {
  const { data: feed, isLoading } = usePlatformFeed(limit);

  if (isLoading) return <FeedSkeleton />;

  if (!feed || feed.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon />}
        title="No activity yet"
        className="py-8"
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />
      <ul className="space-y-4">
        {feed.map((item: PlatformActivity) => {
          const meta = ACTIVITY_META[item.activityType] || { label: item.activityType || 'performed an action', icon: ActivityIcon };
          const Icon = meta.icon;
          return (
            <li key={item.id} className="relative flex items-start gap-3 pl-2">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 shrink-0" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{item.username || 'Anonymous'}</span>{' '}
                  <span className="text-gray-600">{meta.label.toLowerCase()}</span>
                </p>
                <time dateTime={new Date(item.createdAt).toISOString()} className="text-xs text-gray-500 mt-0.5 block" suppressHydrationWarning>
                  {timeAgo(item.createdAt)}
                  {item.pointsAwarded > 0 && (
                    <span className="ml-2 text-violet-600">+{item.pointsAwarded} pts</span>
                  )}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PersonalFeedContent({ limit }: { limit?: number }) {
  const { data: activities, isLoading } = useMyActivities({ limit });

  if (isLoading) return <FeedSkeleton />;

  if (!activities || activities.length === 0) {
    return (
      <EmptyState
        icon={<ActivityIcon />}
        title="No activity yet"
        description="Start contributing to see your activity here"
        className="py-8"
      />
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" aria-hidden="true" />
      <ul className="space-y-4">
        {activities.map((item: Activity) => {
          const meta = ACTIVITY_META[item.activityType] || { label: item.activityType || 'performed an action', icon: ActivityIcon };
          const Icon = meta.icon;
          return (
            <li key={item.id} className="relative flex items-start gap-3 pl-2">
              <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 shrink-0" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm text-gray-900">{meta.label}</p>
                <time dateTime={new Date(item.createdAt).toISOString()} className="text-xs text-gray-500 mt-0.5 block" suppressHydrationWarning>
                  {timeAgo(item.createdAt)}
                  {item.pointsAwarded > 0 && (
                    <span className="ml-2 text-violet-600">+{item.pointsAwarded} pts</span>
                  )}
                </time>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActivityFeed({ variant, limit, showHeader = false }: ActivityFeedProps) {
  return (
    <div className="bg-white shadow-xs border border-gray-100 rounded-lg p-6">
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
