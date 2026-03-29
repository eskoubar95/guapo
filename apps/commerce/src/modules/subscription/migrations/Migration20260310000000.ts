import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260310000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "group_id" varchar null;`
    );
    this.addSql(
      `create index if not exists "idx_subscription_group_id" on "medusa"."subscription" ("group_id");`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop index if exists "medusa"."idx_subscription_group_id";`
    );
    this.addSql(
      `alter table "medusa"."subscription" drop column if exists "group_id";`
    );
  }
}
