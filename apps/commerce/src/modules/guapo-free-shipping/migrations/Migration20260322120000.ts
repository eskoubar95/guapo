import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260322120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "medusa"."guapo_free_shipping_setting" (
        "id" text not null,
        "threshold_amount" integer not null default 499,
        "promotion_code" text not null default 'FREESHIPPING',
        "enabled" boolean not null default true,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "guapo_free_shipping_setting_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `create index if not exists "IDX_guapo_free_shipping_setting_deleted_at" on "medusa"."guapo_free_shipping_setting" ("deleted_at") where deleted_at is null;`
    );
    this.addSql(`
      insert into "medusa"."guapo_free_shipping_setting" ("id", "threshold_amount", "promotion_code", "enabled", "created_at", "updated_at")
      values ('guapo_frsp_default', 499, 'FREESHIPPING', true, now(), now())
      on conflict ("id") do nothing;
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "medusa"."guapo_free_shipping_setting" cascade;`);
  }
}
