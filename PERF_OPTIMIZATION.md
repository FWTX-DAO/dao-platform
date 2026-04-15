# Wallet & Config Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 10 issues found during audit sweep: wallet sync race condition, duplicated wallet logic, misleading labels, toolchain compliance, auto-connect privacy, type safety, error handling, state management, and documentation drift.

**Architecture:** Extract a shared wallet utility to eliminate 5 duplicate call sites. Guard `syncWalletAddress` against re-populating disconnected wallets. Fix UI/UX issues in WalletList and Settings. Update CLAUDE.md to match current auth behavior.

**Tech Stack:** Next.js 16, Privy (`@privy-io/react-auth`, `@privy-io/server-auth`), Drizzle ORM, bun, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/shared/utils/wallet.ts` | Shared wallet selection logic (client + server) |
| Modify | `src/core/database/queries/users.ts:122-135` | Guard syncWalletAddress against null overwrites |
| Modify | `src/app/_lib/auth.ts:29-35` | Use shared wallet utility |
| Modify | `src/app/(auth)/onboarding/_components/onboarding-form.tsx:168-175` | Use shared wallet utility |
| Modify | `src/app/(platform)/settings/page.tsx:100-107,239-241` | Use shared wallet utility + fix label |
| Modify | `src/app/_actions/members.ts:369-371` | Use shared wallet utility in backfill |
| Modify | `src/app/(platform)/passport/page.tsx:83-85` | Use shared wallet utility |
| Modify | `src/app/_providers/privy-provider.tsx:12-14` | Disable Solana auto-connect |
| Modify | `src/shared/components/WalletList.tsx:32,54-70` | Split isCreating state + add error display |
| Modify | `package.json:11-12` | Replace npx with bunx |
| Modify | `CLAUDE.md` | Document checkAdmin() and updated requireAdmin() |

---

### Task 1: Extract shared wallet utility

**Files:**
- Create: `src/shared/utils/wallet.ts`

This utility eliminates the identical wallet-preference logic currently copy-pasted across 3 files, and provides typed alternatives to the `as any[]` casts used everywhere.

- [ ] **Step 1: Create `src/shared/utils/wallet.ts`**

```typescript
// src/shared/utils/wallet.ts

/**
 * Shared wallet selection logic.
 *
 * Client-side: import { getPreferredEthWallet, walletLabel, WALLET_CLIENT_LABELS }
 * Server-side: import { getPreferredEthWalletFromAccounts }
 *
 * Both functions implement the same rule: prefer external wallets (MetaMask, etc.)
 * over Privy embedded wallets. Falls back to the first available wallet, or null.
 */

import type { WalletWithMetadata } from "@privy-io/react-auth";

/** Labels for wallet client types, used in WalletList and Settings. */
export const WALLET_CLIENT_LABELS: Record<string, string> = {
  privy: "Embedded",
  metamask: "MetaMask",
  coinbase_wallet: "Coinbase",
  rainbow: "Rainbow",
  phantom: "Phantom",
  wallet_connect: "WalletConnect",
  solflare: "Solflare",
};

/** Human-readable label for a wallet's client type. */
export function walletLabel(wallet: WalletWithMetadata): string {
  const clientType = wallet.walletClientType;
  if (!clientType) return "External";
  return WALLET_CLIENT_LABELS[clientType] ?? "External";
}

/**
 * Client-side: pick the preferred Ethereum wallet from a Privy user's linked accounts.
 * Prefers external wallets (MetaMask, Rainbow, etc.) over embedded Privy wallets.
 * Returns null when no Ethereum wallet is linked.
 */
export function getPreferredEthWallet(
  linkedAccounts: ReadonlyArray<{ type: string; chainType?: string; walletClientType?: string; address?: string }> | undefined | null,
): WalletWithMetadata | null {
  const ethWallets = (linkedAccounts ?? []).filter(
    (a) => a.type === "wallet" && a.chainType === "ethereum",
  ) as WalletWithMetadata[];
  return (
    ethWallets.find((w) => w.walletClientType !== "privy") ??
    ethWallets[0] ??
    null
  );
}

/**
 * Server-side: pick the preferred Ethereum wallet from Privy server SDK linked accounts.
 * Same logic as getPreferredEthWallet but accepts the server-side account shape.
 * Returns { address, walletClientType } or null.
 */
export function getPreferredEthWalletFromAccounts(
  linkedAccounts: ReadonlyArray<{ type: string; chainType?: string; walletClientType?: string; address?: string }> | undefined | null,
): { address: string; walletClientType?: string } | null {
  const ethWallets = (linkedAccounts ?? []).filter(
    (a) => a.type === "wallet" && a.chainType === "ethereum",
  ) as Array<{ address: string; walletClientType?: string; type: string; chainType: string }>;
  return (
    ethWallets.find((w) => w.walletClientType !== "privy") ??
    ethWallets[0] ??
    null
  );
}
```

- [ ] **Step 2: Verify the file compiles**

Run: `bunx tsc --noEmit src/shared/utils/wallet.ts 2>&1 | head -20`
Expected: No errors (or only errors from missing module resolution context, which is fine since this is a standalone check).

- [ ] **Step 3: Commit**

```bash
git add src/shared/utils/wallet.ts
git commit -m "feat: add shared wallet selection utility

Extracts the 'prefer external over embedded' wallet logic into a
reusable utility with proper TypeScript types."
```

---

### Task 2: Guard syncWalletAddress against re-populating disconnected wallets

**Files:**
- Modify: `src/core/database/queries/users.ts:122-135`

The background wallet sync in `getAuthUser()` fires on every authenticated request. If a user disconnects their wallet (sets `walletAddress` to null via `removeWalletAddress`), the sync immediately re-writes it on the next page load because the wallet is still linked in Privy. This task adds a guard: if the stored address is `null`, the sync skips the write.

- [ ] **Step 1: Read current `syncWalletAddress` implementation**

Read: `src/core/database/queries/users.ts:118-135`

Confirm the function currently only checks `existing[0]?.walletAddress === walletAddress` (same-address early return) but does NOT check whether the address was intentionally cleared.

- [ ] **Step 2: Update `syncWalletAddress` to guard against null overwrites**

In `src/core/database/queries/users.ts`, replace the existing `syncWalletAddress` function:

```typescript
/**
 * Sync wallet address from Privy to the users table.
 * Called during auth when a wallet address is available.
 * Skips the write if the user has no stored address (they may have
 * intentionally disconnected) or if the address is already current.
 */
export async function syncWalletAddress(userId: string, walletAddress: string) {
  const existing = await db
    .select({ walletAddress: users.walletAddress })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const storedAddress = existing[0]?.walletAddress;

  // Already current — nothing to do
  if (storedAddress === walletAddress) return;

  // If stored address is null, the user may have disconnected intentionally.
  // Only populate on first sync (when the row has never had a wallet).
  // A null walletAddress after a disconnect should be respected.
  if (storedAddress === null) return;

  invalidateUserCache("");
  await db
    .update(users)
    .set({ walletAddress, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
```

- [ ] **Step 3: Verify the build still passes**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/core/database/queries/users.ts
git commit -m "fix: prevent wallet sync from overwriting disconnected wallet

syncWalletAddress now skips the write when the stored address is null,
respecting the user's intentional disconnect action."
```

---

### Task 3: Apply shared wallet utility across all call sites

**Files:**
- Modify: `src/app/_lib/auth.ts:29-35`
- Modify: `src/app/(auth)/onboarding/_components/onboarding-form.tsx:168-175`
- Modify: `src/app/(platform)/settings/page.tsx:100-107`
- Modify: `src/app/_actions/members.ts:369-371`
- Modify: `src/app/(platform)/passport/page.tsx:83-85`

Replace all 5 duplicated wallet-selection patterns with the shared utility.

- [ ] **Step 1: Update `auth.ts` (server-side)**

In `src/app/_lib/auth.ts`, add the import at the top:

```typescript
import { getPreferredEthWalletFromAccounts } from "@utils/wallet";
```

Replace lines 29-35 (the filter+find block inside the `.then()` callback):

```typescript
        const wallet = getPreferredEthWalletFromAccounts(privyUser?.linkedAccounts);
```

Remove the old `ethWallets` variable and the comment block. The surrounding `if (wallet?.address && user)` guard remains unchanged.

- [ ] **Step 2: Update `onboarding-form.tsx` (client-side)**

In `src/app/(auth)/onboarding/_components/onboarding-form.tsx`, add the import:

```typescript
import { getPreferredEthWallet } from "@utils/wallet";
```

Replace lines 168-175:

```typescript
  // Get current Privy ETH wallet — prefer external (MetaMask, etc.) over embedded
  const privyEthWallet = getPreferredEthWallet(user?.linkedAccounts);
```

- [ ] **Step 3: Update `settings/page.tsx` (client-side)**

In `src/app/(platform)/settings/page.tsx`, add the import:

```typescript
import { getPreferredEthWallet } from "@utils/wallet";
```

Replace lines 100-107:

```typescript
  // Find the user's ETH wallet — prefer external (MetaMask, etc.) over embedded
  const privyWallet = getPreferredEthWallet(privyUser?.linkedAccounts);
```

- [ ] **Step 4: Update `members.ts` backfill action (server-side)**

In `src/app/_actions/members.ts`, add the import:

```typescript
import { getPreferredEthWalletFromAccounts } from "@utils/wallet";
```

Replace lines 369-371:

```typescript
        const wallet = getPreferredEthWalletFromAccounts(privyUser?.linkedAccounts);
```

- [ ] **Step 5: Update `passport/page.tsx`**

In `src/app/(platform)/passport/page.tsx`, add the import:

```typescript
import { getPreferredEthWallet } from "@utils/wallet";
```

Replace lines 83-85:

```typescript
  const walletAccount = getPreferredEthWallet(user?.linkedAccounts);
```

- [ ] **Step 6: Verify build**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/app/_lib/auth.ts src/app/_actions/members.ts \
  "src/app/(auth)/onboarding/_components/onboarding-form.tsx" \
  "src/app/(platform)/settings/page.tsx" \
  "src/app/(platform)/passport/page.tsx"
git commit -m "refactor: use shared wallet utility across all call sites

Replaces 5 duplicated wallet-preference patterns with
getPreferredEthWallet / getPreferredEthWalletFromAccounts.
Also fixes members.ts backfill and passport/page.tsx which were
still using the old .find() without external-wallet preference."
```

---

### Task 4: Fix "Privy wallet detected" label for external wallets

**Files:**
- Modify: `src/app/(platform)/settings/page.tsx:239-241`

After Task 3, `privyWallet` prefers external wallets, but the label still says "Privy wallet detected" regardless. This is factually wrong when the selected wallet is MetaMask, Rainbow, etc.

- [ ] **Step 1: Add `walletLabel` import to settings/page.tsx**

```typescript
import { getPreferredEthWallet, walletLabel } from "@utils/wallet";
```

(If already importing `getPreferredEthWallet` from Task 3, just add `walletLabel` to the import.)

- [ ] **Step 2: Update the label at line 239-241**

Replace:

```tsx
                    <p className="text-xs text-gray-400">
                      Privy wallet detected
                    </p>
```

With:

```tsx
                    <p className="text-xs text-gray-400">
                      {privyWallet?.walletClientType === "privy"
                        ? "Embedded wallet"
                        : "External wallet"} detected
                    </p>
```

- [ ] **Step 3: Commit**

```bash
git add "src/app/(platform)/settings/page.tsx"
git commit -m "fix: show correct wallet type label in settings

Displays 'External wallet detected' for MetaMask/Rainbow etc.
instead of the hardcoded 'Privy wallet detected'."
```

---

### Task 5: Replace `npx` with `bunx` in package.json scripts

**Files:**
- Modify: `package.json:11-12`

CLAUDE.md states "Always use `bun` (not npm/node)." Both `format` and `lint` scripts invoke `npx`.

- [ ] **Step 1: Update package.json scripts**

Replace line 11:

```json
    "format": "bunx prettier --write \"{__tests__,components,pages,styles,src}/**/*.{ts,tsx,js,jsx}\"",
```

Replace line 12:

```json
    "lint": "eslint . && bunx prettier --check \"{__tests__,components,pages,styles,src}/**/*.{ts,tsx,js,jsx}\" && bunx tsc --noEmit",
```

- [ ] **Step 2: Verify scripts run**

Run: `bun run format 2>&1 | tail -3`
Expected: Prettier runs without errors.

Run: `bun run lint 2>&1 | tail -5`
Expected: ESLint + Prettier + tsc run (lint errors are fine, the scripts themselves should execute).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "fix: replace npx with bunx in format and lint scripts

Aligns with CLAUDE.md rule: always use bun, not npm/node."
```

---

### Task 6: Disable Solana auto-connect

**Files:**
- Modify: `src/app/_providers/privy-provider.tsx:12-14`

`shouldAutoConnect: true` silently links any detected Solana browser extension (Phantom, etc.) without user consent. Combined with `createOnLogin: "all-users"`, this creates wallet address exposure before the user opts in.

- [ ] **Step 1: Set `shouldAutoConnect` to `false`**

In `src/app/_providers/privy-provider.tsx`, replace lines 12-14:

```typescript
const solanaConnectors = toSolanaWalletConnectors({
  shouldAutoConnect: false,
});
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_providers/privy-provider.tsx
git commit -m "fix: disable Solana wallet auto-connect

Requires explicit user action to connect external Solana wallets,
preventing silent wallet address exposure on page load."
```

---

### Task 7: Add error state to WalletList

**Files:**
- Modify: `src/shared/components/WalletList.tsx:32,54-70`

Wallet creation errors are caught and logged to `console.error` but never shown to the user. The button re-enables silently after a failure.

- [ ] **Step 1: Add error state and display**

In `src/shared/components/WalletList.tsx`, add an error state after the existing `isCreating` state:

```typescript
const [isCreating, setIsCreating] = useState(false);
const [createError, setCreateError] = useState("");
```

Update the `handleCreateWallet` callback to set the error:

```typescript
const handleCreateWallet = useCallback(
  async (type: "ethereum" | "solana") => {
    setIsCreating(true);
    setCreateError("");
    try {
      if (type === "ethereum") {
        await createEthereumWallet();
      } else if (type === "solana") {
        await createSolanaWallet();
      }
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      setCreateError(error?.message || "Failed to create wallet. Please try again.");
    } finally {
      setIsCreating(false);
    }
  },
  [createEthereumWallet, createSolanaWallet],
);
```

Add error display inside the return JSX, right before the closing `</div>` of the outer container:

```tsx
      {createError && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700">{createError}</p>
        </div>
      )}
    </div>
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/components/WalletList.tsx
git commit -m "fix: display wallet creation errors to user

Previously errors were only logged to console. Now shows an
inline error message when wallet creation fails."
```

---

### Task 8: Split `isCreating` state by chain

**Files:**
- Modify: `src/shared/components/WalletList.tsx:32,54-70,87-90,128-132`

A single boolean disables both chain buttons when either is creating.

- [ ] **Step 1: Replace single `isCreating` with per-chain states**

Replace:

```typescript
const [isCreating, setIsCreating] = useState(false);
```

With:

```typescript
const [isCreatingEth, setIsCreatingEth] = useState(false);
const [isCreatingSol, setIsCreatingSol] = useState(false);
```

Update `handleCreateWallet`:

```typescript
const handleCreateWallet = useCallback(
  async (type: "ethereum" | "solana") => {
    const setCreating = type === "ethereum" ? setIsCreatingEth : setIsCreatingSol;
    setCreating(true);
    setCreateError("");
    try {
      if (type === "ethereum") {
        await createEthereumWallet();
      } else if (type === "solana") {
        await createSolanaWallet();
      }
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      setCreateError(error?.message || "Failed to create wallet. Please try again.");
    } finally {
      setCreating(false);
    }
  },
  [createEthereumWallet, createSolanaWallet],
);
```

Update the Ethereum create button (around line 87):

```tsx
<button
  onClick={() => handleCreateWallet("ethereum")}
  disabled={isCreatingEth}
  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
>
  {isCreatingEth ? "Creating\u2026" : "Create Embedded Wallet"}
</button>
```

Update the Solana create button (around line 128):

```tsx
<button
  onClick={() => handleCreateWallet("solana")}
  disabled={isCreatingSol}
  className="text-sm bg-violet-600 hover:bg-violet-700 py-2 px-4 rounded-md text-white disabled:bg-violet-400 disabled:cursor-not-allowed focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
>
  {isCreatingSol ? "Creating\u2026" : "Create Embedded Wallet"}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/components/WalletList.tsx
git commit -m "fix: split wallet creation loading state by chain

ETH and Solana create buttons now have independent loading states
so one chain's creation doesn't block the other's button."
```

---

### Task 9: Fix `profileSaving` state in Settings

**Files:**
- Modify: `src/app/(platform)/settings/page.tsx:377-404`

`handleSaveProfile` calls `mutate()` (fire-and-forget) then immediately flips `profileSaving` to `false` in the `finally` block. The loading state is unreliable. Since the button already has `disabled={profileSaving || updateMemberProfile.isPending}`, the simplest fix is to remove the redundant `profileSaving` for this handler and rely solely on `isPending`.

- [ ] **Step 1: Simplify `handleSaveProfile`**

Replace the current implementation at lines 377-404:

```typescript
  const handleSaveProfile = useCallback(() => {
    setProfileMsg("");
    const data: UpdateProfileInput = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      employer: employer.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      industry: industry.trim() || undefined,
      availability: availability || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      zip: zip.trim() || undefined,
      civicInterests: civicInterests.trim() || undefined,
      skills: skills.trim() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      twitterUrl: twitterUrl.trim() || undefined,
      githubUrl: githubUrl.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
    };
    updateMemberProfile.mutate(data, {
      onSuccess: () => setProfileMsg("Profile updated!"),
      onError: () => setProfileMsg("Failed to update profile"),
    });
  }, [
    firstName,
    lastName,
    employer,
    jobTitle,
    industry,
    availability,
    city,
    state,
    zip,
    civicInterests,
    skills,
    linkedinUrl,
    twitterUrl,
    githubUrl,
    websiteUrl,
    updateMemberProfile,
  ]);
```

Then find the Save Profile button and replace `profileSaving || updateMemberProfile.isPending` with just `updateMemberProfile.isPending`, and update the button label:

```tsx
<button
  onClick={handleSaveProfile}
  disabled={updateMemberProfile.isPending}
  className="..."
>
  {updateMemberProfile.isPending ? "Saving..." : "Save Profile"}
</button>
```

Remove `profileSaving` state declaration and the `setProfileSaving` import if no longer used elsewhere.

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(platform)/settings/page.tsx"
git commit -m "fix: use mutation isPending instead of unreliable profileSaving state

profileSaving was set to false in a finally block before the
mutation settled. Now relies on updateMemberProfile.isPending
which correctly tracks the async lifecycle."
```

---

### Task 10: Update CLAUDE.md to document `checkAdmin()`

**Files:**
- Modify: `CLAUDE.md`

`requireAdmin()` now hard-redirects non-admins and returns `isAdmin: true as const`. The new `checkAdmin()` function provides the soft-check pattern. CLAUDE.md still documents the old behavior.

- [ ] **Step 1: Update the Authentication section in CLAUDE.md**

Find the `requireAdmin()` line in the auth function list and replace it:

```markdown
// requireAdmin()   — redirects to '/' if not admin, returns { ...auth, isAdmin: true }
// checkAdmin()     — soft check, returns { ...auth, isAdmin: boolean } (no redirect)
```

- [ ] **Step 2: Update the Admin RBAC section**

Replace the example that shows `requireAdmin()` + `if (!isAdmin)`:

```markdown
### Admin RBAC

Admin routes are guarded at two levels:
1. **Layout level** (`(platform)/admin/layout.tsx`): server-side redirect for non-admins
2. **Action level**: each admin action checks access before proceeding

For hard gates (redirect non-admins):
```typescript
export async function deleteUser(id: string) {
  await requireAdmin(); // redirects if not admin — no further check needed
  return membersService.deleteUser(id);
}
```

For soft checks (return empty/filtered data):
```typescript
export async function getRoles() {
  const { isAdmin } = await checkAdmin();
  if (!isAdmin) return [];
  return rbacService.getAllRoles();
}
```
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document checkAdmin() and updated requireAdmin() behavior

requireAdmin() now hard-redirects, checkAdmin() provides the
soft-check pattern that returns isAdmin: boolean."
```

---

### Task 11: Move `walletLabel` and `WALLET_CLIENT_LABELS` out of WalletList

**Files:**
- Modify: `src/shared/components/WalletList.tsx:11-25`

These were defined inline in WalletList.tsx but are now exported from `src/shared/utils/wallet.ts` (Task 1). Remove the duplicates and import from the shared utility.

- [ ] **Step 1: Update WalletList.tsx imports**

Add to the import section:

```typescript
import { walletLabel } from "@utils/wallet";
```

Remove the `WALLET_CLIENT_LABELS` constant and the `walletLabel` function from WalletList.tsx (lines 11-25).

- [ ] **Step 2: Verify build**

Run: `bun run build 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/WalletList.tsx
git commit -m "refactor: import walletLabel from shared utility

Removes duplicate WALLET_CLIENT_LABELS and walletLabel from
WalletList.tsx in favor of the shared @utils/wallet module."
```

---

## Execution Order

Tasks can be partially parallelized:

```
Task 1 (wallet utility)
  ├── Task 3 (apply utility) → Task 4 (fix label)
  └── Task 11 (dedupe WalletList)

Task 2 (sync guard) — independent

Task 5 (bunx) — independent
Task 6 (auto-connect) — independent
Task 7 (error state) → Task 8 (split isCreating)
Task 9 (profileSaving) — independent
Task 10 (CLAUDE.md) — independent
```

**Critical path:** Task 1 → Task 3 → Task 4 (wallet utility must exist before consumers can use it)

**Recommended serial order:** 1 → 2 → 3 → 4 → 11 → 5 → 6 → 7 → 8 → 9 → 10
