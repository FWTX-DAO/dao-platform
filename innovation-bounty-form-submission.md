# Public Innovation Bounty Submission Form

## Overview

This document provides a comprehensive guide for creating an external-facing public innovation bounty submission form using **TanStack Form** (React), **Hono** API backend, and **Cloudflare Turnstile** for CAPTCHA protection - all without modifying the existing database schema.

---

## Database Schema Reference

### `innovation_bounties` Table Structure

The existing schema supports all necessary fields for public submissions:

```typescript
// From src/db/schema.ts (lines 278-341)

export const innovationBounties = sqliteTable("innovation_bounties", {
  id: text("id").primaryKey(),
  
  // Organization Info
  organizationName: text("organization_name").notNull(),
  organizationType: text("organization_type").notNull(), // civic, commercial, non-profit, government, educational
  organizationContact: text("organization_contact"),
  organizationWebsite: text("organization_website"),
  
  // Sponsor Information
  sponsorFirstName: text("sponsor_first_name"),
  sponsorLastName: text("sponsor_last_name"),
  sponsorEmail: text("sponsor_email"),
  sponsorPhone: text("sponsor_phone"),
  sponsorTitle: text("sponsor_title"),
  sponsorDepartment: text("sponsor_department"),
  sponsorLinkedIn: text("sponsor_linkedin"),
  
  // Organization Details
  organizationSize: text("organization_size"), // 1-10, 11-50, 51-200, 201-500, 500+
  organizationIndustry: text("organization_industry"),
  organizationAddress: text("organization_address"),
  organizationCity: text("organization_city"),
  organizationState: text("organization_state"),
  organizationZip: text("organization_zip"),
  
  // Bounty Details
  title: text("title").notNull(),
  problemStatement: text("problem_statement").notNull(),
  useCase: text("use_case").notNull(),
  currentState: text("current_state"),
  commonToolsUsed: text("common_tools_used"), // JSON array or comma-separated
  desiredOutcome: text("desired_outcome").notNull(),
  
  // Technical Requirements
  technicalRequirements: text("technical_requirements"), // JSON array
  constraints: text("constraints"),
  deliverables: text("deliverables"),
  
  // Bounty Metadata
  bountyAmount: integer("bounty_amount"), // In cents
  bountyType: text("bounty_type").default("fixed"),
  deadline: text("deadline"), // ISO date string
  category: text("category"),
  tags: text("tags"), // Comma-separated
  
  // Status & Screening
  status: text("status").default("draft"), // draft, screening, published, assigned, completed, cancelled
  screeningNotes: text("screening_notes"),
  screenedBy: text("screened_by").references(() => users.id),
  screenedAt: text("screened_at"),
  publishedAt: text("published_at"),
  
  // Submission & Ownership
  submitterId: text("submitter_id").notNull().references(() => users.id),
  isAnonymous: integer("is_anonymous").notNull().default(0),
  
  // Metrics
  viewCount: integer("view_count").notNull().default(0),
  proposalCount: integer("proposal_count").notNull().default(0),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
```

**Key Points:**
- Required fields: `organizationName`, `organizationType`, `title`, `problemStatement`, `useCase`, `desiredOutcome`, `submitterId`
- For public submissions, `submitterId` will reference a system "Public Submissions" user
- Status defaults to `"draft"` but public form will set to `"screening"` for moderation
- `bountyAmount` stored in cents for precision

---

## Form Field Mapping

### Mapping Public Form → Database Schema

| Form Section | Form Field | Database Column | Type | Required | Notes |
|-------------|-----------|-----------------|------|----------|-------|
| **Organization** | Organization Name | `organizationName` | text | ✅ | |
| | Organization Type | `organizationType` | select | ✅ | civic, commercial, non-profit, government, educational |
| | Industry | `organizationIndustry` | select | ❌ | Industry category |
| | Website | `organizationWebsite` | url | ❌ | |
| | City | `organizationCity` | text | ❌ | Default: "Fort Worth" |
| | State | `organizationState` | text | ❌ | Default: "TX" |
| | Zip Code | `organizationZip` | text | ❌ | |
| **Contact** | First Name | `sponsorFirstName` | text | ✅ | Problem sponsor |
| | Last Name | `sponsorLastName` | text | ✅ | Problem sponsor |
| | Email | `sponsorEmail` | email | ✅ | For follow-up |
| | Phone | `sponsorPhone` | tel | ❌ | |
| | Title/Position | `sponsorTitle` | text | ❌ | |
| **Problem** | Challenge Title | `title` | text | ✅ | Short, descriptive |
| | Problem Statement | `problemStatement` | textarea | ✅ | What problem needs solving |
| | Business Use Case | `useCase` | textarea | ✅ | Why solve this |
| | Current State | `currentState` | textarea | ❌ | How handled now |
| | Tools Used | `commonToolsUsed` | text | ❌ | Comma-separated |
| | Desired Outcome | `desiredOutcome` | textarea | ✅ | Success criteria |
| **Technical** | Technical Requirements | `technicalRequirements` | textarea | ❌ | JSON or text |
| | Constraints | `constraints` | textarea | ❌ | Limitations |
| | Deliverables | `deliverables` | textarea | ❌ | Expected outputs |
| **Bounty** | Bounty Amount | `bountyAmount` | number | ❌ | In USD, convert to cents |
| | Deadline | `deadline` | date | ❌ | ISO 8601 format |
| | Category | `category` | select | ❌ | predefined categories |
| | Tags | `tags` | text | ❌ | Comma-separated |
| **System** | - | `submitterId` | text | ✅ | Auto: PUBLIC_USER_ID |
| | - | `status` | text | ✅ | Auto: "screening" |
| | - | `isAnonymous` | integer | ✅ | Default: 0 |
| | Turnstile Token | - | text | ✅ | Validate, don't store |

---

## Implementation Guide

### 1. Install Dependencies

```bash
npm install @tanstack/react-form hono @cloudflare/turnstile
```

### 2. Environment Variables

Add to `.env.local`:

```bash
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here

# Public Submissions User ID (create this user in DB)
PUBLIC_SUBMISSIONS_USER_ID=public-submissions-user-id
```

### 3. Create Public Submissions User

Run this migration or seed script:

```typescript
// src/db/seed-public-user.ts
import { db, users } from "./index";
import { generateId } from "../../lib/api-helpers";

async function createPublicUser() {
  const publicUserId = process.env.PUBLIC_SUBMISSIONS_USER_ID || generateId();
  
  await db.insert(users).values({
    id: publicUserId,
    privyDid: "public-submissions-system",
    username: "Public Submissions",
    bio: "System account for public innovation bounty submissions",
    avatarUrl: null,
  }).onConflictDoNothing();
  
  console.log("Public submissions user created:", publicUserId);
}

createPublicUser();
```

### 4. Create Hono API Route

```typescript
// pages/api/public/bounties/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { db, innovationBounties } from "../../../../src/db";
import { generateId } from "../../../../lib/api-helpers";
import { sql } from "drizzle-orm";

const app = new Hono().basePath("/api/public/bounties");

// Verify Turnstile token
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  
  if (!secretKey) {
    console.error("TURNSTILE_SECRET_KEY not configured");
    return false;
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const data = await response.json();
  return data.success === true;
}

// Get client IP
function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded 
    ? (typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded[0])
    : req.socket.remoteAddress || "unknown";
  return ip;
}

app.post("/submit", async (c) => {
  try {
    const body = await c.req.json();
    const { turnstileToken, ...formData } = body;

    // 1. Verify Turnstile CAPTCHA
    const ip = getClientIp(c.req.raw as any);
    const isValidCaptcha = await verifyTurnstile(turnstileToken, ip);
    
    if (!isValidCaptcha) {
      return c.json({ error: "CAPTCHA verification failed" }, 400);
    }

    // 2. Validate required fields
    const requiredFields = [
      "organizationName",
      "organizationType", 
      "sponsorFirstName",
      "sponsorLastName",
      "sponsorEmail",
      "title",
      "problemStatement",
      "useCase",
      "desiredOutcome"
    ];

    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        return c.json({ 
          error: `Missing required field: ${field}` 
        }, 400);
      }
    }

    // 3. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.sponsorEmail)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

    // 4. Get public submissions user ID
    const publicUserId = process.env.PUBLIC_SUBMISSIONS_USER_ID;
    if (!publicUserId) {
      console.error("PUBLIC_SUBMISSIONS_USER_ID not configured");
      return c.json({ error: "System configuration error" }, 500);
    }

    // 5. Process form data
    const bountyId = generateId();
    
    const bountyData = {
      id: bountyId,
      
      // Organization
      organizationName: formData.organizationName,
      organizationType: formData.organizationType,
      organizationIndustry: formData.organizationIndustry || null,
      organizationWebsite: formData.organizationWebsite || null,
      organizationCity: formData.organizationCity || "Fort Worth",
      organizationState: formData.organizationState || "TX",
      organizationZip: formData.organizationZip || null,
      
      // Sponsor Contact
      sponsorFirstName: formData.sponsorFirstName,
      sponsorLastName: formData.sponsorLastName,
      sponsorEmail: formData.sponsorEmail,
      sponsorPhone: formData.sponsorPhone || null,
      sponsorTitle: formData.sponsorTitle || null,
      
      // Problem Details
      title: formData.title,
      problemStatement: formData.problemStatement,
      useCase: formData.useCase,
      currentState: formData.currentState || null,
      commonToolsUsed: Array.isArray(formData.commonToolsUsed)
        ? formData.commonToolsUsed.join(",")
        : formData.commonToolsUsed || null,
      desiredOutcome: formData.desiredOutcome,
      
      // Technical
      technicalRequirements: formData.technicalRequirements || null,
      constraints: formData.constraints || null,
      deliverables: formData.deliverables || null,
      
      // Bounty Details
      bountyAmount: formData.bountyAmount 
        ? Math.round(parseFloat(formData.bountyAmount) * 100) 
        : null,
      bountyType: formData.bountyType || "fixed",
      deadline: formData.deadline || null,
      category: formData.category || null,
      tags: Array.isArray(formData.tags)
        ? formData.tags.join(",")
        : formData.tags || null,
      
      // System fields
      status: "screening", // Requires review before publishing
      submitterId: publicUserId,
      isAnonymous: 0,
      viewCount: 0,
      proposalCount: 0,
    };

    // 6. Insert into database
    const result = await db
      .insert(innovationBounties)
      .values(bountyData)
      .returning();

    // 7. Return success response
    return c.json({
      success: true,
      message: "Bounty submitted successfully for review",
      bountyId: result[0].id,
    }, 201);

  } catch (error: any) {
    console.error("Public bounty submission error:", error);
    return c.json({ 
      error: "Failed to submit bounty",
      details: error.message 
    }, 500);
  }
});

export default handle(app);

export const config = {
  runtime: "nodejs",
};
```

### 5. Create TanStack Form Component

```tsx
// components/PublicBountyForm.tsx
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Turnstile } from "@cloudflare/turnstile";

interface BountyFormData {
  // Organization
  organizationName: string;
  organizationType: string;
  organizationIndustry: string;
  organizationWebsite: string;
  organizationCity: string;
  organizationState: string;
  organizationZip: string;
  
  // Contact
  sponsorFirstName: string;
  sponsorLastName: string;
  sponsorEmail: string;
  sponsorPhone: string;
  sponsorTitle: string;
  
  // Problem
  title: string;
  problemStatement: string;
  useCase: string;
  currentState: string;
  commonToolsUsed: string;
  desiredOutcome: string;
  
  // Technical
  technicalRequirements: string;
  constraints: string;
  deliverables: string;
  
  // Bounty
  bountyAmount: string;
  deadline: string;
  category: string;
  tags: string;
}

export default function PublicBountyForm() {
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<BountyFormData>({
    defaultValues: {
      organizationName: "",
      organizationType: "commercial",
      organizationIndustry: "",
      organizationWebsite: "",
      organizationCity: "Fort Worth",
      organizationState: "TX",
      organizationZip: "",
      sponsorFirstName: "",
      sponsorLastName: "",
      sponsorEmail: "",
      sponsorPhone: "",
      sponsorTitle: "",
      title: "",
      problemStatement: "",
      useCase: "",
      currentState: "",
      commonToolsUsed: "",
      desiredOutcome: "",
      technicalRequirements: "",
      constraints: "",
      deliverables: "",
      bountyAmount: "",
      deadline: "",
      category: "",
      tags: "",
    },
    onSubmit: async ({ value }) => {
      // Validate Turnstile
      if (!turnstileToken) {
        setErrorMessage("Please complete the CAPTCHA verification");
        setSubmitStatus("error");
        return;
      }

      try {
        const response = await fetch("/api/public/bounties/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...value,
            turnstileToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Submission failed");
        }

        setSubmitStatus("success");
        setErrorMessage("");
        
        // Reset form
        form.reset();
        setTurnstileToken("");
      } catch (error: any) {
        setSubmitStatus("error");
        setErrorMessage(error.message);
      }
    },
  });

  if (submitStatus === "success") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-4">
          ✅ Bounty Submitted Successfully!
        </h2>
        <p className="text-green-700">
          Thank you for submitting your innovation bounty. Our team will review it and 
          publish it to the community shortly. You'll be contacted at the email address 
          you provided.
        </p>
        <button
          onClick={() => setSubmitStatus("idle")}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Submit Another Bounty
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Submit Innovation Bounty</h1>
      <p className="text-gray-600 mb-6">
        Post a challenge for Fort Worth's innovation community
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
        className="space-y-6"
      >
        {/* Organization Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Organization Information</h2>
          
          <form.Field name="organizationName">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Acme Corporation"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="organizationType">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="commercial">Commercial/For-Profit</option>
                  <option value="civic">Civic Organization</option>
                  <option value="non-profit">Non-Profit</option>
                  <option value="government">Government Agency</option>
                  <option value="educational">Educational Institution</option>
                </select>
              </div>
            )}
          </form.Field>

          {/* Add more organization fields following same pattern */}
        </section>

        {/* Contact Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <form.Field name="sponsorFirstName">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="sponsorLastName">
              {(field) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  />
                </div>
              )}
            </form.Field>
          </div>

          <form.Field name="sponsorEmail">
            {(field) => (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="sponsor@company.com"
                />
              </div>
            )}
          </form.Field>

          {/* Add more contact fields */}
        </section>

        {/* Problem Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Problem & Business Case</h2>
          
          <form.Field name="title">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Optimize Customer Service Response Time"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="problemStatement">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="Describe the specific problem you're facing..."
                />
              </div>
            )}
          </form.Field>

          <form.Field name="useCase">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Use Case <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="How will solving this benefit your organization?"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="desiredOutcome">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desired Outcome <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  placeholder="What does success look like?"
                />
              </div>
            )}
          </form.Field>

          {/* Add more problem fields */}
        </section>

        {/* Bounty Details Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bounty Details</h2>
          
          <form.Field name="bountyAmount">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bounty Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                    placeholder="5000"
                    step="100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Leave blank if negotiable</p>
              </div>
            )}
          </form.Field>

          <form.Field name="deadline">
            {(field) => (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submission Deadline
                </label>
                <input
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-violet-500 focus:border-violet-500"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </form.Field>

          {/* Add more bounty fields */}
        </section>

        {/* Turnstile CAPTCHA */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Verify You're Human</h2>
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken("")}
            onExpire={() => setTurnstileToken("")}
          />
        </div>

        {/* Error Message */}
        {submitStatus === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!turnstileToken || form.state.isSubmitting}
            className="px-6 py-3 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {form.state.isSubmitting ? "Submitting..." : "Submit Bounty"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 6. Create Public Page

```tsx
// pages/public/submit-bounty.tsx
import Head from "next/head";
import PublicBountyForm from "../../components/PublicBountyForm";

export default function PublicSubmitBountyPage() {
  return (
    <>
      <Head>
        <title>Submit Innovation Bounty - Fort Worth TX DAO</title>
        <meta 
          name="description" 
          content="Submit an innovation challenge to Fort Worth's civic tech community" 
        />
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12">
        <PublicBountyForm />
      </div>
    </>
  );
}
```

---

## Cloudflare Turnstile Setup

### 1. Get API Keys

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** section
3. Create a new site widget
4. Copy **Site Key** (public) and **Secret Key** (private)

### 2. Configure Keys

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
TURNSTILE_SECRET_KEY=0x4BBB...
```

### 3. Widget Modes

- **Managed**: Auto-detects bots (recommended)
- **Non-interactive**: Invisible challenge
- **Invisible**: No UI

---

## Security Considerations

1. **Rate Limiting**: Add rate limiting to prevent spam (consider using Vercel Edge Config or Redis)
2. **Input Sanitization**: Sanitize all text inputs before storing
3. **Email Validation**: Verify email format and consider email verification
4. **Phone Validation**: Validate phone number format if required
5. **URL Validation**: Validate organization website URLs
6. **SQL Injection**: Using Drizzle ORM with prepared statements (already protected)
7. **XSS Protection**: Sanitize rendered content (consider using DOMPurify)

---

## Moderation Workflow

### Status Flow for Public Submissions

```
Public Submission → screening → published/rejected
Authenticated User → published (auto-approved)
```

### Create Admin Screening Interface

```typescript
// pages/admin/screen-bounties.tsx
// Admin interface to review bounties with status="screening"
// Admins can:
// 1. Review submission details
// 2. Approve → Set status="published", publishedAt=now()
// 3. Reject → Set status="cancelled", add screeningNotes
// 4. Request changes → Email sponsor with feedback
```

---

## TypeScript Types

```typescript
// types/public-bounty.ts
export interface PublicBountySubmission {
  // Organization
  organizationName: string;
  organizationType: "commercial" | "civic" | "non-profit" | "government" | "educational";
  organizationIndustry?: string;
  organizationWebsite?: string;
  organizationCity?: string;
  organizationState?: string;
  organizationZip?: string;
  
  // Contact
  sponsorFirstName: string;
  sponsorLastName: string;
  sponsorEmail: string;
  sponsorPhone?: string;
  sponsorTitle?: string;
  
  // Problem
  title: string;
  problemStatement: string;
  useCase: string;
  currentState?: string;
  commonToolsUsed?: string;
  desiredOutcome: string;
  
  // Technical
  technicalRequirements?: string;
  constraints?: string;
  deliverables?: string;
  
  // Bounty
  bountyAmount?: number; // In dollars (will be converted to cents)
  deadline?: string; // ISO 8601
  category?: string;
  tags?: string;
  
  // CAPTCHA
  turnstileToken: string;
}

export interface PublicBountyResponse {
  success: boolean;
  message: string;
  bountyId?: string;
  error?: string;
}
```

---

## Testing Checklist

- [ ] Form validation (all required fields)
- [ ] Turnstile CAPTCHA verification
- [ ] Email format validation
- [ ] Phone number format validation (if required)
- [ ] URL validation
- [ ] Date validation (deadline must be in future)
- [ ] Number validation (bountyAmount must be positive)
- [ ] Database insertion
- [ ] Error handling
- [ ] Success message display
- [ ] Form reset after submission
- [ ] Mobile responsiveness
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Rate limiting
- [ ] SQL injection prevention
- [ ] XSS prevention

---

## API Endpoint Summary

### POST `/api/public/bounties/submit`

**Request Body:**
```json
{
  "organizationName": "Acme Corp",
  "organizationType": "commercial",
  "sponsorFirstName": "John",
  "sponsorLastName": "Doe",
  "sponsorEmail": "john@acme.com",
  "title": "Optimize Delivery Routes",
  "problemStatement": "Our current routing is inefficient...",
  "useCase": "Save time and fuel costs...",
  "desiredOutcome": "20% reduction in delivery time...",
  "bountyAmount": 5000,
  "turnstileToken": "xxx.yyy.zzz"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Bounty submitted successfully for review",
  "bountyId": "abc123"
}
```

**Error Response (400/500):**
```json
{
  "error": "Missing required field: organizationName"
}
```

---

## Next Steps

1. Install dependencies
2. Set up Cloudflare Turnstile account and get API keys
3. Create public submissions user in database
4. Implement Hono API route
5. Build TanStack Form component
6. Create public page
7. Add admin screening interface
8. Test thoroughly
9. Deploy
10. Monitor submissions

---

## References

- [TanStack Form Documentation](https://tanstack.com/form)
- [Hono Documentation](https://hono.dev/)
- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- Current schema: `src/db/schema.ts:278-341`
- Current API: `pages/api/bounties/index.ts`
- Current form: `pages/bounties/submit.tsx`
