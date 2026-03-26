import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260323120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "delivery_data" jsonb null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "medusa"."subscription" drop column if exists "delivery_data";`);
  }
}
