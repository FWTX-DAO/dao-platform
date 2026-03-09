'use client';

import Link from 'next/link';
import { useMemo, useCallback } from 'react';
import { useDashboardData, type MembershipData } from '@hooks/useDashboard';
import { formatDate } from '@utils/format';
import ActivityFeed from '@components/ActivityFeed';
import { useEntitlements } from '@hooks/useEntitlements';
import { UpgradeCTA } from '@components/UpgradeCTA';
import { PageHeader } from '@components/ui/page-header';
import { Card, CardHeader, CardContent } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { ErrorState } from '@components/ui/error-state';
import { SkeletonStats, SkeletonCard } from '@components/ui/skeleton';
import {
  Users,
  FileText,
  Rocket,
  MessageSquare,
  DollarSign,
  Calendar,
  CheckCircle,
  Plus,
  Sparkles,
} from 'lucide-react';

export function DashboardClient() {
  const { dashboardStats, membershipData, isLoading, isError, refetch } = useDashboardData();
  const { can } = useEntitlements();

  const calculateTenure = useCallback((joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 1) return 'Just joined';
    if (daysDiff === 1) return '1 day';
    if (daysDiff < 30) return `${daysDiff} days`;
    const monthsDiff = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
    if (monthsDiff === 1) return '1 month';
    if (monthsDiff < 12) return `${monthsDiff} months`;
    const years = Math.floor(monthsDiff / 12);
    const remainingMonths = monthsDiff % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }, []);

  const getActivityLevel = useCallback((stats: MembershipData['stats']) => {
    const total = stats.forumPosts + stats.projects + stats.meetingNotes;
    if (total === 0) return { level: 'Getting Started', badge: 'bg-gray-100 text-gray-700', message: 'Start contributing to earn points!' };
    if (total < 5) return { level: 'Active', badge: 'bg-blue-100 text-blue-700', message: 'Keep up the great work!' };
    if (total < 10) return { level: 'Engaged', badge: 'bg-green-100 text-green-700', message: "You're making an impact!" };
    return { level: 'Champion', badge: 'bg-violet-100 text-violet-700', message: 'Outstanding contribution!' };
  }, []);

  const activityLevel = useMemo(
    () => (membershipData ? getActivityLevel(membershipData.stats) : null),
    [membershipData, getActivityLevel]
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Fort Worth TX DAO Overview">
        <UpgradeCTA allowed={can.createProject} feature="create projects">
          <Link
            href="/innovation-lab"
            className="inline-flex items-center px-4 py-2.5 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </UpgradeCTA>
        <Link
          href="/forums"
          className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          Start Discussion
        </Link>
      </PageHeader>

      {isError ? (
        <ErrorState
          title="Failed to load dashboard"
          message="We couldn't load your dashboard data."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <div className="space-y-8">
          <SkeletonStats count={3} />
          <SkeletonCard />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/members" className="bg-white shadow-xs hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
              <div className="flex items-center">
                <div className="p-3 bg-violet-50 rounded-lg">
                  <Users className="h-6 w-6 text-violet-600" />
                </div>
                <dl className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Total Members</dt>
                  <dd className="text-2xl font-bold text-gray-900 tabular-nums">{dashboardStats?.totalUsers || 0}</dd>
                </dl>
              </div>
            </Link>

            <Link href="/innovation-lab" className="bg-white shadow-xs hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
              <div className="flex items-center">
                <div className="p-3 bg-violet-50 rounded-lg">
                  <Rocket className="h-6 w-6 text-violet-600" />
                </div>
                <dl className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Innovation Lab Projects</dt>
                  <dd className="text-2xl font-bold text-gray-900 tabular-nums">{dashboardStats?.totalProjects || 0}</dd>
                </dl>
              </div>
            </Link>

            <Link href="/documents" className="bg-white shadow-xs hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
              <div className="flex items-center">
                <div className="p-3 bg-violet-50 rounded-lg">
                  <FileText className="h-6 w-6 text-violet-600" />
                </div>
                <dl className="ml-4">
                  <dt className="text-sm font-medium text-gray-600">Documents</dt>
                  <dd className="text-2xl font-bold text-gray-900 tabular-nums">{dashboardStats?.totalDocuments || 0}</dd>
                </dl>
              </div>
            </Link>
          </div>

          {/* Membership card */}
          {membershipData && (
            <Card className="border-2 border-violet-100 p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="h-6 w-6 mr-2 text-violet-600" />
                    Your Membership
                  </h2>
                  <p className="mt-1 text-sm font-medium flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${activityLevel?.badge}`}>
                      {activityLevel?.level}
                    </span>
                    <span className="text-gray-500">{activityLevel?.message}</span>
                  </p>
                </div>
                <Link href="/settings" className="text-sm text-violet-600 hover:text-violet-700 font-medium min-h-[44px] inline-flex items-center">
                  Settings &rarr;
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-600">Member Since</dt>
                  <dd className="text-lg font-bold text-gray-900 mt-1" suppressHydrationWarning>{formatDate(membershipData.user.createdAt)}</dd>
                  <dd className="text-xs text-gray-500 mt-0.5">{calculateTenure(membershipData.user.createdAt)}</dd>
                </dl>
                <dl>
                  <dt className="text-sm font-medium text-gray-600">Membership Type</dt>
                  <dd className="text-lg font-bold text-gray-900 mt-1 capitalize">{membershipData.membership.type}</dd>
                </dl>
                <dl>
                  <dt className="text-sm font-medium text-gray-600">Voting Power</dt>
                  <dd className="text-lg font-bold text-gray-900 mt-1 tabular-nums">{membershipData.membership.votingPower}</dd>
                </dl>
                <dl>
                  <dt className="text-sm font-medium text-gray-600">Contribution Points</dt>
                  <dd className="text-lg font-bold text-violet-600 mt-1 flex items-center tabular-nums">
                    {membershipData.membership.contributionPoints}
                    <Sparkles className="h-4 w-4 ml-1" />
                  </dd>
                </dl>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-1">
                  <p className="text-sm font-semibold text-gray-700">Your Activity</p>
                  <p className="text-xs text-gray-500">Contribute more to earn points &amp; increase voting power</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Forum Posts</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{membershipData.stats.forumPosts}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Projects</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{membershipData.stats.projects}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Meeting Notes</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{membershipData.stats.meetingNotes}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Votes Received</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">{membershipData.stats.votesReceived}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* My Active Projects */}
          {dashboardStats?.userActiveProjects && dashboardStats.userActiveProjects.length > 0 && (
            <Card>
              <CardHeader
                title="My Active Projects"
                icon={<Rocket className="h-5 w-5" />}
                action={
                  <Link href="/innovation-lab" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px]">
                    View All &rarr;
                  </Link>
                }
              />
              <CardContent>
                <ul className="space-y-3">
                  {dashboardStats.userActiveProjects.slice(0, 5).map((project: any) => (
                    <li key={project.id}>
                      <Link href={`/innovation-lab/${project.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${project.user_role === 'creator' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                {project.user_role}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              by {project.creator_name || 'Anonymous'} &middot; {project.collaborators} collaborator{project.collaborators !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                {dashboardStats.userActiveProjects.length > 5 && (
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    and {dashboardStats.userActiveProjects.length - 5} more&hellip;
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Community Projects + Forum Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader
                title="Community Projects"
                icon={<Rocket className="h-5 w-5" />}
                action={
                  <Link href="/innovation-lab" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px]">
                    Explore All &rarr;
                  </Link>
                }
              />
              <CardContent>
                {dashboardStats?.activeProjects.length === 0 ? (
                  <EmptyState
                    icon={<Rocket />}
                    title="No active projects yet"
                    description="Be the first to propose a civic innovation project!"
                    action={
                      <UpgradeCTA allowed={can.createProject} feature="create projects">
                        <Link href="/innovation-lab" className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition-colors min-h-[44px]">
                          <Plus className="h-4 w-4 mr-2" />
                          Submit Project
                        </Link>
                      </UpgradeCTA>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {dashboardStats?.activeProjects.slice(0, 5).map((project: any) => (
                      <li key={project.id}>
                        <Link href={`/innovation-lab/${project.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
                          <h3 className="font-medium text-gray-900">{project.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            by {project.creator_name || 'Anonymous'} &middot; {project.collaborators} collaborator{project.collaborators !== 1 ? 's' : ''}
                          </p>
                        </Link>
                      </li>
                    ))}
                    {(dashboardStats?.activeProjects.length ?? 0) > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        and {(dashboardStats?.activeProjects.length ?? 0) - 5} more&hellip;
                      </p>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Latest Forum Activity"
                icon={<MessageSquare className="h-5 w-5" />}
                action={
                  <Link href="/forums" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px]">
                    View All &rarr;
                  </Link>
                }
              />
              <CardContent>
                {dashboardStats?.latestForumPosts.length === 0 ? (
                  <EmptyState
                    icon={<MessageSquare />}
                    title="No discussions yet"
                    description="Start a conversation with the community!"
                    action={
                      <Link href="/forums" className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition-colors min-h-[44px]">
                        <Plus className="h-4 w-4 mr-2" />
                        Start Discussion
                      </Link>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {dashboardStats?.latestForumPosts.map((post: any) => (
                      <li key={post.id}>
                        <Link href={`/forums?post=${post.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
                          <h3 className="font-medium text-gray-900">{post.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {post.category} &middot; {post.author_name || 'Anonymous'} &middot; {post.reply_count} replies &middot; {post.upvotes} votes
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bounties + Meeting Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader
                title="Innovation Bounties"
                icon={<DollarSign className="h-5 w-5" />}
                action={
                  <Link href="/bounties" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px]">
                    Browse All &rarr;
                  </Link>
                }
              />
              <CardContent>
                {dashboardStats?.innovationAssetsRanking.length === 0 ? (
                  <EmptyState
                    icon={<DollarSign />}
                    title="No bounties available"
                    description="Check back soon for funded opportunities to contribute!"
                    action={
                      <Link href="/bounties" className="inline-flex items-center px-4 py-2.5 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition-colors min-h-[44px]">
                        Explore Bounties
                      </Link>
                    }
                  />
                ) : (
                  <ul className="space-y-3">
                    {dashboardStats?.innovationAssetsRanking.map((bounty: any) => (
                      <li key={bounty.id}>
                        <Link href={`/bounties/${bounty.id}`} className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate">{bounty.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {bounty.category} &middot; {bounty.proposalCount} proposal{bounty.proposalCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {bounty.bountyAmount && (
                              <p className="font-bold text-green-600 text-lg tabular-nums ml-2 shrink-0">
                                ${(bounty.bountyAmount / 100).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Latest Meeting Notes"
                icon={<Calendar className="h-5 w-5" />}
                action={
                  <Link href="/meeting-notes" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700 min-h-[44px]">
                    View All &rarr;
                  </Link>
                }
              />
              <CardContent>
                {!dashboardStats?.latestMeetingNote ? (
                  <EmptyState
                    icon={<Calendar />}
                    title="No meeting notes yet"
                    description="Stay tuned for upcoming DAO meetings and summaries"
                    action={
                      <Link href="/meeting-notes" className="inline-flex items-center px-4 py-2.5 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition-colors min-h-[44px]">
                        View Archive
                      </Link>
                    }
                  />
                ) : (
                  <Link href="/meeting-notes" className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden">
                    <h3 className="font-medium text-gray-900 mb-2">{dashboardStats.latestMeetingNote.title}</h3>
                    <p className="text-sm text-gray-600 mb-2" suppressHydrationWarning>{formatDate(dashboardStats.latestMeetingNote.date)}</p>
                    <p className="text-sm text-gray-500 line-clamp-3">{dashboardStats.latestMeetingNote.notes}</p>
                    <p className="text-xs text-gray-400 mt-2">by {dashboardStats.latestMeetingNote.author_name || 'Anonymous'}</p>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          <ActivityFeed variant="platform" limit={5} showHeader />
        </>
      )}
    </div>
  );
}
