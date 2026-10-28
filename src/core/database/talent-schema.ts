import { pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * talent.profiles is owned and migrated by the talent-web-form app
 * (talent.fwtx.city). It lives outside schema.ts so drizzle-kit never
 * generates or pushes changes to it. Only the columns this app reads are
 * mapped; legacy email-verification columns are intentionally left out.
 */
export const talentSchema = pgSchema("talent");

export const TALENT_STATUSES = ["verified", "archived"] as const;
export type TalentStatus = (typeof TALENT_STATUSES)[number];

export const talentProfiles = talentSchema.table("profiles", {
  id: uuid("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location").notNull(),
  currentWork: text("current_work").notNull(),
  skills: text("skills").array().notNull(),
  opportunityInterests: text("opportunity_interests").array().notNull(),
  workPreferences: text("work_preferences").array().notNull(),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  xUrl: text("x_url"),
  instagramUrl: text("instagram_url"),
  portfolioUrl: text("portfolio_url"),
  otherSocialUrls: text("other_social_urls").array().notNull(),
  whatDoYouWantToBuild: text("what_do_you_want_to_build").notNull(),
  vision25Years: text("where_do_you_see_yourself_in_25_years").notNull(),
  anythingElse: text("anything_else"),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
  status: text("status").$type<TalentStatus>().notNull(),
  source: text("source").notNull(),
});

export type TalentProfile = typeof talentProfiles.$inferSelect;
