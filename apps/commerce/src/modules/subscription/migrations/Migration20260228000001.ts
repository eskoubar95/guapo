import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260228000001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "on_hold_at" timestamptz null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" drop column if exists "on_hold_at";`
    );
  }
}
