import type { Migration } from "./migration.types.js";

// Ties fill-ups and daily driving logs to the vehicle they were actually
// for. Nullable and ON DELETE SET NULL (not CASCADE) on both counts:
// every row logged before this migration - and anyone who never bothers
// picking a vehicle - has no vehicle_id and must keep working unassigned,
// and deleting a vehicle should unassign its history, not destroy it.
export const addVehicleIdToHistoryMigration: Migration = {
  id: "007_add_vehicle_id_to_history",
  description: "Add vehicle_id to fill_up_history and daily_driving_logs",

  async up(client) {
    await client.query(`
      ALTER TABLE fill_up_history
        ADD COLUMN vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

      CREATE INDEX fill_up_history_vehicle_id_idx
        ON fill_up_history (vehicle_id);

      ALTER TABLE daily_driving_logs
        ADD COLUMN vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

      CREATE INDEX daily_driving_logs_vehicle_id_idx
        ON daily_driving_logs (vehicle_id);
    `);
  },
};
