'use client'

import React from 'react'
import { Card, Stack, Flex, Badge, Text, Label, TextInput, TextArea, Switch } from '@sanity/ui'
import { EditIcon } from '@sanity/icons'

interface TextContentPanelProps {
  customTitle: string
  onTitleChange: (title: string) => void
  customSubtitle: string
  onSubtitleChange: (subtitle: string) => void
  customExcerpt: string
  onExcerptChange: (excerpt: string) => void
  showExcerpt: boolean
  onShowExcerptToggle: () => void
}

export function TextContentPanel({
  customTitle,
  onTitleChange,
  customSubtitle,
  onSubtitleChange,
  customExcerpt,
  onExcerptChange,
  showExcerpt,
  onShowExcerptToggle,
}: TextContentPanelProps) {
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary">3</Badge>
          <Text weight="semibold" size={1}>Texte</Text>
        </Flex>

        <Stack space={2}>
          <Label size={0}>Titel</Label>
          <TextInput
            icon={EditIcon}
            value={customTitle}
            onChange={(e) => onTitleChange(e.currentTarget?.value || '')}
            placeholder="Titel..."
            fontSize={1}
          />
        </Stack>

        <Stack space={2}>
          <Label size={0}>Subtitle</Label>
          <TextInput
            value={customSubtitle}
            onChange={(e) => onSubtitleChange(e.currentTarget?.value || '')}
            placeholder="Subtitle..."
            fontSize={1}
          />
        </Stack>

        <Stack space={2}>
          <Flex justify="space-between" align="center">
            <Label size={0}>Auszug / Excerpt</Label>
            <Switch
              checked={showExcerpt}
              onChange={onShowExcerptToggle}
            />
          </Flex>
          <TextArea
            value={customExcerpt}
            onChange={(e) => onExcerptChange(e.currentTarget?.value || '')}
            placeholder="Artikel-Auszug..."
            rows={3}
            fontSize={1}
          />
        </Stack>
      </Stack>
    </Card>
  )
}

