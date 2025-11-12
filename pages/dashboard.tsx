import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import AppLayout from "@components/AppLayout";
import { needsOnboarding } from "@utils/onboarding";
import { 
  UsersIcon, 
  DocumentTextIcon, 
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface DashboardStats {
  totalUsers: number;
  totalDocuments: number;
  totalProjects: number;
  activeProjects: Array<{
    id: string;
    title: string;
    status: string;
    creator_name: string | null;
    created_at: string;
    updated_at: string;
    collaborators: number;
  }>;
  userActiveProjects: Array<{
    id: string;
    title: string;
    status: string;
    creator_name: string | null;
    creator_id: string;
    created_at: string;
    updated_at: string;
    collaborators: number;
    user_role: string;
  }>;
  latestForumPosts: Array<{
    id: string;
    title: string;
    category: string | null;
    author_name: string | null;
    created_at: string;
    reply_count: number;
    upvotes: number;
  }>;
  innovationAssetsRanking: Array<{
    id: string;
    title: string;
    bountyAmount: number | null;
    status: string | null;
    proposalCount: number;
    category: string | null;
  }>;
  latestMeetingNote: {
    id: string;
    title: string;
    date: string;
    author_name: string | null;
    notes: string;
    created_at: string;
  } | null;
}

interface MembershipData {
  membership: {
    type: string;
    joinedAt: string;
    contributionPoints: number;
    votingPower: number;
    badges: string[];
    specialRoles: string[];
    status: string;
  };
  stats: {
    forumPosts: number;
    projects: number;
    meetingNotes: number;
    votesReceived: number;
  };
  user: {
    id: string;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated) {
      fetchDashboardData();
    }
  }, [authenticated]);

  const fetchDashboardData = async () => {
    try {
      const accessToken = await getAccessToken();
      
      const [statsResponse, memberResponse] = await Promise.all([
        fetch("/api/dashboard/stats", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        fetch("/api/members/stats", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setDashboardStats(stats);
      }

      if (memberResponse.ok) {
        const member = await memberResponse.json();
        setMembershipData(member);

        // Check if user needs onboarding (safety check)
        if (member.user && needsOnboarding(member.user.username)) {
          router.push("/onboarding");
          return;
        }
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTenure = (joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 1) return "Just joined";
    if (daysDiff === 1) return "1 day";
    if (daysDiff < 30) return `${daysDiff} days`;
    
    const monthsDiff = (now.getFullYear() - joined.getFullYear()) * 12 + 
                      (now.getMonth() - joined.getMonth());
    
    if (monthsDiff === 1) return "1 month";
    if (monthsDiff < 12) return `${monthsDiff} months`;
    
    const years = Math.floor(monthsDiff / 12);
    const remainingMonths = monthsDiff % 12;
    
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  const getActivityLevel = (stats: MembershipData['stats']) => {
    const total = stats.forumPosts + stats.projects + stats.meetingNotes;
    if (total === 0) return { level: "Getting Started", color: "text-gray-600", message: "Start contributing to earn points!" };
    if (total < 5) return { level: "Active", color: "text-blue-600", message: "Keep up the great work!" };
    if (total < 10) return { level: "Engaged", color: "text-green-600", message: "You're making an impact!" };
    return { level: "Champion", color: "text-violet-600", message: "Outstanding contribution!" };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-us", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Dashboard - Fort Worth TX DAO">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Fort Worth TX DAO Overview</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/innovation-lab"
              className="inline-flex items-center px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Project
            </Link>
            <Link
              href="/forums"
              className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Start Discussion
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/members" className="bg-white shadow-sm hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <UsersIcon className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalUsers || 0}</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/innovation-lab" className="bg-white shadow-sm hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <RocketLaunchIcon className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Innovation Lab Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalProjects || 0}</p>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/documents" className="bg-white shadow-sm hover:shadow-md rounded-lg p-6 transition-shadow cursor-pointer border border-gray-100 hover:border-violet-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-violet-50 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-violet-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalDocuments || 0}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {membershipData && (
              <div className="bg-white border-2 border-violet-100 shadow-sm rounded-lg p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <CheckCircleIcon className="h-6 w-6 mr-2 text-violet-600" />
                      Your Membership
                    </h2>
                    <p className={`mt-1 text-sm font-medium ${getActivityLevel(membershipData.stats).color}`}>
                      {getActivityLevel(membershipData.stats).level} · {getActivityLevel(membershipData.stats).message}
                    </p>
                  </div>
                  <Link href="/settings" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                    Settings →
                  </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {formatDate(membershipData.user.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{calculateTenure(membershipData.user.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Membership Type</p>
                    <p className="text-lg font-bold text-gray-900 mt-1 capitalize">{membershipData.membership.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Voting Power</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{membershipData.membership.votingPower}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Contribution Points</p>
                    <p className="text-lg font-bold text-violet-600 mt-1 flex items-center">
                      {membershipData.membership.contributionPoints}
                      <SparklesIcon className="h-4 w-4 ml-1" />
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">Your Activity</p>
                    <p className="text-xs text-gray-500">Contribute more to earn points & increase voting power</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Forum Posts</p>
                      <p className="text-2xl font-bold text-gray-900">{membershipData.stats.forumPosts}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Projects</p>
                      <p className="text-2xl font-bold text-gray-900">{membershipData.stats.projects}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Meeting Notes</p>
                      <p className="text-2xl font-bold text-gray-900">{membershipData.stats.meetingNotes}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-600 mb-1">Votes Received</p>
                      <p className="text-2xl font-bold text-gray-900">{membershipData.stats.votesReceived}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dashboardStats && dashboardStats.userActiveProjects && dashboardStats.userActiveProjects.length > 0 && (
              <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-900">
                    <RocketLaunchIcon className="h-5 w-5 mr-2 text-violet-600" />
                    My Active Projects
                  </h2>
                  <Link href="/innovation-lab" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboardStats.userActiveProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/innovation-lab/${project.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              project.user_role === "creator" 
                                ? "bg-violet-100 text-violet-700" 
                                : "bg-blue-100 text-blue-700"
                            }`}>
                              {project.user_role}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            by {project.creator_name || "Anonymous"} · {project.collaborators} collaborator{project.collaborators > 1 ? 's' : ''}
                          </p>
                        </div>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-900">
                    <RocketLaunchIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Community Projects
                  </h2>
                  <Link href="/innovation-lab" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                    Explore All →
                  </Link>
                </div>
                {dashboardStats?.activeProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <RocketLaunchIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No active projects yet</p>
                    <p className="text-gray-500 text-sm mt-1">Be the first to propose a civic innovation project!</p>
                    <Link
                      href="/innovation-lab"
                      className="inline-flex items-center mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Submit Project
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.activeProjects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/innovation-lab/${project.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              by {project.creator_name || "Anonymous"} · {project.collaborators} collaborator{project.collaborators > 1 ? 's' : ''}
                            </p>
                          </div>
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 flex-shrink-0 ml-2" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-900">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Latest Forum Activity
                  </h2>
                  <Link href="/forums" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                    View All →
                  </Link>
                </div>
                {dashboardStats?.latestForumPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No discussions yet</p>
                    <p className="text-gray-500 text-sm mt-1">Start a conversation with the community!</p>
                    <Link
                      href="/forums"
                      className="inline-flex items-center mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm transition"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Start Discussion
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.latestForumPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/forums?post=${post.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{post.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {post.category} · {post.author_name || "Anonymous"} · {post.reply_count} replies · {post.upvotes} votes
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-900">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Innovation Bounties
                  </h2>
                  <Link href="/bounties" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                    Browse All →
                  </Link>
                </div>
                {dashboardStats?.innovationAssetsRanking.length === 0 ? (
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No bounties available</p>
                    <p className="text-gray-500 text-sm mt-1">Check back soon for funded opportunities to contribute!</p>
                    <Link
                      href="/bounties"
                      className="inline-flex items-center mt-4 px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition"
                    >
                      Explore Bounties
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.innovationAssetsRanking.map((bounty) => (
                      <Link
                        key={bounty.id}
                        href={`/bounties/${bounty.id}`}
                        className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{bounty.title}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {bounty.category} · {bounty.proposalCount} proposal{bounty.proposalCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {bounty.bountyAmount && (
                            <div className="text-right ml-2">
                              <p className="font-bold text-green-600 text-lg">
                                ${(bounty.bountyAmount / 100).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white shadow-sm border border-gray-100 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold flex items-center text-gray-900">
                    <CalendarIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Latest Meeting Notes
                  </h2>
                  <Link href="/meeting-notes" className="inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700">
                    View All →
                  </Link>
                </div>
                {!dashboardStats?.latestMeetingNote ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No meeting notes yet</p>
                    <p className="text-gray-500 text-sm mt-1">Stay tuned for upcoming DAO meetings and summaries</p>
                    <Link
                      href="/meeting-notes"
                      className="inline-flex items-center mt-4 px-4 py-2 border border-violet-600 text-violet-600 rounded-md hover:bg-violet-50 font-medium text-sm transition"
                    >
                      View Archive
                    </Link>
                  </div>
                ) : (
                  <Link
                    href="/meeting-notes"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:shadow-sm transition-all"
                  >
                    <h3 className="font-medium text-gray-900 mb-2">
                      {dashboardStats.latestMeetingNote.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(dashboardStats.latestMeetingNote.date)}
                    </p>
                    <p className="text-sm text-gray-500 line-clamp-3">
                      {dashboardStats.latestMeetingNote.notes}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      by {dashboardStats.latestMeetingNote.author_name || "Anonymous"}
                    </p>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
