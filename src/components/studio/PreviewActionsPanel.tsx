'use client'

import React from 'react'
import { Card, Stack, Flex, Text, Badge, Button, Grid } from '@sanity/ui'
import { DownloadIcon, EyeOpenIcon, RocketIcon } from '@sanity/icons'
import type { ContentItem, GraphicFormat, StyleId, LogoPosition, StudioState } from '../../lib/types'
import { FORMATS } from '../../lib/types'
import { getStyle } from '../../lib/styles'
import { PreviewCanvas } from './PreviewCanvas'

interface PreviewActionsPanelProps {
  content: ContentItem | null
  format: GraphicFormat
  style: StyleId
  customTitle: string
  customSubtitle: string
  customExcerpt: string
  primaryColor: string
  logo: { dataUrl: string | null; position: LogoPosition; size: number; opacity: number }
  advanced: StudioState['advanced']
  isGenerating: boolean
  onDownload: (format: GraphicFormat) => void
  onSendToPosting?: (format: GraphicFormat) => void
}

export function PreviewActionsPanel({
  content,
  format,
  style,
  customTitle,
  customSubtitle,
  customExcerpt,
  primaryColor,
  logo,
  advanced,
  isGenerating,
  onDownload,
  onSendToPosting,
}: PreviewActionsPanelProps) {
  const styleConfig = getStyle(style)
  const formatConfig = FORMATS[format]

  return (
    <Stack space={3}>
      {/* Preview */}
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={2}>
              <EyeOpenIcon />
              <Text weight="semibold" size={1}>Vorschau</Text>
            </Flex>
            <Badge tone="caution" fontSize={0}>
              {formatConfig.width}Ã—{formatConfig.height}
            </Badge>
          </Flex>

          <PreviewCanvas
            content={content}
            format={format}
            style={style}
            customTitle={customTitle}
            customSubtitle={customSubtitle}
            customExcerpt={customExcerpt}
            primaryColor={primaryColor}
            logo={logo}
            advanced={advanced}
          />

          <Card padding={2} radius={2} tone="transparent">
            <Grid columns={3} gap={2}>
              <Stack space={1}>
                <Text size={0} muted>Format</Text>
                <Text size={0} weight="medium">{format === 'feed' ? 'Feed' : 'Story'}</Text>
              </Stack>
              <Stack space={1}>
                <Text size={0} muted>Style</Text>
                <Text size={0} weight="medium">{styleConfig.nameDE}</Text>
              </Stack>
              <Stack space={1}>
                <Text size={0} muted>Text</Text>
                <Text size={0} weight="medium">{advanced.textScale}%</Text>
              </Stack>
            </Grid>
          </Card>
        </Stack>
      </Card>

      {/* Download */}
      <Card padding={4} radius={2} shadow={1} tone="primary">
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <DownloadIcon />
            <Text weight="semibold" size={1}>Download</Text>
          </Flex>

          <Stack space={2}>
            <Button
              icon={DownloadIcon}
              mode="default"
              tone="primary"
              text="Feed PNG (1080Ã—1440)"
              onClick={() => onDownload('feed')}
              disabled={!content || isGenerating}
              loading={isGenerating}
              fontSize={1}
            />
            <Button
              icon={DownloadIcon}
              mode="default"
              tone="primary"
              text="Story PNG (1080Ã—1920)"
              onClick={() => onDownload('story')}
              disabled={!content || isGenerating}
              loading={isGenerating}
              fontSize={1}
            />
            <Button
              icon={DownloadIcon}
              mode="ghost"
              text="Beide herunterladen"
              onClick={async () => {
                await onDownload('feed')
                await new Promise(r => setTimeout(r, 500))
                onDownload('story')
              }}
              disabled={!content || isGenerating}
              fontSize={1}
            />
          </Stack>

          {!content && (
            <Text size={0} muted align="center">
              â†‘ WÃ¤hle zuerst einen Artikel
            </Text>
          )}
        </Stack>
      </Card>

      {/* Send to Posting */}
      {onSendToPosting && (
        <Card padding={4} radius={2} shadow={1} tone="positive">
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <RocketIcon />
              <Text weight="semibold" size={1}>Social Media Posting</Text>
            </Flex>

            <Stack space={2}>
              <Button
                icon={RocketIcon}
                mode="default"
                tone="positive"
                text="ðŸ“° Feed zum Posting senden (1080Ã—1440)"
                onClick={() => onSendToPosting('feed')}
                disabled={!content || isGenerating}
                loading={isGenerating}
                fontSize={1}
              />
              <Button
                icon={RocketIcon}
                mode="default"
                tone="positive"
                text="ðŸ“– Story zum Posting senden (1080Ã—1920)"
                onClick={() => onSendToPosting('story')}
                disabled={!content || isGenerating}
                loading={isGenerating}
                fontSize={1}
              />
            </Stack>

            <Text size={0} muted>
              Sendet das Bild direkt zum Social Media Posting Tab
            </Text>
          </Stack>
        </Card>
      )}

      {/* Features Info */}
      <Card padding={3} radius={2} tone="transparent" style={{ border: '1px solid var(--card-border-color)' }}>
        <Stack space={2}>
          <Text size={0} weight="semibold">Features</Text>
          <Grid columns={2} gap={1}>
            <Text size={0} muted>âœ“ 5 Design-Styles</Text>
            <Text size={0} muted>âœ“ Text-Skalierung</Text>
            <Text size={0} muted>âœ“ Artikel-Auszug</Text>
            <Text size={0} muted>âœ“ Logo-Upload</Text>
            <Text size={0} muted>âœ“ QR-Code</Text>
            <Text size={0} muted>âœ“ Wasserzeichen</Text>
            <Text size={0} muted>âœ“ Blur-Effekt</Text>
            <Text size={0} muted>âœ“ Rahmen</Text>
          </Grid>
        </Stack>
      </Card>
    </Stack>
  )
}

