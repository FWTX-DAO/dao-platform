import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import AppLayout from "../../components/AppLayout";
import { useCreateBounty } from "../../hooks/useBounties";
import { 
  InformationCircleIcon,
  BuildingOfficeIcon,
  UserCircleIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function SubmitBountyPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const createBounty = useCreateBounty();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Organization
    organizationName: "",
    organizationType: "commercial",
    organizationIndustry: "",
    organizationCity: "Fort Worth",
    organizationState: "TX",
    
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
    deadline: "",
    category: "",
    
    // Additional
    technicalRequirements: "",
    constraints: "",
    tags: "",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Pre-fill email from authenticated user
  useEffect(() => {
    if (user?.email?.address && !formData.sponsorEmail) {
      setFormData(prev => ({ ...prev, sponsorEmail: user.email?.address || "" }));
    }
  }, [user]);

  if (!ready || !authenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.organizationName || !formData.title || !formData.problemStatement || 
        !formData.useCase || !formData.desiredOutcome || !formData.sponsorFirstName || 
        !formData.sponsorLastName || !formData.sponsorEmail) {
      alert("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submissionData = {
        // Organization
        organizationName: formData.organizationName,
        organizationType: formData.organizationType,
        organizationIndustry: formData.organizationIndustry,
        organizationCity: formData.organizationCity,
        organizationState: formData.organizationState,
        
        // Store sponsor info in a simpler way
        sponsorFirstName: formData.sponsorFirstName,
        sponsorLastName: formData.sponsorLastName,
        sponsorEmail: formData.sponsorEmail,
        sponsorPhone: formData.sponsorPhone,
        sponsorTitle: formData.sponsorTitle,
        
        // Problem
        title: formData.title,
        problemStatement: formData.problemStatement,
        useCase: formData.useCase,
        currentState: formData.currentState,
        commonToolsUsed: formData.commonToolsUsed,
        desiredOutcome: formData.desiredOutcome,
        
        // Technical
        technicalRequirements: formData.technicalRequirements,
        constraints: formData.constraints,
        
        // Bounty
        bountyAmount: formData.bountyAmount ? parseFloat(formData.bountyAmount) : undefined,
        deadline: formData.deadline,
        category: formData.category,
        tags: formData.tags,
        
        // Auto publish (no review needed)
      };
      
      const result = await createBounty.mutateAsync(submissionData);
      router.push(`/bounties/${result.id}`);
    } catch (error: any) {
      console.error("Error submitting bounty:", error);
      alert(error.message || "Failed to submit bounty. Please try again.");
    } finally {
      setIsSubmitting(false);
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
    <AppLayout title="Submit Innovation Bounty - Fort Worth TX DAO">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Submit Innovation Bounty</h1>
          <p className="mt-2 text-gray-600">
            Post a challenge for Fort Worth's innovation community to solve
          </p>
        </div>

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
                  placeholder="Acme Corporation"
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
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="text"
                    value={formData.organizationCity}
                    onChange={(e) => updateFormData("organizationCity", e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={formData.organizationState}
                    onChange={(e) => updateFormData("organizationState", e.target.value)}
                    className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
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
                <label className="block text-sm font-medium text-gray-700">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sponsorFirstName}
                  onChange={(e) => updateFormData("sponsorFirstName", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.sponsorLastName}
                  onChange={(e) => updateFormData("sponsorLastName", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.sponsorEmail}
                  onChange={(e) => updateFormData("sponsorEmail", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="sponsor@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={formData.sponsorPhone}
                  onChange={(e) => updateFormData("sponsorPhone", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="(817) 555-0123"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Job Title</label>
                <input
                  type="text"
                  value={formData.sponsorTitle}
                  onChange={(e) => updateFormData("sponsorTitle", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="Director of Operations"
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
                  placeholder="Optimize Customer Service Response Time"
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
                  placeholder="Describe the specific problem you're facing and its impact on your operations..."
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
                  placeholder="How will solving this problem benefit your organization and stakeholders?"
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
                  placeholder="How are you currently handling this? What tools or processes are in place?"
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
                  placeholder="Excel, Salesforce, SAP, custom software, etc."
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
                  placeholder="What does success look like? What specific improvements do you expect?"
                />
              </div>
            </div>
          </div>

          {/* Additional Details Section */}
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
                    placeholder="5000"
                    step="100"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Leave blank if negotiable</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Submission Deadline
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => updateFormData("tags", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  placeholder="AI, automation, mobile"
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
                  placeholder="Any specific technical requirements, integrations, or compatibility needs..."
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
                  placeholder="Budget limitations, timeline constraints, regulatory requirements..."
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
                  <p className="font-medium">What happens next?</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li>Your bounty will be published immediately</li>
                    <li>It will be visible to our innovation community</li>
                    <li>You'll receive proposals from qualified innovators</li>
                    <li>You can edit or delete your bounty at any time</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/bounties")}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
              >
                {isSubmitting ? "Publishing..." : "Publish Bounty"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}