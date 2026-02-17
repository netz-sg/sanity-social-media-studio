'use client'

import React from 'react'
import { Card, Stack, Flex, Badge, Text, Label, TextInput, Select, Spinner } from '@sanity/ui'
import { SearchIcon, CheckmarkCircleIcon } from '@sanity/icons'
import type { ContentItem } from '../../lib/types'

interface ContentSelectionPanelProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filteredContent: ContentItem[]
  selectedContent: ContentItem | null
  onContentSelect: (contentId: string) => void
  isLoadingContent: boolean
}

export function ContentSelectionPanel({
  searchQuery,
  onSearchChange,
  filteredContent,
  selectedContent,
  onContentSelect,
  isLoadingContent,
}: ContentSelectionPanelProps) {
  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Badge tone="primary">1</Badge>
          <Text weight="semibold" size={1}>Content</Text>
        </Flex>

        <Stack space={2}>
            <Label size={0}>Content suchen</Label>
          <TextInput
            icon={SearchIcon}
            placeholder="Titel..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.currentTarget?.value || '')}
            fontSize={1}
          />
        </Stack>

        {isLoadingContent ? (
          <Flex padding={3} justify="center">
            <Spinner muted />
          </Flex>
        ) : (
          <Stack space={2}>
            <Label size={0}>Artikel ({filteredContent.length})</Label>
            <Select
              value={selectedContent?._id || ''}
              onChange={(e) => {
                const value = e.currentTarget?.value
                if (value) onContentSelect(value)
              }}
              fontSize={1}
            >
              <option value="">Content wÃ¤hlen...</option>
              {filteredContent.map((item) => {
                const typeLabel = item._type === 'concertReport' ? 'ðŸŽ¸ ' : item._type === 'aftershowStory' ? 'ðŸŒ™ ' : 'ðŸ“° '
                const title = item.title || 'Ohne Titel'
                const displayTitle = title.length > 50 ? title.substring(0, 50) + '...' : title
                return (
                  <option key={item._id} value={item._id}>
                    {typeLabel}{displayTitle}
                  </option>
                )
              })}
            </Select>
          </Stack>
        )}

        {selectedContent && (
          <Card padding={2} radius={2} tone="positive">
            <Flex align="center" gap={2}>
              <CheckmarkCircleIcon />
              <Text size={0}>
                  {selectedContent.title && selectedContent.title.length > 35
                    ? selectedContent.title.substring(0, 35) + '...'
                    : selectedContent.title || 'Ohne Titel'}
                </Text>
            </Flex>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

