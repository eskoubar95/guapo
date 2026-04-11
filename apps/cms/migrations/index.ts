import * as migration_20260205_163856 from './20260205_163856';
import * as migration_20260205_164613 from './20260205_164613';
import * as migration_20260205_165847 from './20260205_165847';
import * as migration_20260214_products_description_jsonb from './20260214_products_description_jsonb';
import * as migration_20260214_fix_lexical_empty_root from './20260214_fix_lexical_empty_root';
import * as migration_20260215_products_application_to_subtitle from './20260215_products_application_to_subtitle';
import * as migration_20260215_fix_products_localized_json from './20260215_fix_products_localized_json';
import * as migration_20260308_content_block_text_only_left from './20260308_content_block_text_only_left';
import * as migration_20260411_image_text_breakout_visual_video from './20260411_image_text_breakout_visual_video';
import * as migration_20260411_brands_medusa_id_and_meta_image from './20260411_brands_medusa_id_and_meta_image';
import * as migration_20260412_products_locales_seo_meta from './20260412_products_locales_seo_meta';

export const migrations = [
  {
    up: migration_20260205_163856.up,
    down: migration_20260205_163856.down,
    name: '20260205_163856',
  },
  {
    up: migration_20260205_164613.up,
    down: migration_20260205_164613.down,
    name: '20260205_164613',
  },
  {
    up: migration_20260205_165847.up,
    down: migration_20260205_165847.down,
    name: '20260205_165847',
  },
  {
    up: migration_20260214_products_description_jsonb.up,
    down: migration_20260214_products_description_jsonb.down,
    name: '20260214_products_description_jsonb',
  },
  {
    up: migration_20260214_fix_lexical_empty_root.up,
    down: migration_20260214_fix_lexical_empty_root.down,
    name: '20260214_fix_lexical_empty_root',
  },
  {
    up: migration_20260215_products_application_to_subtitle.up,
    down: migration_20260215_products_application_to_subtitle.down,
    name: '20260215_products_application_to_subtitle',
  },
  {
    up: migration_20260215_fix_products_localized_json.up,
    down: migration_20260215_fix_products_localized_json.down,
    name: '20260215_fix_products_localized_json',
  },
  {
    up: migration_20260308_content_block_text_only_left.up,
    down: migration_20260308_content_block_text_only_left.down,
    name: '20260308_content_block_text_only_left',
  },
  {
    up: migration_20260411_image_text_breakout_visual_video.up,
    down: migration_20260411_image_text_breakout_visual_video.down,
    name: '20260411_image_text_breakout_visual_video',
  },
  {
    up: migration_20260411_brands_medusa_id_and_meta_image.up,
    down: migration_20260411_brands_medusa_id_and_meta_image.down,
    name: '20260411_brands_medusa_id_and_meta_image',
  },
  {
    up: migration_20260412_products_locales_seo_meta.up,
    down: migration_20260412_products_locales_seo_meta.down,
    name: '20260412_products_locales_seo_meta',
  },
];
