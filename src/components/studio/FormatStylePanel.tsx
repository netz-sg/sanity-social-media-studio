'use client'

import React from 'react'
import { Card, Stack, Flex, Badge, Text, Grid } from '@sanity/ui'
import type { GraphicFormat, StyleId } from '../../lib/types'
import { FORMATS } from '../../lib/types'
import { STYLES } from '../../lib/styles'
import { StyleThumbnail } from './StyleThumbnail'

interface FormatStylePanelProps {
  format: GraphicFormat
  onFormatChange: (format: GraphicFormat) => void
  style: StyleId
  onStyleChange: (style: StyleId) => void
}

export function FormatStylePanel({
  format,
  onFormatChange,
  style,
  onStyleChange,
}: FormatStylePanelProps) {
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary">2</Badge>
          <Text weight="semibold" size={1}>Format & Style</Text>
        </Flex>

        <Flex gap={2}>
          {(['feed', 'story'] as GraphicFormat[]).map((f) => (
            <Card
              key={f}
              padding={2}
              radius={2}
              tone={format === f ? 'primary' : 'default'}
              shadow={format === f ? 2 : 1}
              style={{
                flex: 1,
                cursor: 'pointer',
                textAlign: 'center',
                border: format === f ? '2px solid var(--card-focus-ring-color)' : '2px solid transparent',
              }}
              onClick={() => onFormatChange(f)}
            >
              <Stack space={1}>
                <Text size={1} weight="bold">{FORMATS[f].label}</Text>
                <Text size={0} muted>{FORMATS[f].width}Ã—{FORMATS[f].height}</Text>
              </Stack>
            </Card>
          ))}
        </Flex>

        <Grid columns={5} gap={2}>
          {STYLES.map((s) => (
            <StyleThumbnail
              key={s.id}
              style={s}
              isSelected={style === s.id}
              onClick={() => onStyleChange(s.id)}
            />
          ))}
        </Grid>
      </Stack>
    </Card>
  )
}

