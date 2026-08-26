import type { Migration } from "./migration.types.js";

// Creates one-row-per-day driving check-ins, a lighter-weight companion
// to fill_up_history: instead of waiting for a full tank to infer miles
// driven per day, a user can log today's mileage directly. Feeds the same
// dailyMiles signal in the frontend's computeFillUpStats (see
// apps/frontend/lib/finance-projections.ts).
export const createDailyDrivingLogsMigration: Migration = {
  id: "006_create_daily_driving_logs",
  description: "Create the daily_driving_logs table",

  async up(client) {
    await client.query(`
      CREATE TABLE daily_driving_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

        user_id UUID NOT NULL
          REFERENCES users(id)
          ON DELETE CASCADE,

        log_date DATE NOT NULL,
        miles_driven NUMERIC(6, 2) NOT NULL CHECK (miles_driven >= 0),

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (user_id, log_date)
      );

      CREATE INDEX daily_driving_logs_user_id_log_date_idx
        ON daily_driving_logs (user_id, log_date DESC);
    `);
  },
};
