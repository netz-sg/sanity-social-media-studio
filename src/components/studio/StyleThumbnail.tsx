'use client'

import React from 'react'
import { Card, Stack, Text, Box, Tooltip } from '@sanity/ui'
import type { StyleId } from '../../lib/types'
import { STYLES } from '../../lib/styles'
import { STYLE_COLORS } from './constants'

interface StyleThumbnailProps {
  style: (typeof STYLES)[0]
  isSelected: boolean
  onClick: () => void
}

export function StyleThumbnail({ style, isSelected, onClick }: StyleThumbnailProps) {
  const colors = STYLE_COLORS[style.id]

  return (
    <Tooltip
      content={
        <Box padding={2}>
          <Text size={1}>{style.descriptionDE}</Text>
        </Box>
      }
      portal
    >
      <Card
        padding={2}
        radius={2}
        shadow={isSelected ? 2 : 1}
        tone={isSelected ? 'primary' : 'default'}
        style={{
          cursor: 'pointer',
          border: isSelected ? '2px solid var(--card-focus-ring-color)' : '2px solid transparent',
          transition: 'all 0.2s ease',
        }}
        onClick={onClick}
      >
        <Stack space={2}>
          {/* Mini Preview */}
          <Box
            style={{
              width: '100%',
              aspectRatio: '3/4',
              background: colors.bg,
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Accent badge */}
            <Box
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: '35%',
                height: '12px',
                background: colors.accent,
                borderRadius: style.id === 'minimal' ? '0' : '2px',
                boxShadow: style.id === 'neon' ? `0 0 8px ${colors.accent}` : 'none',
              }}
            />
            {/* Title lines */}
            <Box
              style={{
                position: 'absolute',
                top: '45%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '75%',
                textAlign: 'center',
              }}
            >
              <Box
                style={{
                  height: '10px',
                  background: style.id === 'neon' ? '#ff073a' : colors.text,
                  marginBottom: '6px',
                  boxShadow: style.id === 'neon' ? '0 0 8px #ff073a' : 'none',
                }}
              />
              <Box
                style={{
                  height: '7px',
                  background: style.typography.subtitleColor,
                  width: '65%',
                  margin: '0 auto 5px',
                }}
              />
              <Box
                style={{
                  height: '5px',
                  background: 'rgba(255,255,255,0.4)',
                  width: '80%',
                  margin: '0 auto',
                }}
              />
            </Box>
            {/* Corner accents */}
            {style.accent.cornerAccents && (
              <>
                <Box
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    width: '12px',
                    height: '12px',
                    borderTop: `2px solid ${colors.accent}`,
                    borderLeft: `2px solid ${colors.accent}`,
                  }}
                />
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    width: '12px',
                    height: '12px',
                    borderBottom: `2px solid ${colors.accent}`,
                    borderRight: `2px solid ${colors.accent}`,
                  }}
                />
              </>
            )}
            {/* Scanlines for neon */}
            {style.effects.scanlines && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
                }}
              />
            )}
          </Box>
          {/* Label */}
          <Text size={0} align="center" weight={isSelected ? 'bold' : 'regular'}>
            {style.nameDE}
          </Text>
        </Stack>
      </Card>
    </Tooltip>
  )
}

