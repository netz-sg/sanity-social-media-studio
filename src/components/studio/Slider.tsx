'use client'

import React from 'react'
import { Stack, Flex, Label, Text } from '@sanity/ui'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: SliderProps) {
  return (
    <Stack space={2}>
      <Flex justify="space-between" align="center">
        <Label size={0}>{label}</Label>
        <Text size={0} muted>
          {value}{unit}
        </Text>
      </Flex>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: 'var(--card-border-color)',
          cursor: 'pointer',
          accentColor: 'var(--card-focus-ring-color)',
        }}
      />
    </Stack>
  )
}

