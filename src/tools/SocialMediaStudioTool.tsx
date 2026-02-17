'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Card, Stack, Flex, Badge, useToast, Heading, Grid, Container, Button, Text } from '@sanity/ui'
import { ImageIcon, ResetIcon } from '@sanity/icons'
import { useClient } from 'sanity'
import type { ContentItem, GraphicFormat, StyleId, StudioState } from '../lib/types'
import { DEFAULT_ADVANCED_SETTINGS, DEFAULT_LOGO_CONFIG } from '../lib/types'
import { ContentSelectionPanel } from '../components/studio/ContentSelectionPanel'
import { FormatStylePanel } from '../components/studio/FormatStylePanel'
import { TextContentPanel } from '../components/studio/TextContentPanel'
import { DesignSettingsPanel } from '../components/studio/DesignSettingsPanel'
import { LogoSettingsPanel } from '../components/studio/LogoSettingsPanel'
import { PreviewActionsPanel } from '../components/studio/PreviewActionsPanel'

// ============================================
// MAIN TOOL COMPONENT
// ============================================

export function SocialMediaStudioTool({ onSendToPosting }: { onSendToPosting?: (imageUrl: string) => void }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()

  // State
  const [state, setState] = useState<StudioState>({
    contentType: 'post',
    selectedContent: null,
    format: 'feed',
    style: 'industrial',
    customTitle: '',
    customSubtitle: '',
    customExcerpt: '',
    primaryColor: '#dc2626',
    logo: DEFAULT_LOGO_CONFIG,
    advanced: DEFAULT_ADVANCED_SETTINGS,
    isGenerating: false,
  })

  const [contentList, setContentList] = useState<ContentItem[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Load content based on type
  useEffect(() => {
    const loadContent = async () => {
      setIsLoadingContent(true)
      try {
          const query = `*[_type in ["post", "concertReport", "aftershowStory"] && language == "de"] | order(publishedAt desc, concertDate desc, eventDate desc)[0...100] {
            _id, _type, title, subtitle, publishedAt, language,
            excerpt,
            "mainImage": mainImage { "url": asset->url, alt },
            "categories": categories[0...1]->{ title },
            "author": author->{ name },
            authorName,
            concertDate,
            eventDate,
            location,
        }`

        const data = await client.fetch<ContentItem[]>(query)
        setContentList(data || [])
      } catch (err) {
        console.error('Error loading content:', err)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Content konnte nicht geladen werden',
        })
      } finally {
        setIsLoadingContent(false)
      }
    }

    loadContent()
  }, [client, state.contentType, toast])

  // Filter content based on search
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return contentList
    const query = searchQuery.toLowerCase()
    return contentList.filter((item) => 
      item.title?.toLowerCase().includes(query)
    )
  }, [contentList, searchQuery])

  // Handle content selection
  const handleContentSelect = useCallback((contentId: string) => {
    const content = contentList.find((c) => c._id === contentId)
    if (content) {
      setState((prev) => ({
        ...prev,
        selectedContent: content,
        customTitle: content.title || '',
        customSubtitle: content.subtitle || '',
        customExcerpt: content.excerpt || '',
      }))
    }
  }, [contentList])

  // Handle download - uses POST for logo support (base64 too large for URL)
  const handleDownload = useCallback(
    async (downloadFormat: GraphicFormat) => {
      if (!state.selectedContent) {
        toast.push({
          status: 'warning',
          title: 'Kein Content ausgewÃ¤hlt',
          description: 'Bitte wÃ¤hle zuerst einen Artikel aus',
        })
        return
      }

      setState((prev) => ({ ...prev, isGenerating: true }))

      try {
        const baseUrl = window.location.origin
        
        const requestBody = {
          id: state.selectedContent._id,
          style: state.style,
          locale: 'de',
          title: state.customTitle !== state.selectedContent.title ? state.customTitle : undefined,
          subtitle: state.customSubtitle || undefined,
          excerpt: state.customExcerpt || undefined,
          primaryColor: state.primaryColor !== '#dc2626' ? state.primaryColor : undefined,
          textScale: state.advanced.textScale,
          blurIntensity: state.advanced.blurIntensity,
          showExcerpt: state.advanced.showExcerpt,
          showQRCode: state.advanced.showQRCode,
          showWatermark: state.advanced.showWatermark,
          watermarkText: state.advanced.watermarkText,
          textPosition: state.advanced.textPosition,
          textAlign: state.advanced.textAlign,
          showBorder: state.advanced.showBorder,
          borderWidth: state.advanced.borderWidth,
          borderColor: state.advanced.borderColor,
          logoDataUrl: state.logo.dataUrl || undefined,
          logoPosition: state.logo.position,
          logoSize: state.logo.size,
          logoOpacity: state.logo.opacity,
        }

        const response = await fetch(`${baseUrl}/api/social-graphics/${downloadFormat}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `social-${downloadFormat}-${state.style}-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        toast.push({
          status: 'success',
          title: `${downloadFormat === 'feed' ? 'Feed' : 'Story'} heruntergeladen`,
          description: 'PNG erfolgreich erstellt',
        })
      } catch (error) {
        console.error('Download error:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Graphic konnte nicht generiert werden',
        })
      } finally {
        setState((prev) => ({ ...prev, isGenerating: false }))
      }
    },
    [state, toast],
  )

  // Handle send to posting tab
  const handleSendToPosting = useCallback(
    async (format: GraphicFormat) => {
      if (!state.selectedContent) return

      setState((prev) => ({ ...prev, isGenerating: true }))

      try {
        const baseUrl = window.location.origin

        const requestBody = {
          id: state.selectedContent._id,
          style: state.style,
          locale: 'de',
          title: state.customTitle !== state.selectedContent.title ? state.customTitle : undefined,
          subtitle: state.customSubtitle || undefined,
          excerpt: state.customExcerpt || undefined,
          primaryColor: state.primaryColor !== '#dc2626' ? state.primaryColor : undefined,
          textScale: state.advanced.textScale,
          blurIntensity: state.advanced.blurIntensity,
          showExcerpt: state.advanced.showExcerpt,
          showQRCode: state.advanced.showQRCode,
          showWatermark: state.advanced.showWatermark,
          watermarkText: state.advanced.watermarkText,
          textPosition: state.advanced.textPosition,
          textAlign: state.advanced.textAlign,
          showBorder: state.advanced.showBorder,
          borderWidth: state.advanced.borderWidth,
          borderColor: state.advanced.borderColor,
          logoDataUrl: state.logo.dataUrl || undefined,
          logoPosition: state.logo.position,
          logoSize: state.logo.size,
          logoOpacity: state.logo.opacity,
        }

        const response = await fetch(`${baseUrl}/api/social-graphics/${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const blob = await response.blob()

        if (onSendToPosting) {
          try {
            const formData = new FormData()
            const filename = `social-graphic-${Date.now()}.png`
            formData.append('file', blob, filename)

            const uploadResponse = await fetch('/api/late/media/upload', {
              method: 'POST',
              body: formData,
            })

            if (!uploadResponse.ok) {
              const uploadError = await uploadResponse.json()
              throw new Error(uploadError.error || 'Upload failed')
            }

            const uploadData = await uploadResponse.json()
            const httpUrl = uploadData.downloadUrl || uploadData.publicUrl || uploadData.url

            if (!httpUrl) {
              throw new Error('No URL returned from upload')
            }

            console.log('[Graphics Studio] Uploaded image to Late CDN:', httpUrl)
            onSendToPosting(httpUrl)
            toast.push({
              status: 'success',
              title: 'Zum Posting gesendet',
              description: 'Bild wurde hochgeladen und zum Social Media Posting hinzugefÃ¼gt',
            })
          } catch (uploadError) {
            console.error('[Graphics Studio] Upload to Late API failed:', uploadError)
            toast.push({
              status: 'error',
              title: 'Upload fehlgeschlagen',
              description: uploadError instanceof Error ? uploadError.message : 'Bild konnte nicht hochgeladen werden',
            })
          }
        }
      } catch (error) {
        console.error('Send to posting error:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Bild konnte nicht generiert werden',
        })
      } finally {
        setState((prev) => ({ ...prev, isGenerating: false }))
      }
    },
    [state, onSendToPosting, toast],
  )

  // Handle reset
  const handleReset = useCallback(() => {
    setState({
      contentType: 'post',
      selectedContent: null,
      format: 'feed',
      style: 'industrial',
      customTitle: '',
      customSubtitle: '',
      customExcerpt: '',
      primaryColor: '#dc2626',
      logo: DEFAULT_LOGO_CONFIG,
      advanced: DEFAULT_ADVANCED_SETTINGS,
      isGenerating: false,
    })
    setSearchQuery('')
  }, [])

  return (
    <Card height="fill" overflow="auto">
      <Container width={3} padding={4}>
        <Stack space={4}>
          {/* Header */}
          <Flex align="center" justify="space-between">
            <Stack space={2}>
              <Flex align="center" gap={3}>
                <ImageIcon style={{ fontSize: 28 }} />
                <Heading as="h1" size={2}>
                  Social Media Studio
                </Heading>
                <Badge tone="primary" fontSize={0}>v2.1</Badge>
              </Flex>
              <Text muted size={1}>
                Erstelle professionelle Social Media Graphics fÃ¼r Instagram
              </Text>
            </Stack>
            <Button
              icon={ResetIcon}
              mode="ghost"
              tone="default"
              text="Reset"
              onClick={handleReset}
              fontSize={1}
            />
          </Flex>

          {/* CONTENT */}
          <Grid columns={[1, 1, 2]} gap={4}>
            {/* LEFT COLUMN - Settings */}
            <Stack space={3}>
              <ContentSelectionPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filteredContent={filteredContent}
                selectedContent={state.selectedContent}
                onContentSelect={handleContentSelect}
                isLoadingContent={isLoadingContent}
              />

              <FormatStylePanel
                format={state.format}
                onFormatChange={(format) => setState((prev) => ({ ...prev, format }))}
                style={state.style}
                onStyleChange={(style: StyleId) => setState((prev) => ({ ...prev, style }))}
              />

              <TextContentPanel
                customTitle={state.customTitle}
                onTitleChange={(customTitle) => setState((prev) => ({ ...prev, customTitle }))}
                customSubtitle={state.customSubtitle}
                onSubtitleChange={(customSubtitle) => setState((prev) => ({ ...prev, customSubtitle }))}
                customExcerpt={state.customExcerpt}
                onExcerptChange={(customExcerpt) => setState((prev) => ({ ...prev, customExcerpt }))}
                showExcerpt={state.advanced.showExcerpt}
                onShowExcerptToggle={() => setState((prev) => ({
                  ...prev,
                  advanced: { ...prev.advanced, showExcerpt: !prev.advanced.showExcerpt }
                }))}
              />

              <DesignSettingsPanel
                primaryColor={state.primaryColor}
                onPrimaryColorChange={(primaryColor) => setState((prev) => ({ ...prev, primaryColor }))}
                advanced={state.advanced}
                onAdvancedChange={(advanced) => setState((prev) => ({ ...prev, advanced }))}
                showAdvanced={showAdvanced}
                onShowAdvancedToggle={() => setShowAdvanced(!showAdvanced)}
              />

              <LogoSettingsPanel
                logo={state.logo}
                onLogoChange={(logo) => setState((prev) => ({ ...prev, logo }))}
              />
            </Stack>

            {/* RIGHT COLUMN - Preview & Download */}
            <PreviewActionsPanel
              content={state.selectedContent}
              format={state.format}
              style={state.style}
              customTitle={state.customTitle}
              customSubtitle={state.customSubtitle}
              customExcerpt={state.customExcerpt}
              primaryColor={state.primaryColor}
              logo={state.logo}
              advanced={state.advanced}
              isGenerating={state.isGenerating}
              onDownload={handleDownload}
              onSendToPosting={onSendToPosting ? handleSendToPosting : undefined}
            />
          </Grid>
        </Stack>
      </Container>
    </Card>
  )
}

export default SocialMediaStudioTool

