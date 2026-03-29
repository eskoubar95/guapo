import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260329153000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "medusa"."subscription" add column if not exists "idempotency_key" text null;`
    );

    this.addSql(`
      update "medusa"."subscription"
      set "idempotency_key" = (metadata::jsonb->>'order_id') || ':' || (metadata::jsonb->>'line_item_id')
      where "idempotency_key" is null
        and metadata is not null
        and coalesce(metadata::jsonb->>'order_id', '') <> ''
        and coalesce(metadata::jsonb->>'line_item_id', '') <> '';
    `);

    this.addSql(`
      with ranked as (
        select id,
               row_number() over (
                 partition by idempotency_key
                 order by created_at asc, id asc
               ) as rn
        from "medusa"."subscription"
        where idempotency_key is not null and idempotency_key <> ''
      )
      update "medusa"."subscription" s
      set "idempotency_key" = null
      from ranked r
      where s.id = r.id and r.rn > 1;
    `);

    this.addSql(`
      create unique index if not exists "idx_subscription_idempotency_key_unique"
      on "medusa"."subscription" ("idempotency_key")
      where "idempotency_key" is not null and "idempotency_key" <> '';
    `);
  }

  override async down(): Promise<void> {
    this.addSql(
      `drop index if exists "medusa"."idx_subscription_idempotency_key_unique";`
    );
    this.addSql(
      `alter table "medusa"."subscription" drop column if exists "idempotency_key";`
    );
  }
}
