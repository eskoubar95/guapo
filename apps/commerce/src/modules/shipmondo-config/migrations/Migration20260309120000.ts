import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260309120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create schema if not exists "medusa";
    `);
    this.addSql(`
      create table if not exists "medusa"."shipmondo_enabled_products" (
        "id" text not null,
        "product_code" text not null,
        "carrier_name" text not null,
        "enabled" boolean not null default true,
        "display_order" integer null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        constraint "shipmondo_enabled_products_pkey" primary key ("id")
      );
    `);
    this.addSql(`
      create unique index if not exists "IDX_shipmondo_enabled_products_product_code"
      on "medusa"."shipmondo_enabled_products" ("product_code");
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "medusa"."shipmondo_enabled_products" cascade;`);
  }
}
