import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/**
 * D1 is SQLite, so this mirrors lib/db's Postgres table rather than reusing it:
 * same columns and names, SQLite types. `createdAt` is stored as an ISO string
 * so a referral reads the same in `wrangler d1 execute` as it does in the
 * email the clinic received.
 */
export const referralsTable = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referrerName: text("referrer_name").notNull(),
  organization: text("organization").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  areaOfNeed: text("area_of_need").notNull(),
  clinicalNotes: text("clinical_notes").notNull(),
  preferredContact: text("preferred_contact").notNull(),
  createdAt: text("created_at").notNull(),
});

/**
 * The rate-limit counter.
 *
 * It holds a salted hash of the caller's address, never the address itself:
 * the only question being asked is "is this the same caller as a moment ago",
 * and a hash answers it without the site keeping a log of who visited. Rows
 * older than the window are swept on write.
 */
export const rateLimitTable = sqliteTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: integer("reset_at").notNull(),
});
