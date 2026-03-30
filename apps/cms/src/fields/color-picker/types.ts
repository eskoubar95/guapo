import type { TextField } from 'payload'

export type ColorPickerArgs = {
  /** @default 'color' */
  name?: string
  /** Admin label (e.g. "Text & button color") */
  label?: string
  /** @default false */
  required?: boolean
  colorPresets?: string[]
  /** @default 300 */
  debounceDelay?: number
  description?: string
  /** @default true */
  showTextInput?: boolean
  overrides?: (field: TextField) => TextField
}

export type ColorPickerProps = Pick<
  ColorPickerArgs,
  'colorPresets' | 'debounceDelay' | 'showTextInput'
>
