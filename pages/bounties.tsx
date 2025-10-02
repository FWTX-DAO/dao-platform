import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@components/AppLayout";
import { 
  useBounties, 
  usePrefetchBounty,
  formatBountyAmount, 
  getBountyStatusColor,
  getOrgTypeLabel 
} from "@hooks/useBounties";
import { queryKeys } from "@utils/query-client";
import { 
  BriefcaseIcon,
  PlusIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function BountiesPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const queryClient = useQueryClient();
  const prefetchBounty = usePrefetchBounty();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [orgTypeFilter, setOrgTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: bounties, isLoading, error, refetch, isRefetching } = useBounties({
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
    organizationType: orgTypeFilter === "all" ? undefined : orgTypeFilter,
    search: debouncedSearchTerm || undefined,
    includeAll: statusFilter === "all",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Prefetch bounty details on hover
  const handleBountyHover = (bountyId: string) => {
    prefetchBounty(bountyId);
  };

  // Manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.bounties.all });
    refetch();
  };

  if (!ready || !authenticated) return null;

  const categories = [
    "all",
    "infrastructure",
    "sustainability", 
    "public-safety",
    "education",
    "healthcare",
    "transportation",
    "economic-development",
    "civic-engagement",
    "other"
  ];

  const orgTypes = [
    "all",
    "civic",
    "commercial",
    "non-profit",
    "government",
    "educational"
  ];

  const statuses = [
    "published",
    "assigned",
    "completed",
    "all"
  ];

  return (
    <AppLayout title="Innovation Bounties - Fort Worth TX DAO">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Innovation Bounties</h1>
            <p className="mt-2 text-gray-600">
              Solve real problems for Fort Worth organizations
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefetching}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              title="Refresh bounties"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isRefetching ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => router.push("/bounties/submit")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Submit Bounty
            </button>
            <button
              onClick={() => router.push("/bounties/my-bounties")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              My Bounties
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bounties by title, problem, or organization..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-violet-500 focus:border-violet-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <span className="text-gray-400 hover:text-gray-500">Clear</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {/* Status Filter Pills */}
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    statusFilter === status
                      ? "bg-violet-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {status === "all" ? "All Status" : status.replace("-", " ")}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <FunnelIcon className="h-5 w-5 mr-1" />
              {showFilters ? "Hide" : "Show"} Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "All Categories" : cat.split("-").map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(" ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Type
                  </label>
                  <select
                    value={orgTypeFilter}
                    onChange={(e) => setOrgTypeFilter(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {orgTypes.map((type) => (
                      <option key={type} value={type}>
                        {type === "all" ? "All Types" : getOrgTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white shadow rounded-lg p-6 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-red-600 mb-4">
              Failed to load bounties. Please try again.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        ) : bounties && bounties.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No bounties found matching your filters.</p>
            <p className="mt-2 text-sm">Try adjusting your search criteria or submit a new bounty.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bounties?.map((bounty) => {
              const tags = bounty.tags ? bounty.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
              const isNew = new Date(bounty.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
              
              return (
                <div
                  key={bounty.id}
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => router.push(`/bounties/${bounty.id}`)}
                  onMouseEnter={() => handleBountyHover(bounty.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="h-8 w-8 text-violet-600 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          {getOrgTypeLabel(bounty.organizationType)}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {bounty.organizationName}
                        </p>
                      </div>
                    </div>
                    {isNew && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full animate-pulse">
                        New
                      </span>
                    )}
                  </div>

                  {/* Title & Problem */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{bounty.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {bounty.problemStatement}
                  </p>

                  {/* Use Case */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Use Case</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{bounty.useCase}</p>
                  </div>

                  {/* Bounty Amount & Deadline */}
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                      <span className="font-medium">
                        {formatBountyAmount(bounty.bountyAmount)}
                      </span>
                    </div>
                    {bounty.deadline && (
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{new Date(bounty.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {bounty.viewCount} views
                      </span>
                      <span className="flex items-center">
                        <ChatBubbleLeftRightIcon className="h-3 w-3 mr-1" />
                        {bounty.proposalCount} proposals
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{tags.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Status & Category */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className={`text-xs px-2 py-1 rounded-full ${getBountyStatusColor(bounty.status)}`}>
                      {bounty.status}
                    </span>
                    {bounty.category && (
                      <span className="text-xs text-gray-500">
                        {bounty.category.split("-").map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(" ")}
                      </span>
                    )}
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