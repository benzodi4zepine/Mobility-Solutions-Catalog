import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const referralsTable = pgTable("referrals", {
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertReferralSchema = createInsertSchema(referralsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referralsTable.$inferSelect;