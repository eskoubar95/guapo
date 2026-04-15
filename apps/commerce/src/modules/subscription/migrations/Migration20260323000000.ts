import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260323000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "last_failure_reason" text null;`
    );
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "last_renewal_order_id" text null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" drop column if exists "last_renewal_order_id";`
    );
    this.addSql(
      `alter table "medusa"."subscription" drop column if exists "last_failure_reason";`
    );
  }
}
