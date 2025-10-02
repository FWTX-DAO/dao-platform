import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "@components/AppLayout";
import { useBountyDetails, useUpdateBounty, useDeleteBounty } from "@hooks/useBounties";
import { 
  InformationCircleIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function EditBountyPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, authenticated } = usePrivy();
  const { data: bounty, isLoading } = useBountyDetails(id as string);
  const updateBounty = useUpdateBounty();
  const deleteBounty = useDeleteBounty();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    // Organization
    organizationName: "",
    organizationType: "commercial",
    organizationIndustry: "",
    organizationCity: "Fort Worth",
    organizationState: "TX",
    organizationWebsite: "",
    
    // Sponsor
    sponsorFirstName: "",
    sponsorLastName: "",
    sponsorEmail: "",
    sponsorPhone: "",
    sponsorTitle: "",
    
    // Problem
    title: "",
    problemStatement: "",
    useCase: "",
    currentState: "",
    commonToolsUsed: "",
    desiredOutcome: "",
    
    // Bounty
    bountyAmount: "",
    bountyType: "fixed",
    deadline: "",
    category: "",
    
    // Additional
    technicalRequirements: "",
    constraints: "",
    deliverables: "",
    tags: "",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Load bounty data when available
  useEffect(() => {
    if (bounty) {
      // Check if user is the owner
      if (!bounty.userIsSubmitter) {
        router.push(`/bounties/${id}`);
        return;
      }

      setFormData({
        organizationName: bounty.organizationName || "",
        organizationType: bounty.organizationType || "commercial",
        organizationIndustry: bounty.organizationIndustry || "",
        organizationCity: bounty.organizationCity || "Fort Worth",
        organizationState: bounty.organizationState || "TX",
        organizationWebsite: bounty.organizationWebsite || "",
        sponsorFirstName: bounty.sponsorFirstName || "",
        sponsorLastName: bounty.sponsorLastName || "",
        sponsorEmail: bounty.sponsorEmail || "",
        sponsorPhone: bounty.sponsorPhone || "",
        sponsorTitle: bounty.sponsorTitle || "",
        title: bounty.title || "",
        problemStatement: bounty.problemStatement || "",
        useCase: bounty.useCase || "",
        currentState: bounty.currentState || "",
        commonToolsUsed: bounty.commonToolsUsed || "",
        desiredOutcome: bounty.desiredOutcome || "",
        bountyAmount: bounty.bountyAmount ? (bounty.bountyAmount / 100).toString() : "",
        bountyType: bounty.bountyType || "fixed",
        deadline: (bounty.deadline ? String(bounty.deadline).split('T')[0] : "") as string,
        category: bounty.category || "",
        technicalRequirements: bounty.technicalRequirements || "",
        constraints: bounty.constraints || "",
        deliverables: bounty.deliverables || "",
        tags: bounty.tags || "",
      });
    }
  }, [bounty, id, router]);

  if (!ready || !authenticated) return null;

  if (isLoading) {
    return (
      <AppLayout title="Loading... - Fort Worth TX DAO">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading bounty details...</div>
        </div>
      </AppLayout>
    );
  }

  if (!bounty || !bounty.userIsSubmitter) {
    return (
      <AppLayout title="Access Denied - Fort Worth TX DAO">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to edit this bounty.</p>
          <button
            onClick={() => router.push("/bounties")}
            className="text-violet-600 hover:text-violet-700"
          >
            ← Back to Bounties
          </button>
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.organizationName || !formData.title || !formData.problemStatement || 
        !formData.useCase || !formData.desiredOutcome) {
      alert("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateBounty.mutateAsync({
        id: id as string,
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        organizationIndustry: formData.organizationIndustry,
        organizationCity: formData.organizationCity,
        organizationState: formData.organizationState,
        organizationWebsite: formData.organizationWebsite,
        sponsorFirstName: formData.sponsorFirstName,
        sponsorLastName: formData.sponsorLastName,
        sponsorEmail: formData.sponsorEmail,
        sponsorPhone: formData.sponsorPhone,
        sponsorTitle: formData.sponsorTitle,
        title: formData.title,
        problemStatement: formData.problemStatement,
        useCase: formData.useCase,
        currentState: formData.currentState,
        commonToolsUsed: formData.commonToolsUsed,
        desiredOutcome: formData.desiredOutcome,
        technicalRequirements: formData.technicalRequirements,
        constraints: formData.constraints,
        deliverables: formData.deliverables,
        bountyAmount: formData.bountyAmount ? parseFloat(formData.bountyAmount) : undefined,
        bountyType: formData.bountyType,
        deadline: formData.deadline,
        category: formData.category,
        tags: formData.tags,
      });
      
      router.push(`/bounties/${id}`);
    } catch (error: any) {
      console.error("Error updating bounty:", error);
      alert(error.message || "Failed to update bounty. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setIsDeleting(true);
    
    try {
      await deleteBounty.mutateAsync(id as string);
      router.push("/bounties");
    } catch (error: any) {
      console.error("Error deleting bounty:", error);
      alert(error.message || "Failed to delete bounty. Please try again.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const industries = [
    "Technology", "Healthcare", "Manufacturing", "Retail", "Education",
    "Government", "Non-Profit", "Financial Services", "Real Estate",
    "Transportation", "Energy", "Construction", "Hospitality", "Other"
  ];

  const categories = [
    "process-optimization", "technology-innovation", "data-analytics",
    "customer-experience", "sustainability", "workforce-development",
    "infrastructure", "public-safety", "economic-development", "other"
  ];

  return (
    <AppLayout title={`Edit: ${bounty.title} - Fort Worth TX DAO`}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/bounties/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Bounty
          </button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Bounty</h1>
              <p className="mt-2 text-gray-600">
                Update your innovation challenge details
              </p>
            </div>
            
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md ${
                showDeleteConfirm 
                  ? "bg-red-600 text-white hover:bg-red-700" 
                  : "text-red-700 bg-white hover:bg-red-50"
              } disabled:opacity-50`}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : showDeleteConfirm ? "Click to Confirm Delete" : "Delete Bounty"}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">
              Are you sure you want to delete this bounty? This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-8">
          {/* Organization Section */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <BuildingOfficeIcon className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-lg font-semibold">Organization Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) => updateFormData("organizationName", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.organizationType}
                  onChange={(e) => updateFormData("organizationType", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="commercial">Commercial/For-Profit</option>
                  <option value="civic">Civic Organization</option>
                  <option value="non-profit">Non-Profit</option>
                  <option value="government">Government Agency</option>
                  <option value="educational">Educational Institution</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Industry</label>
                <select
                  value={formData.organizationIndustry}
                  onChange={(e) => updateFormData("organizationIndustry", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={formData.organizationWebsite}
                  onChange={(e) => updateFormData("organizationWebsite", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="https://www.example.com"
                />
              </div>
            </div>
          </div>

          {/* Sponsor Contact Section */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <UserCircleIcon className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-lg font-semibold">Problem Sponsor Contact</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  value={formData.sponsorFirstName}
                  onChange={(e) => updateFormData("sponsorFirstName", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  value={formData.sponsorLastName}
                  onChange={(e) => updateFormData("sponsorLastName", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.sponsorEmail}
                  onChange={(e) => updateFormData("sponsorEmail", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.sponsorPhone}
                  onChange={(e) => updateFormData("sponsorPhone", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={formData.sponsorTitle}
                  onChange={(e) => updateFormData("sponsorTitle", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Problem Definition Section */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-lg font-semibold">Problem & Business Case</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Challenge Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.problemStatement}
                  onChange={(e) => updateFormData("problemStatement", e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Use Case <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.useCase}
                  onChange={(e) => updateFormData("useCase", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Desired Outcome <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.desiredOutcome}
                  onChange={(e) => updateFormData("desiredOutcome", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current State & Tools
                </label>
                <textarea
                  value={formData.currentState}
                  onChange={(e) => updateFormData("currentState", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tools & Systems Used
                </label>
                <input
                  type="text"
                  value={formData.commonToolsUsed}
                  onChange={(e) => updateFormData("commonToolsUsed", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Bounty Details Section */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-4">
              <CurrencyDollarIcon className="h-6 w-6 text-violet-600 mr-2" />
              <h2 className="text-lg font-semibold">Bounty Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bounty Amount (USD)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={formData.bountyAmount}
                    onChange={(e) => updateFormData("bountyAmount", e.target.value)}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    step="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bounty Type
                </label>
                <select
                  value={formData.bountyType}
                  onChange={(e) => updateFormData("bountyType", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="hourly">Hourly Rate</option>
                  <option value="milestone-based">Milestone-Based</option>
                  <option value="equity">Equity/Revenue Share</option>
                  <option value="open">Open to Negotiation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateFormData("deadline", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData("category", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.split("-").map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(" ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => updateFormData("tags", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="AI, automation, mobile (comma-separated)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Technical Requirements
                </label>
                <textarea
                  value={formData.technicalRequirements}
                  onChange={(e) => updateFormData("technicalRequirements", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Constraints
                </label>
                <textarea
                  value={formData.constraints}
                  onChange={(e) => updateFormData("constraints", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Deliverables
                </label>
                <textarea
                  value={formData.deliverables}
                  onChange={(e) => updateFormData("deliverables", e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Changes are saved immediately</p>
                  <p>Your bounty will remain published and visible to innovators.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/bounties/${id}`)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}