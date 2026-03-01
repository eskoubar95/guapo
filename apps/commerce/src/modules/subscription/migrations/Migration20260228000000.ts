import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260228000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "medusa"."subscription" (
        "id" text not null,
        "customer_id" text not null,
        "status" text not null default 'active',
        "cycle_weeks" integer not null,
        "next_renewal_at" timestamptz not null,
        "last_renewal_at" timestamptz null,
        "delivery_count" integer not null default 0,
        "stripe_customer_id" text not null,
        "stripe_payment_method_id" text not null,
        "discount_percent" integer not null default 5,
        "variant_id" text not null,
        "quantity" integer not null default 1,
        "shipping_address" jsonb not null,
        "billing_address" jsonb not null,
        "shipping_option_id" text not null,
        "metadata" jsonb null,
        "retry_count" integer not null default 0,
        "next_retry_at" timestamptz null,
        "skip_next" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "subscription_pkey" primary key ("id")
      );
    `);
    this.addSql(
      `create index if not exists "IDX_subscription_customer_id" on "medusa"."subscription" ("customer_id");`
    );
    this.addSql(
      `create index if not exists "IDX_subscription_status" on "medusa"."subscription" ("status");`
    );
    this.addSql(
      `create index if not exists "IDX_subscription_next_renewal_at" on "medusa"."subscription" ("next_renewal_at");`
    );
    this.addSql(
      `create index if not exists "IDX_subscription_status_next_renewal" on "medusa"."subscription" ("status", "next_renewal_at");`
    );
    this.addSql(
      `create index if not exists "IDX_subscription_deleted_at" on "medusa"."subscription" ("deleted_at") where deleted_at is null;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "medusa"."subscription" cascade;`);
  }
}
