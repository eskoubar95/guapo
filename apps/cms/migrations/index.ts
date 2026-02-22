import * as migration_20260205_163856 from './20260205_163856';
import * as migration_20260205_164613 from './20260205_164613';
import * as migration_20260205_165847 from './20260205_165847';
import * as migration_20260214_products_description_jsonb from './20260214_products_description_jsonb';
import * as migration_20260214_fix_lexical_empty_root from './20260214_fix_lexical_empty_root';
import * as migration_20260215_products_application_to_subtitle from './20260215_products_application_to_subtitle';
import * as migration_20260215_fix_products_localized_json from './20260215_fix_products_localized_json';

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
];
