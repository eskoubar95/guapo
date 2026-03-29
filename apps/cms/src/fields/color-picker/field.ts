import type { TextField } from 'payload'
import { ColorPickerArgs } from './types'

export const colorField = (options?: ColorPickerArgs): TextField => {
  const baseField: TextField = {
    name: options?.name ?? 'color',
    type: 'text',
    required: options?.required ?? false,
    label: options?.label,
    admin: {
      description: options?.description,
      components: {
        Field: '@/fields/color-picker',
        Cell: '@/fields/color-picker#ColorCell',
      },
    },
    validate: (value) => {
      if (value && !/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) {
        return 'Invalid color format (use HEX e.g. #0F172A or #FFF)'
      }
      return true
    },
  }
  if (typeof options?.overrides === 'function') {
    return options.overrides(baseField)
  }
  return baseField
}
