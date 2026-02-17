'use client'

import React from 'react'
import { Card, Stack, Text, Grid, Box } from '@sanity/ui'
import type { InstagramFormat } from './types'
import { INSTAGRAM_FORMATS } from './types'

interface InstagramFormatSelectorProps {
  selectedFormat: InstagramFormat
  onFormatChange: (format: InstagramFormat) => void
  disabled?: boolean
}

export function InstagramFormatSelector({
  selectedFormat,
  onFormatChange,
  disabled = false,
}: InstagramFormatSelectorProps) {
  const formats: InstagramFormat[] = ['square', 'portrait', 'landscape']

  return (
    <Stack space={3}>
      <Text size={1} weight="semibold">
        ðŸ“ Instagram-Format
      </Text>
      <Grid columns={3} gap={2}>
        {formats.map((format) => {
          const dimensions = INSTAGRAM_FORMATS[format]
          const isSelected = selectedFormat === format

          return (
            <Card
              key={format}
              as="button"
              type="button"
              padding={3}
              radius={2}
              tone={isSelected ? 'primary' : 'default'}
              border
              style={{
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.2s ease',
                borderWidth: isSelected ? '2px' : '1px',
                borderColor: isSelected ? 'var(--card-primary-fg-color)' : undefined,
              }}
              onClick={() => !disabled && onFormatChange(format)}
            >
              <Stack space={2}>
                {/* Visual representation */}
                <Box
                  style={{
                    width: '100%',
                    aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(214, 41, 118, 0.3), rgba(252, 176, 69, 0.3))'
                      : 'var(--card-border-color)',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    border: isSelected ? '2px solid var(--card-primary-fg-color)' : '1px solid var(--card-border-color)',
                  }}
                />
                {/* Label & Dimensions */}
                <Stack space={1}>
                  <Text size={1} weight={isSelected ? 'bold' : 'medium'} align="center">
                    {dimensions.label}
                  </Text>
                  <Text size={0} muted align="center">
                    {dimensions.width} Ã— {dimensions.height}px
                  </Text>
                </Stack>
              </Stack>
            </Card>
          )
        })}
      </Grid>
      
      {/* Helper Info */}
      <Card padding={2} radius={2} tone="transparent" border>
        <Text size={0} muted>
          ðŸ’¡ <strong>Tipp:</strong> WÃ¤hle das Format basierend auf deinem Bild und Feed-Strategie. 
          Bilder werden automatisch zugeschnitten, kÃ¶nnen aber vorher frei positioniert werden.
        </Text>
      </Card>
    </Stack>
  )
}

