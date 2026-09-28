-- Referrals submitted through the website, and the counter that keeps the
-- clinic's inbox from being flooded.
CREATE TABLE IF NOT EXISTS referrals (
  id                TEXT PRIMARY KEY,
  referrer_name     TEXT NOT NULL,
  organization      TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,
  patient_name      TEXT NOT NULL,
  patient_age       INTEGER,
  area_of_need      TEXT NOT NULL,
  clinical_notes    TEXT NOT NULL,
  preferred_contact TEXT NOT NULL,
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS referrals_created_at ON referrals (created_at);

-- `key` is a salted hash of the caller's address, never the address itself.
CREATE TABLE IF NOT EXISTS rate_limit (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
