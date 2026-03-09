# Fort Worth DAO Platform — Scale Plan

## Overview

This document tracks the full-stack expansion of the Fort Worth DAO Platform from a basic community forum into a production-grade civic DAO with paid memberships, role-based access control, unified activity tracking, and Stripe-powered subscriptions.

---

## Architecture

```
Next.js 16 (Pages Router) + Drizzle ORM + Turso (SQLite) + Privy Auth + Pinata IPFS
Runtime: bun
```

### Data Model (22 Tables)

```
USERS (Privy Auth)
  |
  +-- MEMBERS (1:1 profile, KYC, tier, Stripe)
  |     |
  |     +-- MEMBER_ROLES (RBAC junction) --> ROLES --> ROLE_PERMISSIONS --> PERMISSIONS
  |     +-- MEMBER_ACTIVITIES (unified activity log)
  |     +-- SUBSCRIPTIONS --> MEMBERSHIP_TIERS
  |           +-- PAYMENT_HISTORY
  |
  +-- FORUM_POSTS --> FORUM_VOTES
  +-- PROJECTS --> PROJECT_COLLABORATORS, PROJECT_UPDATES
  +-- MEETING_NOTES
  +-- DOCUMENTS --> DOCUMENT_AUDIT_TRAIL, DOCUMENT_SHARES
  +-- INNOVATION_BOUNTIES --> BOUNTY_PROPOSALS, BOUNTY_COMMENTS
```

### Security & Auth Stack

| Layer | Tool | File |
|-------|------|------|
| JWT Authentication | Privy `@privy-io/server-auth` v1.21.2 | `src/core/auth/privy.ts` |
| Auth Middleware | `withAuth` — extracts `req.claims.userId` | `src/core/middleware/withAuth.ts` |
| RBAC Middleware | `withPermission(resource, action)` — checks role permissions | `src/core/middleware/withPermission.ts` |
| Request Validation | `withValidation(zodSchema)` — parses request body | `src/core/middleware/withValidation.ts` |
| Error Handling | `errorHandler` — catches AppError + ZodError | `src/core/middleware/errorHandler.ts` |
| Composition | `compose(errorHandler, withAuth, withPermission(...))(handler)` | `src/core/middleware/compose.ts` |
| Stripe Webhooks | Raw body + `stripe.webhooks.constructEvent()` | `pages/api/webhooks/stripe.ts` |

### Membership Tiers

| Tier | Price | Billing | Stripe Price ID |
|------|-------|---------|-----------------|
| Free | $0 | Lifetime | — |
| Pro | $5/mo | Monthly | TBD (set in Stripe Dashboard) |
| Annual | $49/yr | Yearly | TBD (set in Stripe Dashboard) |

### RBAC Role Hierarchy

| Role | Level | Scope |
|------|-------|-------|
| Admin | 100 | Full platform access, manage roles/permissions |
| Moderator | 50 | Content moderation, manage forum/projects/bounties |
| Member | 10 | Create/read/update own content across all features |
| Guest | 0 | Read-only access to public content |

### Permission Matrix (7 Resources x 5 Actions = 35 Permissions)

| Resource | create | read | update | delete | manage |
|----------|--------|------|--------|--------|--------|
| forum | Member+ | Guest+ | Member+ | Mod+ | Admin |
| projects | Member+ | Guest+ | Member+ | Mod+ | Admin |
| bounties | Member+ | Guest+ | Member+ | Mod+ | Admin |
| members | Admin | Member+ | Member (own) | Admin | Admin |
| documents | Member+ | Guest+ | Member+ | Mod+ | Admin |
| meetings | Member+ | Guest+ | Member+ | Mod+ | Admin |
| admin | Admin | Admin | Admin | Admin | Admin |

### Activity Points Configuration

| Activity | Points | Triggered By |
|----------|--------|-------------|
| forum_post | 5 | Creating a forum post |
| forum_vote | 1 | Voting on a forum post |
| project_created | 20 | Creating a project |
| project_joined | 10 | Joining a project |
| bounty_submitted | 15 | Submitting a bounty |
| bounty_proposal | 10 | Proposing on a bounty |
| meeting_created | 15 | Creating meeting notes |
| document_uploaded | 10 | Uploading a document |
| document_shared | 3 | Sharing a document |
| comment_posted | 2 | Posting a bounty comment |
| login | 0 | User login |
| profile_updated | 0 | Profile update |
| role_granted | 0 | Receiving a role |
| subscription_created | 0 | Starting a subscription |

---

## Phase 1: Schema Expansion (DONE)

Added 7 new tables + extended `members` with 25 columns.

### Completed Tasks

- [x] Add `membership_tiers` reference table
- [x] Extend `members` table — KYC profile (name, contact, career, interests, location, social), onboarding status, Stripe customer ID, tier FK
- [x] Add `subscriptions` table — Stripe subscription lifecycle
- [x] Add `payment_history` table — payment records
- [x] Add `roles` table — RBAC role definitions
- [x] Add `permissions` table — resource x action matrix
- [x] Add `role_permissions` junction table
- [x] Add `member_roles` junction table
- [x] Add `member_activities` table — unified activity tracking
- [x] Add performance indexes for all new tables + compound indexes for common queries
- [x] Define Drizzle relations for all new tables + update existing relations
- [x] Export TypeScript types in `schema.ts` and `database.ts`
- [x] Update `validation.ts` constants — MEMBERSHIP_TIERS, ROLE_NAMES, ACTIVITY_TYPES, ACTIVITY_POINTS
- [x] Update `api.ts` — SUBSCRIPTIONS, ACTIVITIES, ADMIN route groups
- [x] Update `query-keys.ts` — subscriptions, activities, roles cache key factories
- [x] Verify `bun run build` compiles with zero errors

### Files Modified (Phase 1)

| File | Change |
|------|--------|
| `src/core/database/schema.ts` | 7 new tables, extended members, indexes, relations, types |
| `src/shared/types/database.ts` | 8 new type pairs |
| `src/shared/constants/validation.ts` | Tier/role/activity/onboarding constants |
| `src/shared/constants/api.ts` | Subscription/activity/admin route definitions |
| `src/shared/constants/query-keys.ts` | New cache key factories |

---

## Phase 2: Services, RBAC, API Routes, Seed Data (IN PROGRESS)

### Task 1: Install Dependencies

- [ ] Run `bun add stripe`

### Task 2: RBAC Middleware — `withPermission`

- [ ] Create `src/core/middleware/withPermission.ts`
  - HOF: `withPermission(resource, action)` returns middleware
  - Extracts `userId` from `req.claims` (set by `withAuth`)
  - Queries members by userId to get memberId
  - JOINs member_roles -> role_permissions -> permissions in single query
  - Throws `ForbiddenError('Insufficient permissions')` if no match
  - Usage: `compose(errorHandler, withAuth, withPermission('admin', 'manage'))(handler)`
- [ ] Update `src/core/middleware/index.ts` — add export

### Task 3: RBAC Feature — `src/features/rbac/`

- [ ] Create `src/features/rbac/types/index.ts`
  - Zod: `AssignRoleSchema`, `SetRolePermissionsSchema`
  - Interfaces: `RoleWithPermissions`, `MemberWithRoles`

- [ ] Create `src/features/rbac/services/rbac.repository.ts`
  - `findAllRoles()` — SELECT * FROM roles ORDER BY level DESC
  - `findRoleByName(name)` — single lookup
  - `findRoleById(id)` — single lookup
  - `findAllPermissions()` — ordered by resource, action
  - `findRolePermissions(roleId)` — JOIN role_permissions + permissions
  - `findMemberRoles(memberId)` — JOIN member_roles + roles WHERE isActive=1
  - `hasMemberPermission(memberId, resource, action)` — single JOIN -> boolean
  - `assignRole(memberId, roleId, grantedBy?)` — idempotent INSERT
  - `revokeRole(memberId, roleId)` — SET isActive=0
  - `setRolePermissions(roleId, permissionIds[])` — delete + re-insert

- [ ] Create `src/features/rbac/services/rbac.service.ts`
  - `hasPermission(memberId, resource, action)` — delegates to repo
  - `assignRole(memberId, roleName, grantedBy?)` — resolves by name
  - `revokeRole(memberId, roleName)` — resolves by name
  - `getMemberRoles(memberId)`, `getMemberPermissions(memberId)`
  - `getAllRoles()`, `getAllPermissions()`
  - `getRolePermissions(roleId)`, `setRolePermissions(roleId, permissionIds)`

- [ ] Create barrel exports (`services/index.ts`, `index.ts`)

### Task 4: Activities Feature — `src/features/activities/`

- [ ] Create `src/features/activities/types/index.ts`
  - `ActivityFilters` interface, `TrackActivityInput` Zod schema

- [ ] Create `src/features/activities/services/activities.repository.ts`
  - `create(data)` — INSERT with generateId()
  - `findByMember(memberId, filters?)` — paginated, filterable
  - `findRecent(limit)` — JOIN members + users for platform feed
  - `getStatsByMember(memberId)` — GROUP BY activityType

- [ ] Create `src/features/activities/services/activities.service.ts`
  - `trackActivity(userId, activityType, resourceType?, resourceId?, metadata?)`
    1. Resolve member from userId
    2. Lookup points from ACTIVITY_POINTS constant
    3. Insert activity row
    4. Atomically increment members.contributionPoints via SQL
  - `getActivityFeed(memberId, filters?)`, `getPlatformFeed(limit?)`
  - `getMemberActivityStats(memberId)`

- [ ] Create barrel exports

### Task 5: Subscriptions Feature — `src/features/subscriptions/`

- [ ] Create `src/features/subscriptions/types/index.ts`
  - `CreateSubscriptionInput`, `SubscriptionWithTier`, `TierInfo`

- [ ] Create `src/features/subscriptions/services/subscriptions.repository.ts`
  - Tier queries: `findAllTiers()`, `findTierByName()`, `findTierById()`
  - Subscription queries: `findByMember()`, `findActiveByMember()`, `findByStripeSubscriptionId()`, `findByStripeCustomerId()`
  - Mutations: `create()`, `update()`, `createPayment()`
  - Payment queries: `findPaymentsBySubscription()`

- [ ] Create `src/features/subscriptions/services/subscriptions.service.ts`
  - `getActiveTiers()`, `getActiveSubscription(memberId)`
  - `createSubscription(memberId, tierId, stripeData)` — creates sub + updates member.currentTierId
  - `updateFromWebhook(stripeEvent)` — handles Stripe webhook events
  - `cancelSubscription(subscriptionId)`, `recordPayment()`, `getPaymentHistory()`

- [ ] Create barrel exports

### Task 6: Extend Members Feature

- [ ] Update `src/features/members/types/index.ts`
  - `UpdateProfileSchema` (all profile fields optional)
  - `CompleteOnboardingSchema` (firstName, lastName, email required + termsAccepted)
  - `MemberWithProfile` interface, `MemberProfileFilters` interface

- [ ] Update `src/features/members/services/members.repository.ts`
  - `updateProfile(userId, profileData)` — SET new columns
  - `calculateProfileCompleteness(member)` — count filled fields -> 0-100%
  - `findByStripeCustomerId(stripeCustomerId)` — for Stripe webhook lookups
  - `updateCurrentTier(userId, tierId)` — SET currentTierId
  - `findByFilters(filters)` — member directory search (city, industry, availability)

- [ ] Update `src/features/members/services/members.service.ts`
  - `updateMemberProfile(userId, data)` — validate + update + recalculate completeness
  - `completeOnboarding(userId, data)` — set onboardingStatus + termsAcceptedAt
  - `getMemberWithProfile(userId)` — full JOIN with tier + roles
  - `searchMembers(filters)` — directory search

### Task 7: Refactor `client.ts` Contribution Points

- [ ] Update `src/core/database/client.ts`
  - Import `activitiesService` from `@features/activities`
  - Replace 5 scattered `memberOperations.addContributionPoints()` calls:

  | Operation | Old Call | New Call |
  |-----------|---------|---------|
  | createPost (L108) | `addContributionPoints(authorId, 5)` | `activitiesService.trackActivity(authorId, 'forum_post', 'forum_post', postId)` |
  | createProject (L195) | `addContributionPoints(creatorId, 20)` | `activitiesService.trackActivity(creatorId, 'project_created', 'project', projectId)` |
  | joinProject (L229) | `addContributionPoints(userId, 10)` | `activitiesService.trackActivity(userId, 'project_joined', 'project', projectId)` |
  | createMeetingNote (L246) | `addContributionPoints(authorId, 15)` | `activitiesService.trackActivity(authorId, 'meeting_created', 'meeting_note', noteId)` |
  | createDocument (L301) | `addContributionPoints(uploaderId, 10)` | `activitiesService.trackActivity(uploaderId, 'document_uploaded', 'document', docId)` |

### Task 8: API Routes

**Admin Routes** (protected: `withAuth + withPermission('admin', 'manage')`)

- [ ] `pages/api/admin/roles/index.ts`
  - GET: list all roles
  - POST: create new role

- [ ] `pages/api/admin/roles/[id]/permissions.ts`
  - GET: role's permissions
  - PUT: set role permissions

- [ ] `pages/api/members/[id]/roles.ts`
  - GET: member's roles
  - POST: assign role to member
  - DELETE: revoke role from member

**Activity Routes** (protected: `withAuth`)

- [ ] `pages/api/activities/index.ts`
  - GET: own activity feed (query params: type, limit, offset)

- [ ] `pages/api/activities/feed.ts`
  - GET: platform-wide activity feed

- [ ] `pages/api/members/[id]/activities.ts`
  - GET: specific member's activity feed

**Member Profile Routes** (protected: `withAuth`)

- [ ] `pages/api/members/profile.ts`
  - GET: own full profile (member + user + tier + roles)
  - PUT: update profile fields

**Subscription Routes**

- [ ] `pages/api/subscriptions/index.ts` (protected: `withAuth`)
  - GET: own subscription + tier info

- [ ] `pages/api/subscriptions/tiers.ts` (public — no auth)
  - GET: available membership tiers

- [ ] `pages/api/webhooks/stripe.ts` (Stripe signature verification)
  - POST: receive Stripe webhook events
  - `export const config = { api: { bodyParser: false } }`
  - Verify signature with `stripe.webhooks.constructEvent()`
  - Route to `subscriptionsService.updateFromWebhook()`

### Task 9: Seed Data

- [ ] Create `src/core/database/seed-rbac.ts`
  - Idempotent (checks if data exists before inserting)
  - Seeds 3 membership tiers (free, pro $5/mo, annual $49/yr)
  - Seeds 4 roles (admin, moderator, member, guest)
  - Seeds 35 permissions (7 resources x 5 actions)
  - Seeds role-permission matrix (admin=all, mod=most, member=CRUD own, guest=read)
- [ ] Update `package.json` — add `"db:seed-rbac": "tsx src/core/database/seed-rbac.ts"`

### Task 10: Build Verification

- [ ] `bun run build` — zero TypeScript errors
- [ ] `bun run db:push` — apply schema to Turso (if not done in Phase 1)
- [ ] `bun run db:seed-rbac` — populate reference data
- [ ] Verify via Drizzle Studio: tiers (3), roles (4), permissions (35), role_permissions matrix
- [ ] Smoke test API endpoints

---

## Phase 3: Frontend Integration (FUTURE)

- [ ] Enhanced onboarding flow — multi-step form collecting KYC profile fields
- [ ] Member profile page — view/edit profile, activity history, subscription status
- [ ] Member directory — search by city, industry, skills, availability
- [ ] Activity feed component — real-time platform activity
- [ ] Subscription management — tier selection, Stripe Checkout integration
- [ ] Admin dashboard — role management, member moderation, analytics
- [ ] Stripe Customer Portal integration for self-service billing

---

## File Manifest (Phase 2)

### New Files (27)

| # | File | Purpose |
|---|------|---------|
| 1 | `src/core/middleware/withPermission.ts` | RBAC permission check middleware |
| 2 | `src/features/rbac/types/index.ts` | Zod schemas + interfaces |
| 3 | `src/features/rbac/services/rbac.repository.ts` | Role/permission data access |
| 4 | `src/features/rbac/services/rbac.service.ts` | RBAC business logic |
| 5 | `src/features/rbac/services/index.ts` | Barrel export |
| 6 | `src/features/rbac/index.ts` | Feature barrel export |
| 7 | `src/features/activities/types/index.ts` | Activity types + filters |
| 8 | `src/features/activities/services/activities.repository.ts` | Activity data access |
| 9 | `src/features/activities/services/activities.service.ts` | Activity tracking logic |
| 10 | `src/features/activities/services/index.ts` | Barrel export |
| 11 | `src/features/activities/index.ts` | Feature barrel export |
| 12 | `src/features/subscriptions/types/index.ts` | Subscription types |
| 13 | `src/features/subscriptions/services/subscriptions.repository.ts` | Subscription/tier data access |
| 14 | `src/features/subscriptions/services/subscriptions.service.ts` | Subscription business logic |
| 15 | `src/features/subscriptions/services/index.ts` | Barrel export |
| 16 | `src/features/subscriptions/index.ts` | Feature barrel export |
| 17 | `pages/api/admin/roles/index.ts` | List/create roles (admin) |
| 18 | `pages/api/admin/roles/[id]/permissions.ts` | Role permissions (admin) |
| 19 | `pages/api/members/[id]/roles.ts` | Member role management |
| 20 | `pages/api/members/[id]/activities.ts` | Member activity feed |
| 21 | `pages/api/members/profile.ts` | Member profile CRUD |
| 22 | `pages/api/activities/index.ts` | Own activity feed |
| 23 | `pages/api/activities/feed.ts` | Platform activity feed |
| 24 | `pages/api/subscriptions/index.ts` | Own subscriptions |
| 25 | `pages/api/subscriptions/tiers.ts` | Available tiers (public) |
| 26 | `pages/api/webhooks/stripe.ts` | Stripe webhook handler |
| 27 | `src/core/database/seed-rbac.ts` | Seed roles/permissions/tiers |

### Modified Files (6)

| File | Change |
|------|--------|
| `src/core/middleware/index.ts` | Add `withPermission` export |
| `src/core/database/client.ts` | Replace 5 addContributionPoints with trackActivity |
| `src/features/members/services/members.repository.ts` | Add profile/directory/stripe methods |
| `src/features/members/services/members.service.ts` | Add profile/onboarding/search methods |
| `src/features/members/types/index.ts` | Add Zod schemas + interfaces |
| `package.json` | Add `stripe` dep + `db:seed-rbac` script |
