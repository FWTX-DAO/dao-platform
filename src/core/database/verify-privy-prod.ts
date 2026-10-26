/**
 * Verify the production Privy app against Privy's security checklist and
 * reconcile its users with the DB. Read-only — makes no writes to Privy or the DB.
 *
 * Checklist: https://docs.privy.io/security/implementation-guide/security-checklist
 *
 * Run with PRODUCTION credentials in .env.production.local
 * (NEXT_PUBLIC_PRIVY_APP_ID, PRIVY_APP_SECRET, DATABASE_URL):
 *   bun run privy:verify
 *
 * Exits 1 if any check FAILs.
 */
import { PrivyClient } from "@privy-io/node";
import { db, users } from "./index";

const PROD_ORIGIN = "https://dao.fwtx.city";
const DEV_ORIGIN =
  /localhost|127\.0\.0\.1|^http:|\.netlify\.app|\.vercel\.app|ngrok/i;

type Level = "PASS" | "WARN" | "FAIL" | "INFO";
const results: Array<{ level: Level; check: string; detail: string }> = [];

function report(level: Level, check: string, detail = "") {
  results.push({ level, check, detail });
}

async function checkAppConfig(privy: PrivyClient, appId: string) {
  const app = await privy.apps().get(appId);
  report("INFO", "app", `${app.name} (${app.id})`);

  // Allowed domains — the main control keeping the app ID off other origins
  const domains = app.allowed_domains;
  if (domains.length === 0) {
    report("FAIL", "allowed domains", "empty — any origin can use this app ID");
  } else {
    const devOrigins = domains.filter((d) => DEV_ORIGIN.test(d));
    const others = domains.filter(
      (d) => d !== PROD_ORIGIN && !devOrigins.includes(d),
    );
    if (!domains.includes(PROD_ORIGIN)) {
      report("FAIL", "allowed domains", `${PROD_ORIGIN} is not listed`);
    }
    if (devOrigins.length > 0) {
      report(
        "FAIL",
        "allowed domains",
        `dev/preview origins allowed on prod app: ${devOrigins.join(", ")}`,
      );
    }
    if (others.length > 0) {
      report("WARN", "allowed domains", `other origins: ${others.join(", ")}`);
    }
    if (domains.length === 1 && domains[0] === PROD_ORIGIN) {
      report("PASS", "allowed domains", PROD_ORIGIN);
    }
  }

  if (app.allowed_native_app_ids.length > 0) {
    report(
      "WARN",
      "native app IDs",
      `web-only app has native IDs allowed: ${app.allowed_native_app_ids.join(", ")}`,
    );
  }

  // Login methods
  const loginMethods = Object.entries({
    email: app.email_auth,
    sms: app.sms_auth,
    wallet: app.wallet_auth,
    solana_wallet: app.solana_wallet_auth,
    passkey: app.passkey_auth,
    google: app.google_oauth,
    apple: app.apple_oauth,
    twitter: app.twitter_oauth,
    discord: app.discord_oauth,
    github: app.github_oauth,
    linkedin: app.linkedin_oauth,
    telegram: app.telegram_auth,
    farcaster: app.farcaster_auth,
    guest: app.guest_auth,
  })
    .filter(([, enabled]) => enabled)
    .map(([name]) => name);
  report("INFO", "login methods", loginMethods.join(", ") || "(none)");

  if (app.sms_auth) {
    report("WARN", "sms login", "enabled — exposes accounts to SIM swapping");
  }
  if (app.guest_auth) {
    report("WARN", "guest login", "enabled — not used by this app");
  }

  // MFA protects embedded wallets when the primary login is delegated (email/OAuth)
  const mfa = app.mfa_methods as string[];
  if (mfa.length === 0) {
    report(
      "WARN",
      "wallet MFA",
      "no MFA methods enabled (recommend passkey + totp)",
    );
  } else if (mfa.includes("sms")) {
    report("WARN", "wallet MFA", `sms offered as MFA: ${mfa.join(", ")}`);
  } else {
    report("PASS", "wallet MFA", mfa.join(", "));
  }

  report(
    app.captcha_enabled ? "PASS" : "WARN",
    "captcha",
    app.captcha_enabled
      ? (app.enabled_captcha_provider ?? "enabled")
      : "disabled — signups are not bot-protected",
  );

  report(
    "INFO",
    "custom auth domain",
    app.custom_api_url ??
      "none (HttpOnly cookies not set up — add the domain to CSP when enabled)",
  );
  report(
    "INFO",
    "terms / privacy",
    `${app.terms_and_conditions_url ?? "no terms URL"} / ${app.privacy_policy_url ?? "no privacy URL"}`,
  );
}

async function checkUsers(privy: PrivyClient) {
  const privyUsers: any[] = [];
  for await (const u of privy.users().list()) privyUsers.push(u);

  const dbUsers = await db
    .select({
      id: users.id,
      privyDid: users.privyDid,
      username: users.username,
    })
    .from(users);

  report(
    "INFO",
    "users",
    `${privyUsers.length} in Privy, ${dbUsers.length} in DB`,
  );

  const accountTypes: Record<string, number> = {};
  let embeddedWallets = 0;
  let delegatedWallets = 0;
  let mfaUsers = 0;
  for (const u of privyUsers) {
    for (const a of u.linked_accounts ?? []) {
      accountTypes[a.type] = (accountTypes[a.type] ?? 0) + 1;
      if (a.type === "wallet" && a.wallet_client_type === "privy") {
        embeddedWallets++;
        if (a.delegated) delegatedWallets++;
      }
    }
    if ((u.mfa_methods ?? []).length > 0) mfaUsers++;
  }
  report(
    "INFO",
    "linked accounts",
    Object.entries(accountTypes)
      .map(([t, n]) => `${t}=${n}`)
      .join(", "),
  );
  report("INFO", "embedded wallets", `${embeddedWallets}`);
  report("INFO", "users with MFA", `${mfaUsers}/${privyUsers.length}`);

  // Session signers let the server sign with a user's wallet via SESSION_SIGNER_SECRET
  const signerKeySet = !!process.env.SESSION_SIGNER_SECRET;
  if (delegatedWallets > 0 || signerKeySet) {
    report(
      delegatedWallets > 0 ? "WARN" : "INFO",
      "session signers",
      `${delegatedWallets} wallet(s) delegated to a server signer; ` +
        `SESSION_SIGNER_SECRET ${signerKeySet ? "is set" : "not set"}`,
    );
  }

  const privyIds = new Set(privyUsers.map((u) => u.id));
  const dbDids = new Set(dbUsers.map((u) => u.privyDid));

  const seedRows = dbUsers.filter((u) =>
    u.privyDid.startsWith("did:privy:demo-"),
  );
  if (seedRows.length > 0) {
    report(
      "WARN",
      "seed users in DB",
      seedRows.map((u) => `${u.username} (${u.id})`).join(", "),
    );
  }

  // DB rows whose DID doesn't exist in this Privy app can never log in
  const orphans = dbUsers.filter(
    (u) =>
      !privyIds.has(u.privyDid) && !u.privyDid.startsWith("did:privy:demo-"),
  );
  if (orphans.length > 0) {
    report(
      "WARN",
      "DB users missing from Privy",
      orphans
        .map((u) => `${u.username ?? "(no username)"} (${u.id})`)
        .join(", "),
    );
  } else {
    report("PASS", "DB users missing from Privy", "none");
  }

  // Privy users that never reached the server (no DB row yet) — informational
  const unsynced = privyUsers.filter((u) => !dbDids.has(u.id));
  report("INFO", "Privy users without a DB row", `${unsynced.length}`);
}

function checkSecrets() {
  const secret = process.env.PRIVY_APP_SECRET ?? "";
  if (!secret.startsWith("privy_app_secret_")) {
    report(
      "WARN",
      "app secret",
      "legacy-format secret — rotate it (it is shared with dev/preview contexts)",
    );
  } else {
    report("PASS", "app secret", "current format");
  }
}

async function main() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret || appId.startsWith("<")) {
    console.error(
      "Missing NEXT_PUBLIC_PRIVY_APP_ID / PRIVY_APP_SECRET. Put production values in .env.production.local.",
    );
    process.exit(1);
  }

  const privy = new PrivyClient({ appId, appSecret });

  checkSecrets();
  await checkAppConfig(privy, appId);
  await checkUsers(privy);

  const order: Level[] = ["FAIL", "WARN", "PASS", "INFO"];
  for (const level of order) {
    const rows = results.filter((r) => r.level === level);
    if (rows.length === 0) continue;
    console.log(`\n=== ${level} ===`);
    for (const r of rows) console.log(`  ${r.check}: ${r.detail}`);
  }

  const failed = results.some((r) => r.level === "FAIL");
  console.log(failed ? "\nResult: FAIL" : "\nResult: OK");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
