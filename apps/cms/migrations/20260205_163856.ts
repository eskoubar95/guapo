import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."_locales" AS ENUM('da', 'en');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_published_locale" AS ENUM('da', 'en');
  CREATE TYPE "payload"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_articles_category" AS ENUM('skincare-tips', 'product-guides', 'ingredients', 'routines', 'news');
  CREATE TYPE "payload"."enum__articles_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__articles_v_version_category" AS ENUM('skincare-tips', 'product-guides', 'ingredients', 'routines', 'news');
  CREATE TYPE "payload"."enum__articles_v_published_locale" AS ENUM('da', 'en');
  CREATE TYPE "payload"."enum_product_guidance_skin_types_suitable" AS ENUM('normal', 'dry', 'oily', 'combination', 'sensitive', 'all');
  CREATE TYPE "payload"."enum_product_guidance_concerns_primary" AS ENUM('acne', 'aging', 'dark-spots', 'dryness', 'dullness', 'pores', 'oiliness', 'redness', 'sensitivity', 'sun-damage', 'texture', 'under-eye');
  CREATE TYPE "payload"."enum_product_guidance_pair_with_recommended_order" AS ENUM('before', 'after', 'alternate');
  CREATE TYPE "payload"."enum_product_guidance_routine_time_time" AS ENUM('am', 'pm', 'both', 'either');
  CREATE TYPE "payload"."enum_product_guidance_precautions_pregnancy_safe" AS ENUM('safe', 'consult', 'avoid', 'unknown');
  CREATE TYPE "payload"."enum_routines_name" AS ENUM('am', 'pm', 'both');
  CREATE TYPE "payload"."enum_beneficials_type" AS ENUM('skin_type', 'concern');
  CREATE TYPE "payload"."enum_products_pair_with_recommended_order" AS ENUM('before', 'after', 'alternate');
  CREATE TYPE "payload"."enum_products_routine_time_time" AS ENUM('am', 'pm', 'both', 'either');
  CREATE TYPE "payload"."enum_products_precautions_pregnancy_safe" AS ENUM('safe', 'consult', 'avoid', 'unknown');
  CREATE TYPE "payload"."enum_navigation_main_menu_children_type" AS ENUM('internal', 'external');
  CREATE TYPE "payload"."enum_navigation_main_menu_type" AS ENUM('link', 'dropdown');
  CREATE TYPE "payload"."enum_navigation_main_menu_link_type" AS ENUM('internal', 'external');
  CREATE TYPE "payload"."enum_footer_columns_links_type" AS ENUM('internal', 'external');
  CREATE TYPE "payload"."enum_footer_social_links_platform" AS ENUM('facebook', 'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter');
  CREATE TYPE "payload"."enum_homepage_blocks_hero_variant" AS ENUM('full', 'split', 'video');
  CREATE TYPE "payload"."enum_homepage_blocks_hero_text_position" AS ENUM('left', 'center', 'right');
  CREATE TYPE "payload"."enum_homepage_blocks_hero_text_color" AS ENUM('light', 'dark');
  CREATE TYPE "payload"."enum_homepage_blocks_featured_products_display_type" AS ENUM('grid', 'carousel');
  CREATE TYPE "payload"."enum_homepage_blocks_categories_layout" AS ENUM('grid', 'featured', 'scroll');
  CREATE TYPE "payload"."enum_homepage_blocks_testimonials_display_type" AS ENUM('carousel', 'grid');
  CREATE TYPE "payload"."enum_homepage_blocks_content_block_layout" AS ENUM('text-image', 'image-text', 'text-only', 'full-width');
  CREATE TYPE "payload"."enum_homepage_blocks_content_block_background_color" AS ENUM('white', 'gray', 'brand-light');
  CREATE TYPE "payload"."enum_homepage_blocks_newsletter_background_color" AS ENUM('brand', 'dark', 'light');
  CREATE TYPE "payload"."enum_homepage_blocks_blog_carousel_source" AS ENUM('latest', 'category', 'manual');
  CREATE TYPE "payload"."enum_homepage_blocks_blog_carousel_category" AS ENUM('skincare-tips', 'product-guides', 'ingredients', 'routines');
  CREATE TYPE "payload"."enum_homepage_blocks_brands_banner_display_type" AS ENUM('scroll', 'grid');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_tablet_url" varchar,
  	"sizes_tablet_width" numeric,
  	"sizes_tablet_height" numeric,
  	"sizes_tablet_mime_type" varchar,
  	"sizes_tablet_filesize" numeric,
  	"sizes_tablet_filename" varchar
  );
  
  CREATE TABLE "payload"."media_locales" (
  	"alt" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."pages_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__pages_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_pages_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"version_content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."articles_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar
  );
  
  CREATE TABLE "payload"."articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "payload"."enum_articles_status" DEFAULT 'draft',
  	"category" "payload"."enum_articles_category",
  	"featured_image_id" integer,
  	"author_id" integer,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_articles_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."articles_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."_articles_v_version_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_articles_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_status" "payload"."enum__articles_v_version_status" DEFAULT 'draft',
  	"version_category" "payload"."enum__articles_v_version_category",
  	"version_featured_image_id" integer,
  	"version_author_id" integer,
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__articles_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "payload"."enum__articles_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "payload"."_articles_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."product_guidance_skin_types_suitable" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_product_guidance_skin_types_suitable",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."product_guidance_concerns_primary" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "payload"."enum_product_guidance_concerns_primary",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload"."product_guidance_ingredients_highlighted" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"concentration" varchar,
  	"benefit" varchar
  );
  
  CREATE TABLE "payload"."product_guidance_ingredients_avoid_with" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ingredient" varchar NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE "payload"."product_guidance_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar NOT NULL,
  	"tip" varchar
  );
  
  CREATE TABLE "payload"."product_guidance_pair_with_recommended" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_identifier" varchar NOT NULL,
  	"reason" varchar,
  	"order" "payload"."enum_product_guidance_pair_with_recommended_order"
  );
  
  CREATE TABLE "payload"."product_guidance_pair_with_avoid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_identifier" varchar NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE "payload"."product_guidance_precautions_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"warning" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."product_guidance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_identifier" varchar NOT NULL,
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
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."ingredients_avoid_with" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"ingredient_id" integer NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE "payload"."ingredients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"benefit" varchar,
  	"concentration" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."routines_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."routines" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" "payload"."enum_routines_name" NOT NULL,
  	"order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."beneficials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "payload"."enum_beneficials_type" NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."products_how_to_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step" varchar NOT NULL,
  	"tip" varchar
  );
  
  CREATE TABLE "payload"."products_pair_with_recommended" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"reason" varchar,
  	"order" "payload"."enum_products_pair_with_recommended_order"
  );
  
  CREATE TABLE "payload"."products_pair_with_avoid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"reason" varchar
  );
  
  CREATE TABLE "payload"."products_precautions_warnings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"warning" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"medusa_id" varchar,
  	"handle" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."products_locales" (
  	"title" varchar,
  	"how_to_amount" varchar,
  	"how_to_frequency" varchar,
  	"how_to_tips" jsonb,
  	"routine_time_time" "payload"."enum_products_routine_time_time",
  	"routine_time_order" numeric,
  	"routine_time_am_notes" varchar,
  	"routine_time_pm_notes" varchar,
  	"routine_time_sunscreen_required" boolean DEFAULT false,
  	"precautions_patch_test" boolean DEFAULT false,
  	"precautions_pregnancy_safe" "payload"."enum_products_precautions_pregnancy_safe",
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"ingredients_id" integer,
  	"beneficials_id" integer,
  	"routines_id" integer
  );
  
  CREATE TABLE "payload"."categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"medusa_id" varchar,
  	"handle" varchar NOT NULL,
  	"name" varchar,
  	"parent_id" integer,
  	"slug" varchar,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_key" varchar NOT NULL,
  	"display_name" varchar,
  	"logo_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."product_types" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"name" varchar,
  	"hero_image_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"body" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"pages_id" integer,
  	"articles_id" integer,
  	"product_guidance_id" integer,
  	"ingredients_id" integer,
  	"routines_id" integer,
  	"beneficials_id" integer,
  	"products_id" integer,
  	"categories_id" integer,
  	"brands_id" integer,
  	"product_types_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."navigation_main_menu_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"type" "payload"."enum_navigation_main_menu_children_type" DEFAULT 'internal',
  	"page_id" integer,
  	"url" varchar,
  	"new_tab" boolean
  );
  
  CREATE TABLE "payload"."navigation_main_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "payload"."enum_navigation_main_menu_type" DEFAULT 'link' NOT NULL,
  	"link_type" "payload"."enum_navigation_main_menu_link_type" DEFAULT 'internal',
  	"link_page_id" integer,
  	"link_url" varchar,
  	"link_new_tab" boolean
  );
  
  CREATE TABLE "payload"."navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."navigation_locales" (
  	"cta_button_show" boolean,
  	"cta_button_label" varchar,
  	"cta_button_url" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"type" "payload"."enum_footer_columns_links_type" DEFAULT 'internal',
  	"page_id" integer,
  	"url" varchar,
  	"new_tab" boolean
  );
  
  CREATE TABLE "payload"."footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."footer_legal_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"page_id" integer
  );
  
  CREATE TABLE "payload"."footer_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_footer_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."footer_locales" (
  	"newsletter_show" boolean DEFAULT true,
  	"newsletter_title" varchar DEFAULT 'Stay Updated',
  	"newsletter_description" varchar,
  	"copyright" varchar DEFAULT '© {year} Guapo. All rights reserved.',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."homepage_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"variant" "payload"."enum_homepage_blocks_hero_variant" DEFAULT 'full',
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"background_image_id" integer,
  	"video_url" varchar,
  	"cta_text" varchar DEFAULT 'Shop Now',
  	"cta_url" varchar DEFAULT '/shop',
  	"text_position" "payload"."enum_homepage_blocks_hero_text_position" DEFAULT 'center',
  	"text_color" "payload"."enum_homepage_blocks_hero_text_color" DEFAULT 'light',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_featured_products_product_handles" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"handle" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."homepage_blocks_featured_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Featured Products',
  	"subheading" varchar,
  	"display_type" "payload"."enum_homepage_blocks_featured_products_display_type" DEFAULT 'grid',
  	"cta_show" boolean DEFAULT true,
  	"cta_text" varchar DEFAULT 'View All Products',
  	"cta_url" varchar DEFAULT '/shop',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_categories_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"title" varchar NOT NULL,
  	"image_id" integer NOT NULL,
  	"url" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Shop by Category',
  	"layout" "payload"."enum_homepage_blocks_categories_layout" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_testimonials_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"location" varchar,
  	"rating" numeric DEFAULT 5,
  	"product_id" integer,
  	"product_handle" varchar,
  	"image_id" integer
  );
  
  CREATE TABLE "payload"."homepage_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'What Our Customers Say',
  	"display_type" "payload"."enum_homepage_blocks_testimonials_display_type" DEFAULT 'carousel',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_content_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"layout" "payload"."enum_homepage_blocks_content_block_layout" DEFAULT 'text-image',
  	"heading" varchar,
  	"content" jsonb,
  	"image_id" integer,
  	"cta_show" boolean,
  	"cta_text" varchar,
  	"cta_url" varchar,
  	"background_color" "payload"."enum_homepage_blocks_content_block_background_color" DEFAULT 'white',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Join Our Newsletter',
  	"description" varchar DEFAULT 'Subscribe for exclusive offers, skincare tips, and new product launches.',
  	"background_color" "payload"."enum_homepage_blocks_newsletter_background_color" DEFAULT 'brand',
  	"incentive" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_blog_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'From Our Blog',
  	"subheading" varchar,
  	"source" "payload"."enum_homepage_blocks_blog_carousel_source" DEFAULT 'latest',
  	"category" "payload"."enum_homepage_blocks_blog_carousel_category",
  	"limit" numeric DEFAULT 4,
  	"cta_show" boolean DEFAULT true,
  	"cta_text" varchar DEFAULT 'Read More',
  	"cta_url" varchar DEFAULT '/blog',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_brands_banner_brands" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"brand_id" integer,
  	"name" varchar,
  	"logo_id" integer,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."homepage_blocks_brands_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Our Brands',
  	"display_type" "payload"."enum_homepage_blocks_brands_banner_display_type" DEFAULT 'scroll',
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."homepage_locales" (
  	"meta_title" varchar DEFAULT 'Guapo - Premium Skincare',
  	"meta_description" varchar DEFAULT 'Discover premium skincare products curated for your skin.',
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "payload"."_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload"."homepage_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"locale" "payload"."_locales",
  	"products_id" integer,
  	"articles_id" integer
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles_tags" ADD CONSTRAINT "articles_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_locales" ADD CONSTRAINT "articles_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."articles_locales" ADD CONSTRAINT "articles_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_version_tags" ADD CONSTRAINT "_articles_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_parent_id_articles_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v" ADD CONSTRAINT "_articles_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_articles_v_locales" ADD CONSTRAINT "_articles_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_articles_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_skin_types_suitable" ADD CONSTRAINT "product_guidance_skin_types_suitable_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_concerns_primary" ADD CONSTRAINT "product_guidance_concerns_primary_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_ingredients_highlighted" ADD CONSTRAINT "product_guidance_ingredients_highlighted_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_ingredients_avoid_with" ADD CONSTRAINT "product_guidance_ingredients_avoid_with_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_how_to_steps" ADD CONSTRAINT "product_guidance_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_pair_with_recommended" ADD CONSTRAINT "product_guidance_pair_with_recommended_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_pair_with_avoid" ADD CONSTRAINT "product_guidance_pair_with_avoid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."product_guidance_precautions_warnings" ADD CONSTRAINT "product_guidance_precautions_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."ingredients_avoid_with" ADD CONSTRAINT "ingredients_avoid_with_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "payload"."ingredients"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."ingredients_avoid_with" ADD CONSTRAINT "ingredients_avoid_with_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."routines_steps" ADD CONSTRAINT "routines_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."routines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_how_to_steps" ADD CONSTRAINT "products_how_to_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_pair_with_recommended" ADD CONSTRAINT "products_pair_with_recommended_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products_pair_with_recommended" ADD CONSTRAINT "products_pair_with_recommended_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_pair_with_avoid" ADD CONSTRAINT "products_pair_with_avoid_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."products_pair_with_avoid" ADD CONSTRAINT "products_pair_with_avoid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_precautions_warnings" ADD CONSTRAINT "products_precautions_warnings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_locales" ADD CONSTRAINT "products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_ingredients_fk" FOREIGN KEY ("ingredients_id") REFERENCES "payload"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_beneficials_fk" FOREIGN KEY ("beneficials_id") REFERENCES "payload"."beneficials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."products_rels" ADD CONSTRAINT "products_rels_routines_fk" FOREIGN KEY ("routines_id") REFERENCES "payload"."routines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."product_types" ADD CONSTRAINT "product_types_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_guidance_fk" FOREIGN KEY ("product_guidance_id") REFERENCES "payload"."product_guidance"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ingredients_fk" FOREIGN KEY ("ingredients_id") REFERENCES "payload"."ingredients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routines_fk" FOREIGN KEY ("routines_id") REFERENCES "payload"."routines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_beneficials_fk" FOREIGN KEY ("beneficials_id") REFERENCES "payload"."beneficials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "payload"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "payload"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_types_fk" FOREIGN KEY ("product_types_id") REFERENCES "payload"."product_types"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_link_page_id_pages_id_fk" FOREIGN KEY ("link_page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_locales" ADD CONSTRAINT "navigation_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_columns_links" ADD CONSTRAINT "footer_columns_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."footer_columns_links" ADD CONSTRAINT "footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_columns" ADD CONSTRAINT "footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_legal_links" ADD CONSTRAINT "footer_legal_links_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."footer_legal_links" ADD CONSTRAINT "footer_legal_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_social_links" ADD CONSTRAINT "footer_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."footer_locales" ADD CONSTRAINT "footer_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_background_image_id_media_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_hero" ADD CONSTRAINT "homepage_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_featured_products_product_handles" ADD CONSTRAINT "homepage_blocks_featured_products_product_handles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_blocks_featured_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_featured_products" ADD CONSTRAINT "homepage_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_categories_categories" ADD CONSTRAINT "homepage_blocks_categories_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "payload"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_categories_categories" ADD CONSTRAINT "homepage_blocks_categories_categories_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_categories_categories" ADD CONSTRAINT "homepage_blocks_categories_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_blocks_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_categories" ADD CONSTRAINT "homepage_blocks_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "payload"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_testimonials_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_testimonials" ADD CONSTRAINT "homepage_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_content_block" ADD CONSTRAINT "homepage_blocks_content_block_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_content_block" ADD CONSTRAINT "homepage_blocks_content_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_newsletter" ADD CONSTRAINT "homepage_blocks_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_blog_carousel" ADD CONSTRAINT "homepage_blocks_blog_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_brands_banner_brands" ADD CONSTRAINT "homepage_blocks_brands_banner_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "payload"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_brands_banner_brands" ADD CONSTRAINT "homepage_blocks_brands_banner_brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_brands_banner_brands" ADD CONSTRAINT "homepage_blocks_brands_banner_brands_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_blocks_brands_banner"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_blocks_brands_banner" ADD CONSTRAINT "homepage_blocks_brands_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_locales" ADD CONSTRAINT "homepage_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_locales" ADD CONSTRAINT "homepage_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_rels" ADD CONSTRAINT "homepage_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_rels" ADD CONSTRAINT "homepage_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "payload"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_rels" ADD CONSTRAINT "homepage_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "payload"."articles"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_tablet_sizes_tablet_filename_idx" ON "payload"."media" USING btree ("sizes_tablet_filename");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "payload"."media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages_locales" USING btree ("slug","_locale");
  CREATE INDEX "pages_meta_meta_image_idx" ON "payload"."pages_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "payload"."pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_snapshot_idx" ON "payload"."_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "payload"."_pages_v" USING btree ("published_locale");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "payload"."_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "payload"."_pages_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "payload"."_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "articles_tags_order_idx" ON "payload"."articles_tags" USING btree ("_order");
  CREATE INDEX "articles_tags_parent_id_idx" ON "payload"."articles_tags" USING btree ("_parent_id");
  CREATE INDEX "articles_featured_image_idx" ON "payload"."articles" USING btree ("featured_image_id");
  CREATE INDEX "articles_author_idx" ON "payload"."articles" USING btree ("author_id");
  CREATE INDEX "articles_updated_at_idx" ON "payload"."articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "payload"."articles" USING btree ("created_at");
  CREATE INDEX "articles__status_idx" ON "payload"."articles" USING btree ("_status");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "payload"."articles_locales" USING btree ("slug","_locale");
  CREATE INDEX "articles_meta_meta_image_idx" ON "payload"."articles_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "articles_locales_locale_parent_id_unique" ON "payload"."articles_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_articles_v_version_tags_order_idx" ON "payload"."_articles_v_version_tags" USING btree ("_order");
  CREATE INDEX "_articles_v_version_tags_parent_id_idx" ON "payload"."_articles_v_version_tags" USING btree ("_parent_id");
  CREATE INDEX "_articles_v_parent_idx" ON "payload"."_articles_v" USING btree ("parent_id");
  CREATE INDEX "_articles_v_version_version_featured_image_idx" ON "payload"."_articles_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_articles_v_version_version_author_idx" ON "payload"."_articles_v" USING btree ("version_author_id");
  CREATE INDEX "_articles_v_version_version_updated_at_idx" ON "payload"."_articles_v" USING btree ("version_updated_at");
  CREATE INDEX "_articles_v_version_version_created_at_idx" ON "payload"."_articles_v" USING btree ("version_created_at");
  CREATE INDEX "_articles_v_version_version__status_idx" ON "payload"."_articles_v" USING btree ("version__status");
  CREATE INDEX "_articles_v_created_at_idx" ON "payload"."_articles_v" USING btree ("created_at");
  CREATE INDEX "_articles_v_updated_at_idx" ON "payload"."_articles_v" USING btree ("updated_at");
  CREATE INDEX "_articles_v_snapshot_idx" ON "payload"."_articles_v" USING btree ("snapshot");
  CREATE INDEX "_articles_v_published_locale_idx" ON "payload"."_articles_v" USING btree ("published_locale");
  CREATE INDEX "_articles_v_latest_idx" ON "payload"."_articles_v" USING btree ("latest");
  CREATE INDEX "_articles_v_autosave_idx" ON "payload"."_articles_v" USING btree ("autosave");
  CREATE INDEX "_articles_v_version_version_slug_idx" ON "payload"."_articles_v_locales" USING btree ("version_slug","_locale");
  CREATE INDEX "_articles_v_version_meta_version_meta_image_idx" ON "payload"."_articles_v_locales" USING btree ("version_meta_image_id");
  CREATE UNIQUE INDEX "_articles_v_locales_locale_parent_id_unique" ON "payload"."_articles_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "product_guidance_skin_types_suitable_order_idx" ON "payload"."product_guidance_skin_types_suitable" USING btree ("order");
  CREATE INDEX "product_guidance_skin_types_suitable_parent_idx" ON "payload"."product_guidance_skin_types_suitable" USING btree ("parent_id");
  CREATE INDEX "product_guidance_concerns_primary_order_idx" ON "payload"."product_guidance_concerns_primary" USING btree ("order");
  CREATE INDEX "product_guidance_concerns_primary_parent_idx" ON "payload"."product_guidance_concerns_primary" USING btree ("parent_id");
  CREATE INDEX "product_guidance_ingredients_highlighted_order_idx" ON "payload"."product_guidance_ingredients_highlighted" USING btree ("_order");
  CREATE INDEX "product_guidance_ingredients_highlighted_parent_id_idx" ON "payload"."product_guidance_ingredients_highlighted" USING btree ("_parent_id");
  CREATE INDEX "product_guidance_ingredients_avoid_with_order_idx" ON "payload"."product_guidance_ingredients_avoid_with" USING btree ("_order");
  CREATE INDEX "product_guidance_ingredients_avoid_with_parent_id_idx" ON "payload"."product_guidance_ingredients_avoid_with" USING btree ("_parent_id");
  CREATE INDEX "product_guidance_how_to_steps_order_idx" ON "payload"."product_guidance_how_to_steps" USING btree ("_order");
  CREATE INDEX "product_guidance_how_to_steps_parent_id_idx" ON "payload"."product_guidance_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "product_guidance_pair_with_recommended_order_idx" ON "payload"."product_guidance_pair_with_recommended" USING btree ("_order");
  CREATE INDEX "product_guidance_pair_with_recommended_parent_id_idx" ON "payload"."product_guidance_pair_with_recommended" USING btree ("_parent_id");
  CREATE INDEX "product_guidance_pair_with_avoid_order_idx" ON "payload"."product_guidance_pair_with_avoid" USING btree ("_order");
  CREATE INDEX "product_guidance_pair_with_avoid_parent_id_idx" ON "payload"."product_guidance_pair_with_avoid" USING btree ("_parent_id");
  CREATE INDEX "product_guidance_precautions_warnings_order_idx" ON "payload"."product_guidance_precautions_warnings" USING btree ("_order");
  CREATE INDEX "product_guidance_precautions_warnings_parent_id_idx" ON "payload"."product_guidance_precautions_warnings" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "product_guidance_product_identifier_idx" ON "payload"."product_guidance" USING btree ("product_identifier");
  CREATE INDEX "product_guidance_updated_at_idx" ON "payload"."product_guidance" USING btree ("updated_at");
  CREATE INDEX "product_guidance_created_at_idx" ON "payload"."product_guidance" USING btree ("created_at");
  CREATE INDEX "ingredients_avoid_with_order_idx" ON "payload"."ingredients_avoid_with" USING btree ("_order");
  CREATE INDEX "ingredients_avoid_with_parent_id_idx" ON "payload"."ingredients_avoid_with" USING btree ("_parent_id");
  CREATE INDEX "ingredients_avoid_with_ingredient_idx" ON "payload"."ingredients_avoid_with" USING btree ("ingredient_id");
  CREATE INDEX "ingredients_updated_at_idx" ON "payload"."ingredients" USING btree ("updated_at");
  CREATE INDEX "ingredients_created_at_idx" ON "payload"."ingredients" USING btree ("created_at");
  CREATE INDEX "routines_steps_order_idx" ON "payload"."routines_steps" USING btree ("_order");
  CREATE INDEX "routines_steps_parent_id_idx" ON "payload"."routines_steps" USING btree ("_parent_id");
  CREATE INDEX "routines_updated_at_idx" ON "payload"."routines" USING btree ("updated_at");
  CREATE INDEX "routines_created_at_idx" ON "payload"."routines" USING btree ("created_at");
  CREATE UNIQUE INDEX "beneficials_value_idx" ON "payload"."beneficials" USING btree ("value");
  CREATE INDEX "beneficials_updated_at_idx" ON "payload"."beneficials" USING btree ("updated_at");
  CREATE INDEX "beneficials_created_at_idx" ON "payload"."beneficials" USING btree ("created_at");
  CREATE INDEX "products_how_to_steps_order_idx" ON "payload"."products_how_to_steps" USING btree ("_order");
  CREATE INDEX "products_how_to_steps_parent_id_idx" ON "payload"."products_how_to_steps" USING btree ("_parent_id");
  CREATE INDEX "products_how_to_steps_locale_idx" ON "payload"."products_how_to_steps" USING btree ("_locale");
  CREATE INDEX "products_pair_with_recommended_order_idx" ON "payload"."products_pair_with_recommended" USING btree ("_order");
  CREATE INDEX "products_pair_with_recommended_parent_id_idx" ON "payload"."products_pair_with_recommended" USING btree ("_parent_id");
  CREATE INDEX "products_pair_with_recommended_locale_idx" ON "payload"."products_pair_with_recommended" USING btree ("_locale");
  CREATE INDEX "products_pair_with_recommended_product_idx" ON "payload"."products_pair_with_recommended" USING btree ("product_id");
  CREATE INDEX "products_pair_with_avoid_order_idx" ON "payload"."products_pair_with_avoid" USING btree ("_order");
  CREATE INDEX "products_pair_with_avoid_parent_id_idx" ON "payload"."products_pair_with_avoid" USING btree ("_parent_id");
  CREATE INDEX "products_pair_with_avoid_locale_idx" ON "payload"."products_pair_with_avoid" USING btree ("_locale");
  CREATE INDEX "products_pair_with_avoid_product_idx" ON "payload"."products_pair_with_avoid" USING btree ("product_id");
  CREATE INDEX "products_precautions_warnings_order_idx" ON "payload"."products_precautions_warnings" USING btree ("_order");
  CREATE INDEX "products_precautions_warnings_parent_id_idx" ON "payload"."products_precautions_warnings" USING btree ("_parent_id");
  CREATE INDEX "products_precautions_warnings_locale_idx" ON "payload"."products_precautions_warnings" USING btree ("_locale");
  CREATE UNIQUE INDEX "products_handle_idx" ON "payload"."products" USING btree ("handle");
  CREATE INDEX "products_updated_at_idx" ON "payload"."products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "payload"."products" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_locales_locale_parent_id_unique" ON "payload"."products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "products_rels_order_idx" ON "payload"."products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "payload"."products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "payload"."products_rels" USING btree ("path");
  CREATE INDEX "products_rels_ingredients_id_idx" ON "payload"."products_rels" USING btree ("ingredients_id");
  CREATE INDEX "products_rels_beneficials_id_idx" ON "payload"."products_rels" USING btree ("beneficials_id");
  CREATE INDEX "products_rels_routines_id_idx" ON "payload"."products_rels" USING btree ("routines_id");
  CREATE UNIQUE INDEX "categories_handle_idx" ON "payload"."categories" USING btree ("handle");
  CREATE INDEX "categories_parent_idx" ON "payload"."categories" USING btree ("parent_id");
  CREATE INDEX "categories_hero_image_idx" ON "payload"."categories" USING btree ("hero_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "payload"."categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "payload"."categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "brands_brand_key_idx" ON "payload"."brands" USING btree ("brand_key");
  CREATE INDEX "brands_logo_idx" ON "payload"."brands" USING btree ("logo_id");
  CREATE INDEX "brands_updated_at_idx" ON "payload"."brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "payload"."brands" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_types_value_idx" ON "payload"."product_types" USING btree ("value");
  CREATE INDEX "product_types_hero_image_idx" ON "payload"."product_types" USING btree ("hero_image_id");
  CREATE INDEX "product_types_updated_at_idx" ON "payload"."product_types" USING btree ("updated_at");
  CREATE INDEX "product_types_created_at_idx" ON "payload"."product_types" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_product_guidance_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("product_guidance_id");
  CREATE INDEX "payload_locked_documents_rels_ingredients_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("ingredients_id");
  CREATE INDEX "payload_locked_documents_rels_routines_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("routines_id");
  CREATE INDEX "payload_locked_documents_rels_beneficials_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("beneficials_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_product_types_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("product_types_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "navigation_main_menu_children_order_idx" ON "payload"."navigation_main_menu_children" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_children_parent_id_idx" ON "payload"."navigation_main_menu_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_children_locale_idx" ON "payload"."navigation_main_menu_children" USING btree ("_locale");
  CREATE INDEX "navigation_main_menu_children_page_idx" ON "payload"."navigation_main_menu_children" USING btree ("page_id");
  CREATE INDEX "navigation_main_menu_order_idx" ON "payload"."navigation_main_menu" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_parent_id_idx" ON "payload"."navigation_main_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_locale_idx" ON "payload"."navigation_main_menu" USING btree ("_locale");
  CREATE INDEX "navigation_main_menu_link_link_page_idx" ON "payload"."navigation_main_menu" USING btree ("link_page_id");
  CREATE UNIQUE INDEX "navigation_locales_locale_parent_id_unique" ON "payload"."navigation_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "footer_columns_links_order_idx" ON "payload"."footer_columns_links" USING btree ("_order");
  CREATE INDEX "footer_columns_links_parent_id_idx" ON "payload"."footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_links_locale_idx" ON "payload"."footer_columns_links" USING btree ("_locale");
  CREATE INDEX "footer_columns_links_page_idx" ON "payload"."footer_columns_links" USING btree ("page_id");
  CREATE INDEX "footer_columns_order_idx" ON "payload"."footer_columns" USING btree ("_order");
  CREATE INDEX "footer_columns_parent_id_idx" ON "payload"."footer_columns" USING btree ("_parent_id");
  CREATE INDEX "footer_columns_locale_idx" ON "payload"."footer_columns" USING btree ("_locale");
  CREATE INDEX "footer_legal_links_order_idx" ON "payload"."footer_legal_links" USING btree ("_order");
  CREATE INDEX "footer_legal_links_parent_id_idx" ON "payload"."footer_legal_links" USING btree ("_parent_id");
  CREATE INDEX "footer_legal_links_locale_idx" ON "payload"."footer_legal_links" USING btree ("_locale");
  CREATE INDEX "footer_legal_links_page_idx" ON "payload"."footer_legal_links" USING btree ("page_id");
  CREATE INDEX "footer_social_links_order_idx" ON "payload"."footer_social_links" USING btree ("_order");
  CREATE INDEX "footer_social_links_parent_id_idx" ON "payload"."footer_social_links" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "footer_locales_locale_parent_id_unique" ON "payload"."footer_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_blocks_hero_order_idx" ON "payload"."homepage_blocks_hero" USING btree ("_order");
  CREATE INDEX "homepage_blocks_hero_parent_id_idx" ON "payload"."homepage_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_hero_path_idx" ON "payload"."homepage_blocks_hero" USING btree ("_path");
  CREATE INDEX "homepage_blocks_hero_locale_idx" ON "payload"."homepage_blocks_hero" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_hero_background_image_idx" ON "payload"."homepage_blocks_hero" USING btree ("background_image_id");
  CREATE INDEX "homepage_blocks_featured_products_product_handles_order_idx" ON "payload"."homepage_blocks_featured_products_product_handles" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_products_product_handles_parent_id_idx" ON "payload"."homepage_blocks_featured_products_product_handles" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_products_product_handles_locale_idx" ON "payload"."homepage_blocks_featured_products_product_handles" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_featured_products_order_idx" ON "payload"."homepage_blocks_featured_products" USING btree ("_order");
  CREATE INDEX "homepage_blocks_featured_products_parent_id_idx" ON "payload"."homepage_blocks_featured_products" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_featured_products_path_idx" ON "payload"."homepage_blocks_featured_products" USING btree ("_path");
  CREATE INDEX "homepage_blocks_featured_products_locale_idx" ON "payload"."homepage_blocks_featured_products" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_categories_categories_order_idx" ON "payload"."homepage_blocks_categories_categories" USING btree ("_order");
  CREATE INDEX "homepage_blocks_categories_categories_parent_id_idx" ON "payload"."homepage_blocks_categories_categories" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_categories_categories_locale_idx" ON "payload"."homepage_blocks_categories_categories" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_categories_categories_category_idx" ON "payload"."homepage_blocks_categories_categories" USING btree ("category_id");
  CREATE INDEX "homepage_blocks_categories_categories_image_idx" ON "payload"."homepage_blocks_categories_categories" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_categories_order_idx" ON "payload"."homepage_blocks_categories" USING btree ("_order");
  CREATE INDEX "homepage_blocks_categories_parent_id_idx" ON "payload"."homepage_blocks_categories" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_categories_path_idx" ON "payload"."homepage_blocks_categories" USING btree ("_path");
  CREATE INDEX "homepage_blocks_categories_locale_idx" ON "payload"."homepage_blocks_categories" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_order_idx" ON "payload"."homepage_blocks_testimonials_testimonials" USING btree ("_order");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_parent_id_idx" ON "payload"."homepage_blocks_testimonials_testimonials" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_locale_idx" ON "payload"."homepage_blocks_testimonials_testimonials" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_product_idx" ON "payload"."homepage_blocks_testimonials_testimonials" USING btree ("product_id");
  CREATE INDEX "homepage_blocks_testimonials_testimonials_image_idx" ON "payload"."homepage_blocks_testimonials_testimonials" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_testimonials_order_idx" ON "payload"."homepage_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "homepage_blocks_testimonials_parent_id_idx" ON "payload"."homepage_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_testimonials_path_idx" ON "payload"."homepage_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "homepage_blocks_testimonials_locale_idx" ON "payload"."homepage_blocks_testimonials" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_content_block_order_idx" ON "payload"."homepage_blocks_content_block" USING btree ("_order");
  CREATE INDEX "homepage_blocks_content_block_parent_id_idx" ON "payload"."homepage_blocks_content_block" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_content_block_path_idx" ON "payload"."homepage_blocks_content_block" USING btree ("_path");
  CREATE INDEX "homepage_blocks_content_block_locale_idx" ON "payload"."homepage_blocks_content_block" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_content_block_image_idx" ON "payload"."homepage_blocks_content_block" USING btree ("image_id");
  CREATE INDEX "homepage_blocks_newsletter_order_idx" ON "payload"."homepage_blocks_newsletter" USING btree ("_order");
  CREATE INDEX "homepage_blocks_newsletter_parent_id_idx" ON "payload"."homepage_blocks_newsletter" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_newsletter_path_idx" ON "payload"."homepage_blocks_newsletter" USING btree ("_path");
  CREATE INDEX "homepage_blocks_newsletter_locale_idx" ON "payload"."homepage_blocks_newsletter" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_blog_carousel_order_idx" ON "payload"."homepage_blocks_blog_carousel" USING btree ("_order");
  CREATE INDEX "homepage_blocks_blog_carousel_parent_id_idx" ON "payload"."homepage_blocks_blog_carousel" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_blog_carousel_path_idx" ON "payload"."homepage_blocks_blog_carousel" USING btree ("_path");
  CREATE INDEX "homepage_blocks_blog_carousel_locale_idx" ON "payload"."homepage_blocks_blog_carousel" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_brands_banner_brands_order_idx" ON "payload"."homepage_blocks_brands_banner_brands" USING btree ("_order");
  CREATE INDEX "homepage_blocks_brands_banner_brands_parent_id_idx" ON "payload"."homepage_blocks_brands_banner_brands" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_brands_banner_brands_locale_idx" ON "payload"."homepage_blocks_brands_banner_brands" USING btree ("_locale");
  CREATE INDEX "homepage_blocks_brands_banner_brands_brand_idx" ON "payload"."homepage_blocks_brands_banner_brands" USING btree ("brand_id");
  CREATE INDEX "homepage_blocks_brands_banner_brands_logo_idx" ON "payload"."homepage_blocks_brands_banner_brands" USING btree ("logo_id");
  CREATE INDEX "homepage_blocks_brands_banner_order_idx" ON "payload"."homepage_blocks_brands_banner" USING btree ("_order");
  CREATE INDEX "homepage_blocks_brands_banner_parent_id_idx" ON "payload"."homepage_blocks_brands_banner" USING btree ("_parent_id");
  CREATE INDEX "homepage_blocks_brands_banner_path_idx" ON "payload"."homepage_blocks_brands_banner" USING btree ("_path");
  CREATE INDEX "homepage_blocks_brands_banner_locale_idx" ON "payload"."homepage_blocks_brands_banner" USING btree ("_locale");
  CREATE INDEX "homepage_meta_meta_image_idx" ON "payload"."homepage_locales" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "homepage_locales_locale_parent_id_unique" ON "payload"."homepage_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "homepage_rels_order_idx" ON "payload"."homepage_rels" USING btree ("order");
  CREATE INDEX "homepage_rels_parent_idx" ON "payload"."homepage_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_rels_path_idx" ON "payload"."homepage_rels" USING btree ("path");
  CREATE INDEX "homepage_rels_locale_idx" ON "payload"."homepage_rels" USING btree ("locale");
  CREATE INDEX "homepage_rels_products_id_idx" ON "payload"."homepage_rels" USING btree ("products_id","locale");
  CREATE INDEX "homepage_rels_articles_id_idx" ON "payload"."homepage_rels" USING btree ("articles_id","locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."media_locales" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."pages_locales" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."_pages_v_locales" CASCADE;
  DROP TABLE "payload"."articles_tags" CASCADE;
  DROP TABLE "payload"."articles" CASCADE;
  DROP TABLE "payload"."articles_locales" CASCADE;
  DROP TABLE "payload"."_articles_v_version_tags" CASCADE;
  DROP TABLE "payload"."_articles_v" CASCADE;
  DROP TABLE "payload"."_articles_v_locales" CASCADE;
  DROP TABLE "payload"."product_guidance_skin_types_suitable" CASCADE;
  DROP TABLE "payload"."product_guidance_concerns_primary" CASCADE;
  DROP TABLE "payload"."product_guidance_ingredients_highlighted" CASCADE;
  DROP TABLE "payload"."product_guidance_ingredients_avoid_with" CASCADE;
  DROP TABLE "payload"."product_guidance_how_to_steps" CASCADE;
  DROP TABLE "payload"."product_guidance_pair_with_recommended" CASCADE;
  DROP TABLE "payload"."product_guidance_pair_with_avoid" CASCADE;
  DROP TABLE "payload"."product_guidance_precautions_warnings" CASCADE;
  DROP TABLE "payload"."product_guidance" CASCADE;
  DROP TABLE "payload"."ingredients_avoid_with" CASCADE;
  DROP TABLE "payload"."ingredients" CASCADE;
  DROP TABLE "payload"."routines_steps" CASCADE;
  DROP TABLE "payload"."routines" CASCADE;
  DROP TABLE "payload"."beneficials" CASCADE;
  DROP TABLE "payload"."products_how_to_steps" CASCADE;
  DROP TABLE "payload"."products_pair_with_recommended" CASCADE;
  DROP TABLE "payload"."products_pair_with_avoid" CASCADE;
  DROP TABLE "payload"."products_precautions_warnings" CASCADE;
  DROP TABLE "payload"."products" CASCADE;
  DROP TABLE "payload"."products_locales" CASCADE;
  DROP TABLE "payload"."products_rels" CASCADE;
  DROP TABLE "payload"."categories" CASCADE;
  DROP TABLE "payload"."brands" CASCADE;
  DROP TABLE "payload"."product_types" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."navigation_main_menu_children" CASCADE;
  DROP TABLE "payload"."navigation_main_menu" CASCADE;
  DROP TABLE "payload"."navigation" CASCADE;
  DROP TABLE "payload"."navigation_locales" CASCADE;
  DROP TABLE "payload"."footer_columns_links" CASCADE;
  DROP TABLE "payload"."footer_columns" CASCADE;
  DROP TABLE "payload"."footer_legal_links" CASCADE;
  DROP TABLE "payload"."footer_social_links" CASCADE;
  DROP TABLE "payload"."footer" CASCADE;
  DROP TABLE "payload"."footer_locales" CASCADE;
  DROP TABLE "payload"."homepage_blocks_hero" CASCADE;
  DROP TABLE "payload"."homepage_blocks_featured_products_product_handles" CASCADE;
  DROP TABLE "payload"."homepage_blocks_featured_products" CASCADE;
  DROP TABLE "payload"."homepage_blocks_categories_categories" CASCADE;
  DROP TABLE "payload"."homepage_blocks_categories" CASCADE;
  DROP TABLE "payload"."homepage_blocks_testimonials_testimonials" CASCADE;
  DROP TABLE "payload"."homepage_blocks_testimonials" CASCADE;
  DROP TABLE "payload"."homepage_blocks_content_block" CASCADE;
  DROP TABLE "payload"."homepage_blocks_newsletter" CASCADE;
  DROP TABLE "payload"."homepage_blocks_blog_carousel" CASCADE;
  DROP TABLE "payload"."homepage_blocks_brands_banner_brands" CASCADE;
  DROP TABLE "payload"."homepage_blocks_brands_banner" CASCADE;
  DROP TABLE "payload"."homepage" CASCADE;
  DROP TABLE "payload"."homepage_locales" CASCADE;
  DROP TABLE "payload"."homepage_rels" CASCADE;
  DROP TYPE "payload"."_locales";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_version_status";
  DROP TYPE "payload"."enum__pages_v_published_locale";
  DROP TYPE "payload"."enum_articles_status";
  DROP TYPE "payload"."enum_articles_category";
  DROP TYPE "payload"."enum__articles_v_version_status";
  DROP TYPE "payload"."enum__articles_v_version_category";
  DROP TYPE "payload"."enum__articles_v_published_locale";
  DROP TYPE "payload"."enum_product_guidance_skin_types_suitable";
  DROP TYPE "payload"."enum_product_guidance_concerns_primary";
  DROP TYPE "payload"."enum_product_guidance_pair_with_recommended_order";
  DROP TYPE "payload"."enum_product_guidance_routine_time_time";
  DROP TYPE "payload"."enum_product_guidance_precautions_pregnancy_safe";
  DROP TYPE "payload"."enum_routines_name";
  DROP TYPE "payload"."enum_beneficials_type";
  DROP TYPE "payload"."enum_products_pair_with_recommended_order";
  DROP TYPE "payload"."enum_products_routine_time_time";
  DROP TYPE "payload"."enum_products_precautions_pregnancy_safe";
  DROP TYPE "payload"."enum_navigation_main_menu_children_type";
  DROP TYPE "payload"."enum_navigation_main_menu_type";
  DROP TYPE "payload"."enum_navigation_main_menu_link_type";
  DROP TYPE "payload"."enum_footer_columns_links_type";
  DROP TYPE "payload"."enum_footer_social_links_platform";
  DROP TYPE "payload"."enum_homepage_blocks_hero_variant";
  DROP TYPE "payload"."enum_homepage_blocks_hero_text_position";
  DROP TYPE "payload"."enum_homepage_blocks_hero_text_color";
  DROP TYPE "payload"."enum_homepage_blocks_featured_products_display_type";
  DROP TYPE "payload"."enum_homepage_blocks_categories_layout";
  DROP TYPE "payload"."enum_homepage_blocks_testimonials_display_type";
  DROP TYPE "payload"."enum_homepage_blocks_content_block_layout";
  DROP TYPE "payload"."enum_homepage_blocks_content_block_background_color";
  DROP TYPE "payload"."enum_homepage_blocks_newsletter_background_color";
  DROP TYPE "payload"."enum_homepage_blocks_blog_carousel_source";
  DROP TYPE "payload"."enum_homepage_blocks_blog_carousel_category";
  DROP TYPE "payload"."enum_homepage_blocks_brands_banner_display_type";`)
}
