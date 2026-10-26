# Verified email, referral rewards, and dashboard release

This change prevents placeholder usernames and incomplete email onboarding, adds member invitations, and places the weekly roundtable first on the dashboard. The content area uses the available width with 20–24 px of space below the existing sticky navbar. “Invite a friend” appears beside Passport, Billing, and Settings in the lower sidebar and opens `/referrals`.

## Reward policy

| Event                                       | Inviter reward |
| ------------------------------------------- | -------------: |
| First completed signup using an invitation  |  5 points once |
| First successful monthly membership payment |      10 points |
| Each successful monthly renewal             |      10 points |
| First successful annual membership payment  |     120 points |
| Each successful annual renewal              |     120 points |

The annual reward is explicitly 120 points for the $49 annual plan. Signup points are separate from payment points. Every existing user receives a stable code, and new identities receive one on creation. Invitations are attributed only on first onboarding, never retroactively to existing members. Attribution cannot move between inviters. Self-referrals and repeated signup rewards for the same normalized verified email are prevented.

The reward ledger, member point balance, and activity entry update in one transaction. A unique invoice key makes duplicate and reordered Stripe payment deliveries safe. Points apply to positive paid USD subscription-creation and renewal invoices for known membership prices. Discounts reduce points proportionally, taxes are excluded, and rewards are capped at the normal tier reward. Prorations, upgrades, unpaid/free invoices, manually marked out-of-band payments, and mixed product invoices do not earn points. Historical payments before attribution do not earn points. Refund/chargeback clawbacks are not automated by this change.

The member's existing subscription-created bonus remains separate from the inviter's rewards.

## Privy email enforcement

Reviewed installed versions: `@privy-io/react-auth` 3.51.0 and `@privy-io/node` 0.36.0. Production already has email authentication/linking enabled. Its allowed origin remains `https://dao.fwtx.city`; no localhost origin is needed for server API operations or fixture tests.

The client links and verifies an email using Privy's `useLinkAccount().linkEmail()`. The server reads Privy's current linked-account record and accepts only verified email accounts or verified Google/Apple accounts with email. Client form values and access-token email claims are not proof of ownership. Onboarding refuses missing or mismatched email before writing completion state. Both layouts use the same completion predicate, preventing redirect loops. Existing completed members without a matching provider email get a one-step profile repair flow; their profile fields and membership are preserved.

There is no mandatory-email switch in the installed provider configuration. Enabling email authentication makes verification available; the application completion guard makes it mandatory while retaining wallet login. Relevant documentation: [Privy account linking](https://docs.privy.io/user-management/users/linking-accounts), [login methods](https://docs.privy.io/basics/get-started/dashboard/configure-login-methods), [Stripe subscription webhooks](https://docs.stripe.com/billing/subscriptions/webhooks).

## Production cleanup

The reviewed manifest contains 38 exact legacy `user_[8 characters]` accounts and 29 empty member records, with no billing, roles, content, or activity dependencies. They have 76 embedded wallets. The user explicitly approved deleting these identities, including wallet disassociation. Limited balance checks found zero ETH, SOL, USDC, and Ethereum USDT; Solana USDT checks were unsupported, and other assets were not assessed. [Privy deletion is irreversible and disconnects embedded wallets](https://docs.privy.io/user-management/users/managing-users/deleting-users).

`prune-default-users.ts` is read-only by default. Apply requires the exact approved report SHA-256, explicit count, matching database and Privy app, and wallet-disassociation confirmation. It prechecks every candidate, then locks each user/member and checks dependencies again immediately before deletion. It refuses changed identities or new profile/billing/content data. Only the explicit user, empty member, and optional unused referral code are deleted; it does not cascade.

Privy and PostgreSQL cannot commit atomically. The runner saves a private journal before the provider operation, after provider deletion, and after the database commit. Any error stops the remaining work. A resume must use that same manifest and journal; it tolerates a missing provider identity only when the journal already records an attempted deletion. Verification checks absence in both systems. Preserve the private report and journal for incident review; a database snapshot cannot restore a deleted Privy wallet association.

## Release sequence

1. Complete the approved exact-manifest cleanup and verify it. Obtain a fresh read-only inventory and migration plan.
2. Review `0003_verified_email_referrals.sql` and `0004_reserved_usernames.sql`. The targeted runner refuses missing baseline columns, partial feature migrations, and remaining `user_` names. Its plan writes transaction SQL plus the target fingerprint and combined source hash.
3. Apply the reviewed plan with `--apply --sha256=<plan hash> --target=<plan target>`. This backfills codes, adds the verified-email marker and completion check, adds invoice/reward uniqueness, and prohibits the `user_` prefix. Existing empty-email completed profiles return to onboarding; none were found in the production audit.
4. Deploy this application change immediately after migration in a coordinated release. The old code still generates placeholder names, so the new database username constraint will reject old-code first-login writes. The new code requires the new tables/columns; do not deploy it before the migration. Do not leave the old build serving new signups after applying the constraint.
5. Verify a signed-in dashboard, sidebar referral page, existing-member email repair, a fresh email-verified signup, invitation attribution, and successful membership payment/renewal. Verify the released SHA and provider/webhook state separately from local tests. Do not create real payments solely as smoke tests.

The production migration journal is empty despite the populated schema. The targeted runner intentionally does not fabricate historical migration entries. Do not use the ordinary Drizzle migrator until baseline history has been separately reconciled. Do not roll back to code that creates `user_` names while the constraint is installed.

## Validation evidence

- Production cleanup completed on 2026-10-26: 38 users deleted from both PostgreSQL and Privy, 29 empty member rows removed, and each provider deletion verified. Final inventory: 57 database users, 65 Privy users, zero `user_` names. Eight existing completed members need provider email verification when the new guard is released.
- Production migrations `0003` and `0004` were applied together on 2026-10-26. All 57 users received distinct referral codes; the six checked completion, username, attribution, and invoice constraints are validated. The historical Drizzle migration journal remains empty; the baseline warning above still applies.
- Application commits `acd67ed` and `39eb985` are on `origin/main`. Netlify production deploy `6adfc98490dceed5d500ba99` published `39eb985` at 2026-10-26 21:45 UTC. Automatic publishing was restored after the coordinated release.
- The application build and lint/type checks pass; lint reports 15 warnings and no errors. Production smoke checks pass for the public site, unauthenticated route guards, invalid invitations, valid invitation cookies, and rejection of unsigned Stripe webhooks. Invite redirects explicitly use the public app origin because Netlify exposes its internal deploy origin through `request.url`.
- 53 tests pass, including PostgreSQL transactions and signed Stripe webhook handling.
- Coverage includes concurrent identity/onboarding retries, verified email spoof rejection, RBAC rollback, optional wallet savepoints, immutable referral attribution, invoice-before-checkout delivery, duplicate/reordered payments, monthly/annual renewals, and all layers of reserved-name enforcement.
- The targeted runner was exercised on a disposable PostgreSQL 18.6 database populated through migrations `0000`–`0002`: codes were backfilled, a missing-email completed profile was reset, a valid profile was preserved, reserved names were rejected, and a second apply failed closed.
- The desktop dashboard, lower-sidebar invitation link, referral page, and 320-pixel mobile referral layout were checked using synthetic records. These are layout checks, not signed-in production acceptance.
- The redirect regression and policy suite pass 19 tests. Real production email linking, a signed-in profile repair, and a paid membership transaction were not exercised during release verification.
