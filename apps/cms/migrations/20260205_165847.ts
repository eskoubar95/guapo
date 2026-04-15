import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."product_guidance_locales" (
  	"skin_types_notes" varchar,
  	"concerns_description" jsonb,
  	"how_to_amount" varchar,
  	"how_to_frequency" varchar,
  	"how_to_tips" jsonb,
  	"routine_time_time" "payload"."enum_product_guidance_routine_time_time",
  	"routine_time_order" numeric,
  	"routine_time_am_notes" varchar,
  	"routine_time_pm_notes" varchar,
  	"routine_time_sunscreen_required" boolean DEFAULT false,
  	"pair_with_routine_suggestion" jsonb,
  	"precautions_patch_test" boolean DEFAULT false,
  	"precautions_pregnancy_safe" "payload"."enum_product_guidance_precautions_pregnancy_safe",
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."ingredients_locales" (
  	"name" varchar NOT NULL,
  	"benefit" varchar,
  	"concentration" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."beneficials_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload"."product_guidance_skin_types_suitable" ADD COLUMN "locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_concerns_primary" ADD COLUMN "locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_ingredients_highlighted" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_ingredients_avoid_with" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_how_to_steps" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_pair_with_recommended" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_pair_with_avoid" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_precautions_warnings" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."ingredients_avoid_with" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."routines_steps" ADD COLUMN "_locale" "payload"."_locales" NOT NULL;
  ALTER TABLE "payload"."product_guidance_locales" ADD CONSTRAINT "product_guidance_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."ingredients_locales" ADD CONSTRAINT "ingredients_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."beneficials_locales" ADD CONSTRAINT "beneficials_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."beneficials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "product_guidance_locales_locale_parent_id_unique" ON "payload"."product_guidance_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "ingredients_locales_locale_parent_id_unique" ON "payload"."ingredients_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "beneficials_locales_locale_parent_id_unique" ON "payload"."beneficials_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_guidance_skin_types_suitable_locale_idx" ON "payload"."product_guidance_skin_types_suitable" USING btree ("locale");
  CREATE INDEX "product_guidance_concerns_primary_locale_idx" ON "payload"."product_guidance_concerns_primary" USING btree ("locale");
  CREATE INDEX "product_guidance_ingredients_highlighted_locale_idx" ON "payload"."product_guidance_ingredients_highlighted" USING btree ("_locale");
  CREATE INDEX "product_guidance_ingredients_avoid_with_locale_idx" ON "payload"."product_guidance_ingredients_avoid_with" USING btree ("_locale");
  CREATE INDEX "product_guidance_how_to_steps_locale_idx" ON "payload"."product_guidance_how_to_steps" USING btree ("_locale");
  CREATE INDEX "product_guidance_pair_with_recommended_locale_idx" ON "payload"."product_guidance_pair_with_recommended" USING btree ("_locale");
  CREATE INDEX "product_guidance_pair_with_avoid_locale_idx" ON "payload"."product_guidance_pair_with_avoid" USING btree ("_locale");
  CREATE INDEX "product_guidance_precautions_warnings_locale_idx" ON "payload"."product_guidance_precautions_warnings" USING btree ("_locale");
  CREATE INDEX "ingredients_avoid_with_locale_idx" ON "payload"."ingredients_avoid_with" USING btree ("_locale");
  CREATE INDEX "routines_steps_locale_idx" ON "payload"."routines_steps" USING btree ("_locale");
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "skin_types_notes";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "concerns_description";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "how_to_amount";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "how_to_frequency";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "how_to_tips";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "routine_time_time";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "routine_time_order";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "routine_time_am_notes";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "routine_time_pm_notes";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "routine_time_sunscreen_required";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "pair_with_routine_suggestion";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "precautions_patch_test";
  ALTER TABLE "payload"."product_guidance" DROP COLUMN "precautions_pregnancy_safe";
  ALTER TABLE "payload"."ingredients" DROP COLUMN "name";
  ALTER TABLE "payload"."ingredients" DROP COLUMN "benefit";
  ALTER TABLE "payload"."ingredients" DROP COLUMN "concentration";
  ALTER TABLE "payload"."beneficials" DROP COLUMN "label";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."product_guidance_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."ingredients_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."beneficials_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."product_guidance_locales" CASCADE;
  DROP TABLE "payload"."ingredients_locales" CASCADE;
  DROP TABLE "payload"."beneficials_locales" CASCADE;
  DROP INDEX "payload"."product_guidance_skin_types_suitable_locale_idx";
  DROP INDEX "payload"."product_guidance_concerns_primary_locale_idx";
  DROP INDEX "payload"."product_guidance_ingredients_highlighted_locale_idx";
  DROP INDEX "payload"."product_guidance_ingredients_avoid_with_locale_idx";
  DROP INDEX "payload"."product_guidance_how_to_steps_locale_idx";
  DROP INDEX "payload"."product_guidance_pair_with_recommended_locale_idx";
  DROP INDEX "payload"."product_guidance_pair_with_avoid_locale_idx";
  DROP INDEX "payload"."product_guidance_precautions_warnings_locale_idx";
  DROP INDEX "payload"."ingredients_avoid_with_locale_idx";
  DROP INDEX "payload"."routines_steps_locale_idx";
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "skin_types_notes" varchar;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "concerns_description" jsonb;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "how_to_amount" varchar;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "how_to_frequency" varchar;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "how_to_tips" jsonb;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "routine_time_time" "payload"."enum_product_guidance_routine_time_time";
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "routine_time_order" numeric;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "routine_time_am_notes" varchar;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "routine_time_pm_notes" varchar;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "routine_time_sunscreen_required" boolean DEFAULT false;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "pair_with_routine_suggestion" jsonb;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "precautions_patch_test" boolean DEFAULT false;
  ALTER TABLE "payload"."product_guidance" ADD COLUMN "precautions_pregnancy_safe" "payload"."enum_product_guidance_precautions_pregnancy_safe";
  ALTER TABLE "payload"."ingredients" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "payload"."ingredients" ADD COLUMN "benefit" varchar;
  ALTER TABLE "payload"."ingredients" ADD COLUMN "concentration" varchar;
  ALTER TABLE "payload"."beneficials" ADD COLUMN "label" varchar NOT NULL;
  ALTER TABLE "payload"."product_guidance_skin_types_suitable" DROP COLUMN "locale";
  ALTER TABLE "payload"."product_guidance_concerns_primary" DROP COLUMN "locale";
  ALTER TABLE "payload"."product_guidance_ingredients_highlighted" DROP COLUMN "_locale";
  ALTER TABLE "payload"."product_guidance_ingredients_avoid_with" DROP COLUMN "_locale";
  ALTER TABLE "payload"."product_guidance_how_to_steps" DROP COLUMN "_locale";
  ALTER TABLE "payload"."product_guidance_pair_with_recommended" DROP COLUMN "_locale";
  ALTER TABLE "payload"."product_guidance_pair_with_avoid" DROP COLUMN "_locale";
  ALTER TABLE "payload"."product_guidance_precautions_warnings" DROP COLUMN "_locale";
  ALTER TABLE "payload"."ingredients_avoid_with" DROP COLUMN "_locale";
  ALTER TABLE "payload"."routines_steps" DROP COLUMN "_locale";`)
}
