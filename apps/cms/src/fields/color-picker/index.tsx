'use client'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  useCellProps,
  useField,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ColorPickerProps } from './types'
import './style.scss'

type ColorPickerFieldProps = ColorPickerProps & {
  path?: string
  field?: { name: string; admin?: { readOnly?: boolean } }
  readOnly?: boolean
}

const ColorPicker: React.FC<ColorPickerFieldProps> = ({
  path,
  field,
  colorPresets = [],
  debounceDelay = 300,
  showTextInput = true,
  readOnly: readOnlyProp,
}) => {
  const fieldPath = path ?? field?.name
  const { setValue, value, disabled, showError } = useField<string>({
    path: fieldPath,
  })
  const [localValue, setLocalValue] = useState<string>(value ?? '')
  const colorInputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const actualReadOnly = readOnlyProp ?? field?.admin?.readOnly ?? false

  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value ?? '')
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps -- sync from server value only

  const debouncedSetValue = useCallback(
    (newValue: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        setValue(newValue)
      }, debounceDelay)
    },
    [setValue, debounceDelay],
  )

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalValue(newColor)
    debouncedSetValue(newColor)
  }

  const handlePresetClick = (color: string) => {
    if (actualReadOnly) return
    setLocalValue(color)
    setValue(color)
    if (colorInputRef.current) {
      colorInputRef.current.value = color
    }
  }

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newColor = e.target.value
    if (newColor && !newColor.startsWith('#')) {
      newColor = `#${newColor}`
    }
    setLocalValue(newColor)
    debouncedSetValue(newColor)
  }

  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(localValue) || /^#[0-9A-Fa-f]{3}$/.test(localValue)

  return (
    <div className="color-picker">
      <div className="color-picker__main">
        {fieldPath && <FieldLabel path={fieldPath} />}
        {fieldPath && <FieldDescription path={fieldPath} />}
        <div className="color-picker__input-group">
          <input
            ref={colorInputRef}
            type="color"
            value={localValue && isValidHex ? localValue : '#000000'}
            onChange={handleColorChange}
            disabled={disabled || actualReadOnly}
            className="color-picker__color-input"
            aria-label="Vælg farve"
          />
          {showTextInput && (
            <input
              type="text"
              value={localValue}
              onChange={handleTextInputChange}
              readOnly={actualReadOnly}
              disabled={disabled}
              placeholder="#0F172A"
              className="color-picker__text-input"
              aria-label="HEX farve"
            />
          )}
        </div>
        {showError && fieldPath && <FieldError path={fieldPath} />}
        {!isValidHex && localValue && (
          <span className="color-picker__error">Ugyldig HEX (brug f.eks. #0F172A)</span>
        )}
      </div>
      {colorPresets.length > 0 && (
        <div className={`color-picker__presets ${actualReadOnly ? 'color-picker__presets--disabled' : ''}`}>
          <span className="color-picker__presets-label">Presets</span>
          <div className="color-picker__presets-grid">
            {colorPresets.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => handlePresetClick(color)}
                disabled={actualReadOnly}
                className={`color-picker__preset ${localValue === color ? 'color-picker__preset--active' : ''}`}
                style={{ backgroundColor: color }}
                aria-label={`Vælg ${color}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPicker

export const ColorCell: React.FC = () => {
  const cellProps = useCellProps()
  const value = cellProps?.cellData as string | undefined
  return (
    <div className="color-cell">
      {value && (
        <span
          className="cell-indicator"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      )}
      {value && <span>{value}</span>}
    </div>
  )
}
