import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, usePrivy } from "@privy-io/react-auth";
import AppLayout from "../components/AppLayout";
import { 
  UsersIcon, 
  DocumentTextIcon, 
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
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
    const monthsDiff = (now.getFullYear() - joined.getFullYear()) * 12 + 
                      (now.getMonth() - joined.getMonth());
    
    if (monthsDiff < 1) return "New member";
    if (monthsDiff < 12) return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
    const years = Math.floor(monthsDiff / 12);
    return `${years} year${years > 1 ? 's' : ''}`;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Fort Worth TX DAO Overview</p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-500">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <UsersIcon className="h-10 w-10 text-violet-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <RocketLaunchIcon className="h-10 w-10 text-violet-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Innovation Lab Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalProjects || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-10 w-10 text-violet-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Documents</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalDocuments || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {membershipData && (
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 shadow rounded-lg p-6 text-white">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircleIcon className="h-6 w-6 mr-2" />
                  Your Membership
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm opacity-90">Member Since</p>
                    <p className="text-lg font-bold">
                      {formatDate(membershipData.membership.joinedAt)}
                    </p>
                    <p className="text-xs opacity-75">{calculateTenure(membershipData.membership.joinedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Membership Type</p>
                    <p className="text-lg font-bold capitalize">{membershipData.membership.type}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Voting Power</p>
                    <p className="text-lg font-bold">{membershipData.membership.votingPower}</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">Contribution Points</p>
                    <p className="text-lg font-bold">{membershipData.membership.contributionPoints}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm opacity-90 mb-2">Activity Stats</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="opacity-75">Forum Posts:</span> <span className="font-semibold">{membershipData.stats.forumPosts}</span>
                    </div>
                    <div>
                      <span className="opacity-75">Projects:</span> <span className="font-semibold">{membershipData.stats.projects}</span>
                    </div>
                    <div>
                      <span className="opacity-75">Meeting Notes:</span> <span className="font-semibold">{membershipData.stats.meetingNotes}</span>
                    </div>
                    <div>
                      <span className="opacity-75">Votes Received:</span> <span className="font-semibold">{membershipData.stats.votesReceived}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {dashboardStats && dashboardStats.userActiveProjects && dashboardStats.userActiveProjects.length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <RocketLaunchIcon className="h-5 w-5 mr-2 text-violet-600" />
                    My Active Projects
                  </h2>
                  <Link href="/innovation-lab" className="text-sm text-violet-600 hover:text-violet-700">
                    View All
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboardStats.userActiveProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/innovation-lab/${project.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{project.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <RocketLaunchIcon className="h-5 w-5 mr-2 text-violet-600" />
                    All Active Projects
                  </h2>
                  <Link href="/innovation-lab" className="text-sm text-violet-600 hover:text-violet-700">
                    View All
                  </Link>
                </div>
                {dashboardStats?.activeProjects.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active projects</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.activeProjects.slice(0, 5).map((project) => (
                      <Link
                        key={project.id}
                        href={`/innovation-lab/${project.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition"
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

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Latest Forum Activity
                  </h2>
                  <Link href="/forums" className="text-sm text-violet-600 hover:text-violet-700">
                    View All
                  </Link>
                </div>
                {dashboardStats?.latestForumPosts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No forum posts</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.latestForumPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/forums?post=${post.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition"
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Innovation Bounties
                  </h2>
                  <Link href="/bounties" className="text-sm text-violet-600 hover:text-violet-700">
                    View All
                  </Link>
                </div>
                {dashboardStats?.innovationAssetsRanking.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active bounties</p>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats?.innovationAssetsRanking.map((bounty) => (
                      <Link
                        key={bounty.id}
                        href={`/bounties/${bounty.id}`}
                        className="block p-3 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition"
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
                              <p className="font-bold text-green-600">
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

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Latest Meeting Notes
                  </h2>
                  <Link href="/meeting-notes" className="text-sm text-violet-600 hover:text-violet-700">
                    View All
                  </Link>
                </div>
                {!dashboardStats?.latestMeetingNote ? (
                  <p className="text-gray-500 text-sm">No meeting notes</p>
                ) : (
                  <Link
                    href="/meeting-notes"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition"
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
