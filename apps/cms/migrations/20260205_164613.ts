import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."categories_locales" (
  	"name" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."brands_locales" (
  	"display_name" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."product_types_locales" (
  	"name" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."brands_locales" ADD CONSTRAINT "brands_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_types_locales" ADD CONSTRAINT "product_types_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_types"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "payload"."categories_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "brands_locales_locale_parent_id_unique" ON "payload"."brands_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "product_types_locales_locale_parent_id_unique" ON "payload"."product_types_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload"."categories" DROP COLUMN "name";
  ALTER TABLE "payload"."categories" DROP COLUMN "slug";
  ALTER TABLE "payload"."categories" DROP COLUMN "meta_title";
  ALTER TABLE "payload"."categories" DROP COLUMN "meta_description";
  ALTER TABLE "payload"."categories" DROP COLUMN "body";
  ALTER TABLE "payload"."brands" DROP COLUMN "display_name";
  ALTER TABLE "payload"."brands" DROP COLUMN "meta_title";
  ALTER TABLE "payload"."brands" DROP COLUMN "meta_description";
  ALTER TABLE "payload"."brands" DROP COLUMN "body";
  ALTER TABLE "payload"."product_types" DROP COLUMN "name";
  ALTER TABLE "payload"."product_types" DROP COLUMN "meta_title";
  ALTER TABLE "payload"."product_types" DROP COLUMN "meta_description";
  ALTER TABLE "payload"."product_types" DROP COLUMN "body";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."categories_locales" CASCADE;
  DROP TABLE "payload"."brands_locales" CASCADE;
  DROP TABLE "payload"."product_types_locales" CASCADE;
  ALTER TABLE "payload"."categories" ADD COLUMN "name" varchar;
  ALTER TABLE "payload"."categories" ADD COLUMN "slug" varchar;
  ALTER TABLE "payload"."categories" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "payload"."categories" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload"."categories" ADD COLUMN "body" jsonb;
  ALTER TABLE "payload"."brands" ADD COLUMN "display_name" varchar;
  ALTER TABLE "payload"."brands" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "payload"."brands" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload"."brands" ADD COLUMN "body" jsonb;
  ALTER TABLE "payload"."product_types" ADD COLUMN "name" varchar;
  ALTER TABLE "payload"."product_types" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "payload"."product_types" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "payload"."product_types" ADD COLUMN "body" jsonb;`)
}
