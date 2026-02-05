import * as migration_20260205_163856 from './20260205_163856';
import * as migration_20260205_164613 from './20260205_164613';
import * as migration_20260205_165847 from './20260205_165847';

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
    name: '20260205_165847'
  },
];
