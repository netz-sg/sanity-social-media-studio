'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  Card,
  Stack,
  Button,
  Text,
  Spinner,
  Box,
  Flex,
  Badge,
  useToast,
  Heading,
  Label,
  Grid,
  Container,
  TextInput,
  Switch,
  TextArea,
  Dialog,
} from '@sanity/ui'
import {
  ImageIcon,
  UploadIcon,
  EyeOpenIcon,
  CogIcon,
  TrashIcon,
  RocketIcon,
  CalendarIcon,
  DocumentsIcon,
  DocumentIcon,
  DocumentTextIcon,
  ImagesIcon,
  DownloadIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from '@sanity/icons'
import { useClient } from 'sanity'
import type {
  ContentItem,
} from '../lib/types'

// Import existing Social Media Studio Tool
import { SocialMediaStudioTool as GraphicsStudio } from './SocialMediaStudioTool'
import { ConcertDayGenerator } from './ConcertDayGenerator'
import { InstagramFormatSelector } from '../components/social-media/InstagramFormatSelector'
import { DeviceMockup } from '../components/social-media/DeviceMockup'
import { SettingsTab } from '../components/social-media/SettingsTab'
import { DraftsTemplatesTab } from '../components/social-media/DraftsTemplatesTab'
import type { InstagramFormat } from '../components/social-media/types'

// ============================================
// TYPES FOR SOCIAL MEDIA POSTING
// ============================================

type Platform = 'instagram' | 'facebook' | 'threads' | 'twitter'
type InstagramPostType = 'feed' | 'story' | 'reel' | 'carousel'

interface SocialMediaAccount {
  accountId: string
  platform: Platform
  username: string
  isActive: boolean
}

interface SocialMediaTemplate {
  _id: string
  title: string
  category: string
  content: string
  hashtags?: string
  platforms?: Platform[]
  instagramPostType?: InstagramPostType
  language: string
  description?: string
  exampleData?: {
    title?: string
    date?: string
    location?: string
    venue?: string
    time?: string
    price?: string
    url?: string
  }
  usageCount?: number
}

interface Concert {
  _id: string
  venue: string
  city: string
  country: string
  date: string
  status: string
  ticketLink?: string
  doorsOpen?: string
  showStart?: string
  description?: string
  specialGuests?: string
  tourName?: string
  tourSlug?: string
  bandName?: string
  bandSlug?: string
  venueImage?: {
    asset?: { url: string; metadata?: { lqip?: string } }
    alt?: string
  }
}

interface PostState {
  content: string
  hashtags: string
  photographer: string
  selectedPlatforms: Platform[]
  platformTexts: Record<Platform, string>
  platformFirstComments: Record<Platform, string> // NEW: First comment per platform
  instagramPostType: InstagramPostType
  instagramFormat: InstagramFormat // Instagram format (square, portrait, landscape)
  scheduledFor: string | null
  publishNow: boolean
  selectedContent: ContentItem | null
  mediaUrls: string[]
  isUploading: boolean
  isPosting: boolean
}

// ============================================
// TEMPLATE SELECTOR COMPONENT
// ============================================

interface TemplateSelectorCardProps {
  onTemplateSelect: (template: SocialMediaTemplate) => void
  onMediaAdd?: (url: string) => void
  language: string
}

function TemplateSelectorCard({ onTemplateSelect, onMediaAdd, language }: TemplateSelectorCardProps) {
  const toast = useToast()
  const [templates, setTemplates] = useState<SocialMediaTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<SocialMediaTemplate | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<SocialMediaTemplate | null>(null)
  const [showConcertSelector, setShowConcertSelector] = useState(false)
  const [showImageSuggester, setShowImageSuggester] = useState<'news' | 'aftershow' | 'concertreports' | 'posts' | 'all' | null>(null)

  const categories = [
    { value: 'concert', icon: 'ðŸŽ¸', label: 'Konzert' },
    { value: 'news', icon: 'ðŸ“°', label: 'News' },
    { value: 'giveaway', icon: 'ðŸŽ', label: 'Gewinnspiel' },
    { value: 'tour', icon: 'ðŸ—ºï¸', label: 'Tour' },
    { value: 'aftershow', icon: 'ðŸ“¸', label: 'Aftershow' },
    { value: 'release', icon: 'ðŸ’¿', label: 'Release' },
    { value: 'video', icon: 'ðŸŽ¬', label: 'Video' },
    { value: 'general', icon: 'âœ¨', label: 'Allgemein' },
  ]

  const loadTemplates = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      // Don't filter by language - show all templates
      if (selectedCategory) {
        params.append('category', selectedCategory)
      }

      const response = await fetch(`/api/social-templates?${params.toString()}`)
      const data = await response.json()

      console.log('[Template Selector] Response:', {
        ok: response.ok,
        status: response.status,
        templatesCount: data.templates?.length || 0,
        templates: data.templates,
      })

      if (response.ok) {
        setTemplates(data.templates || [])
      } else {
        throw new Error(data.error || 'Failed to load templates')
      }
    } catch (error) {
      console.error('Template loading error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Templates konnten nicht geladen werden',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedCategory, toast])

  useEffect(() => {
    if (showTemplates) {
      loadTemplates()
    }
  }, [showTemplates, loadTemplates])

  const handleTemplateSelect = async (template: SocialMediaTemplate) => {
    console.log('[Template Select] Category:', template.category, 'Title:', template.title)
    
    // Check if this is a concert template - if yes, show concert selector
    if (template.category === 'concert') {
      console.log('[Template Select] Opening concert selector!')
      setPreviewTemplate(null) // Close preview dialog first
      setSelectedTemplate(template)
      setShowConcertSelector(true)
      // DON'T close template list yet - concert selector needs to be visible
      return
    }

    console.log('[Template Select] Using template directly (not concert)')
    
    // For non-concert templates, use directly
    try {
      // Increment usage count
      await fetch('/api/social-templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template._id }),
      })

      onTemplateSelect(template)
      setShowTemplates(false)
      setPreviewTemplate(null) // Close preview
      
      // âœ¨ SHOW IMAGE SUGGESTIONS for certain categories
      if (['news', 'aftershow', 'general'].includes(template.category) && onMediaAdd) {
        console.log('[Template Select] Opening image suggester for category:', template.category)
        // Give a moment for the template to be applied
        setTimeout(() => {
          setShowImageSuggester(template.category as 'news' | 'aftershow' | 'concertreports' | 'posts' | 'all')
        }, 100)
      }
      
      toast.push({
        status: 'success',
        title: 'ðŸ“ Template geladen!',
        description: template.title,
      })
    } catch (error) {
      console.error('Template select error:', error)
      // Continue anyway
      onTemplateSelect(template)
      setShowTemplates(false)
      setPreviewTemplate(null)
    }
  }

  const handleConcertSelect = async (concert: Concert, template: SocialMediaTemplate) => {
    // Map concert data to template placeholders
    const concertData = {
      title: concert.tourName || `${concert.bandName} Live`,
      date: new Date(concert.date).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      location: `${concert.city}, ${concert.country}`,
      venue: concert.venue,
      time: concert.showStart || concert.doorsOpen || 'TBA',
      price: 'See ticket link',
      url: concert.ticketLink || `https://your-site.com/de/bands/${concert.bandSlug}/tour/${concert.tourSlug}`,
      content: concert.description || '',
    }

    // Replace placeholders in template content
    let filledContent = template.content
    Object.entries(concertData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      filledContent = filledContent.replace(regex, value)
    })

    // âœ¨ AUTO-ADD VENUE IMAGE if available
    const venueImageUrl = concert.venueImage?.asset?.url
    if (venueImageUrl) {
      console.log('[Concert Select] Adding venueImage:', venueImageUrl)
      // Add to mediaUrls via callback (passed from parent)
      if (onMediaAdd) {
        onMediaAdd(venueImageUrl)
      }
    }

    // âœ¨ AUTO-ADD TOUR HERO IMAGE if available
    if (concert.tourSlug) {
      try {
        const tourResponse = await fetch(`/api/tours/get?slug=${concert.tourSlug}`)
        if (tourResponse.ok) {
          const tourData = await tourResponse.json()
          const tourHeroUrl = tourData.tour?.heroImage?.asset?.url
          if (tourHeroUrl && tourHeroUrl !== venueImageUrl) { // Avoid duplicates
            console.log('[Concert Select] Adding tour heroImage:', tourHeroUrl)
            if (onMediaAdd) {
              onMediaAdd(tourHeroUrl)
            }
          }
        }
      } catch (error) {
        console.error('[Concert Select] Failed to fetch tour image:', error)
      }
    }

    // Create filled template
    const filledTemplate = {
      ...template,
      content: filledContent,
    }

    // Increment usage count
    try {
      await fetch('/api/social-templates/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template._id }),
      })
    } catch (error) {
      console.error('Template use tracking error:', error)
    }

    onTemplateSelect(filledTemplate)
    setShowConcertSelector(false)
    setShowTemplates(false) // NOW close template list after concert selection
    setSelectedTemplate(null) // Clear selected template
    
    const imageCount = [venueImageUrl].filter(Boolean).length
    toast.push({
      status: 'success',
      title: 'ðŸŽ¸ Template mit Konzert-Daten gefÃ¼llt!',
      description: `${concert.venue}, ${concert.city}${imageCount > 0 ? ` â€¢ ${imageCount} ${imageCount === 1 ? 'Bild' : 'Bilder'} hinzugefÃ¼gt` : ''}`,
    })
  }

  const replacePlaceholders = (text: string, data: Record<string, string>) => {
    let result = text
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      result = result.replace(regex, value || `{${key}}`)
    })
    return result
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="positive">
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={2}>ðŸ“‹</Text>
          <Text weight="semibold" size={1}>
            Content-Templates
          </Text>
          <Badge tone="primary" fontSize={0}>
            Neu
          </Badge>
        </Flex>

        <Text size={1} muted>
          Nutze vordefinierte Templates fÃ¼r schnelleres Posten
        </Text>

        <Button
          icon={RocketIcon}
          mode="default"
          tone="primary"
          text={showTemplates ? 'Templates ausblenden' : 'Templates anzeigen'}
          onClick={() => setShowTemplates(!showTemplates)}
          fontSize={1}
        />

        {showTemplates && (
          <Stack space={3}>
            {/* Category Filter */}
            <Card padding={3} radius={2} tone="transparent" border>
              <Stack space={2}>
                <Text size={0} weight="semibold">
                  Kategorie wÃ¤hlen:
                </Text>
                <Grid columns={[2, 4]} gap={2}>
                  <Button
                    mode={selectedCategory === null ? 'default' : 'ghost'}
                    tone={selectedCategory === null ? 'primary' : 'default'}
                    text="Alle"
                    onClick={() => setSelectedCategory(null)}
                    fontSize={0}
                  />
                  {categories.map((cat) => (
                    <Button
                      key={cat.value}
                      mode={selectedCategory === cat.value ? 'default' : 'ghost'}
                      tone={selectedCategory === cat.value ? 'primary' : 'default'}
                      text={`${cat.icon} ${cat.label}`}
                      onClick={() => setSelectedCategory(cat.value)}
                      fontSize={0}
                    />
                  ))}
                </Grid>
              </Stack>
            </Card>

            {/* Templates List */}
            {isLoading ? (
              <Flex justify="center" padding={4}>
                <Spinner muted />
              </Flex>
            ) : templates.length === 0 ? (
              <Card padding={4} radius={2} tone="caution">
                <Text size={1} align="center">
                  Keine Templates gefunden. Erstelle welche in Sanity Studio!
                </Text>
              </Card>
            ) : (
              <Stack space={2}>
                {templates.map((template) => {
                  const category = categories.find((c) => c.value === template.category)
                  return (
                    <Card
                      key={template._id}
                      padding={3}
                      radius={2}
                      tone="default"
                      style={{ cursor: 'pointer' }}
                    >
                      <Flex justify="space-between" align="flex-start" gap={2}>
                        <Stack space={2} flex={1}>
                          <Flex align="center" gap={2}>
                            <Text size={2}>{category?.icon || 'ðŸ“'}</Text>
                            <Text size={1} weight="semibold">
                              {template.title}
                            </Text>
                            {template.language && (
                              <Badge tone="default" fontSize={0}>
                                {template.language === 'de' ? 'ðŸ‡©ðŸ‡ª' : 'ðŸ‡¬ðŸ‡§'}
                              </Badge>
                            )}
                            {template.usageCount && template.usageCount > 0 && (
                              <Badge tone="positive" fontSize={0}>
                                {template.usageCount}x verwendet
                              </Badge>
                            )}
                          </Flex>

                          {template.description && (
                            <Text size={0} muted>
                              {template.description}
                            </Text>
                          )}

                          {template.platforms && template.platforms.length > 0 && (
                            <Flex gap={1}>
                              {template.platforms.map((platform) => (
                                <Badge key={platform} tone="primary" fontSize={0}>
                                  {platform === 'instagram' && 'ðŸ“¸'}
                                  {platform === 'facebook' && 'ðŸ‘¥'}
                                  {platform === 'threads' && 'ðŸ§µ'}
                                  {platform === 'twitter' && 'ðŸ¦'}
                                </Badge>
                              ))}
                            </Flex>
                          )}

                          <Flex gap={2}>
                            <Button
                              mode="ghost"
                              tone="primary"
                              text="Vorschau"
                              onClick={() => setPreviewTemplate(template)}
                              fontSize={0}
                            />
                            <Button
                              mode="default"
                              tone="positive"
                              text="Verwenden"
                              onClick={() => handleTemplateSelect(template)}
                              fontSize={0}
                            />
                          </Flex>
                        </Stack>
                      </Flex>
                    </Card>
                  )
                })}
              </Stack>
            )}
          </Stack>
        )}

        {/* Preview Dialog */}
        {previewTemplate && (
          <Dialog
            header={`ðŸ“ ${previewTemplate.title}`}
            id="template-preview"
            onClose={() => setPreviewTemplate(null)}
            width={2}
          >
            <Box padding={4}>
              <Stack space={4}>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={2}>
                    <Text size={0} weight="semibold" muted>
                      Template-Text:
                    </Text>
                    <TextArea
                      value={previewTemplate.content}
                      readOnly
                      rows={8}
                      fontSize={1}
                    />
                  </Stack>
                </Card>

                {previewTemplate.exampleData && (
                  <Card padding={3} radius={2} tone="primary">
                    <Stack space={2}>
                      <Text size={0} weight="semibold">
                        Beispiel mit ausgefÃ¼llten Platzhaltern:
                      </Text>
                      <Card padding={2} radius={2} tone="transparent">
                        <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
                          {replacePlaceholders(
                            previewTemplate.content,
                            previewTemplate.exampleData as Record<string, string>
                          )}
                        </Text>
                      </Card>
                    </Stack>
                  </Card>
                )}

                {previewTemplate.hashtags && (
                  <Card padding={3} radius={2} tone="transparent" border>
                    <Stack space={2}>
                      <Text size={0} weight="semibold" muted>
                        Standard-Hashtags:
                      </Text>
                      <Text size={1}>{previewTemplate.hashtags}</Text>
                    </Stack>
                  </Card>
                )}

                <Grid columns={2} gap={2}>
                  <Button
                    mode="ghost"
                    text="SchlieÃŸen"
                    onClick={() => setPreviewTemplate(null)}
                  />
                  <Button
                    mode="default"
                    tone="positive"
                    text="Template verwenden"
                    onClick={() => {
                      handleTemplateSelect(previewTemplate)
                      setPreviewTemplate(null)
                    }}
                  />
                </Grid>
              </Stack>
            </Box>
          </Dialog>
        )}

        {/* Concert Selector Dialog */}
        {showConcertSelector && selectedTemplate && (
          <ConcertSelector
            onConcertSelect={handleConcertSelect}
            onMediaAdd={onMediaAdd}
            template={selectedTemplate}
            language={language}
          />
        )}

        {/* Content Image Suggester Dialog */}
        {showImageSuggester && onMediaAdd && (
          <ContentImageSuggester
            category={showImageSuggester}
            onImageSelect={(url) => {
              onMediaAdd(url)
              setShowImageSuggester(null)
            }}
            language={language}
          />
        )}
      </Stack>
    </Card>
  )
}

// ============================================
// CONCERT SELECTOR COMPONENT
// ============================================

interface ConcertSelectorProps {
  onConcertSelect: (concert: Concert, template: SocialMediaTemplate) => void
  onMediaAdd?: (url: string) => void
  template: SocialMediaTemplate
  language: string
}

function ConcertSelector({ onConcertSelect, template, language }: ConcertSelectorProps) {
  // Note: onMediaAdd is passed through handleConcertSelect in parent component
  const toast = useToast()
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  const [isOpen, setIsOpen] = useState(true)

  const loadConcerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/concerts/list?filter=${filter}&language=${language}&limit=30`)
      const data = await response.json()

      if (response.ok) {
        setConcerts(data.concerts || [])
      } else {
        throw new Error(data.error || 'Failed to load concerts')
      }
    } catch (error) {
      console.error('Concert loading error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Konzerte konnten nicht geladen werden',
      })
    } finally {
      setIsLoading(false)
    }
  }, [filter, language, toast])

  useEffect(() => {
    if (isOpen) {
      loadConcerts()
    }
  }, [isOpen, loadConcerts])

  const handleSelect = (concert: Concert) => {
    onConcertSelect(concert, template)
    setIsOpen(false)
    toast.push({
      status: 'success',
      title: 'ðŸŽ¸ Konzert ausgewÃ¤hlt!',
      description: `${concert.venue}, ${concert.city}`,
    })
  }

  if (!isOpen) return null

  return (
    <Dialog
      header="Konzert auswÃ¤hlen"
      id="concert-selector"
      onClose={() => setIsOpen(false)}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          {/* Filter Tabs */}
          <Card padding={2} radius={2} tone="transparent" border>
            <Flex gap={2}>
              <Button
                mode={filter === 'upcoming' ? 'default' : 'ghost'}
                tone={filter === 'upcoming' ? 'primary' : 'default'}
                text="ðŸŽ« Kommende"
                onClick={() => setFilter('upcoming')}
                fontSize={1}
              />
              <Button
                mode={filter === 'past' ? 'default' : 'ghost'}
                tone={filter === 'past' ? 'primary' : 'default'}
                text="ðŸ“… Vergangene"
                onClick={() => setFilter('past')}
                fontSize={1}
              />
              <Button
                mode={filter === 'all' ? 'default' : 'ghost'}
                tone={filter === 'all' ? 'primary' : 'default'}
                text="ðŸ“‹ Alle"
                onClick={() => setFilter('all')}
                fontSize={1}
              />
            </Flex>
          </Card>

          {/* Concert List */}
          {isLoading ? (
            <Flex justify="center" padding={4}>
              <Spinner />
            </Flex>
          ) : concerts.length === 0 ? (
            <Card padding={4} radius={2} tone="transparent">
              <Text size={1} muted align="center">
                Keine Konzerte gefunden
              </Text>
            </Card>
          ) : (
            <Stack space={2} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {concerts.map((concert) => {
                const isPast = new Date(concert.date) < new Date()
                return (
                  <Card
                    key={concert._id}
                    padding={3}
                    radius={2}
                    tone="transparent"
                    border
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSelect(concert)}
                  >
                    <Flex align="flex-start" gap={3}>
                      {/* Date Badge */}
                      <Card
                        padding={2}
                        radius={2}
                        tone={isPast ? 'default' : 'primary'}
                        style={{ minWidth: '70px', textAlign: 'center' }}
                      >
                        <Stack space={1}>
                          <Text size={2} weight="bold">
                            {new Date(concert.date).toLocaleDateString('de-DE', { day: '2-digit' })}
                          </Text>
                          <Text size={0}>
                            {new Date(concert.date).toLocaleDateString('de-DE', { month: 'short' }).toUpperCase()}
                          </Text>
                          <Text size={0} muted>
                            {new Date(concert.date).getFullYear()}
                          </Text>
                        </Stack>
                      </Card>

                      {/* Concert Info */}
                      <Stack space={2} flex={1}>
                        <Flex align="center" gap={2} wrap="wrap">
                          <Text size={2} weight="semibold">
                            {concert.venue}
                          </Text>
                          {concert.status === 'soldout' && (
                            <Badge tone="critical" fontSize={0}>
                              AUSVERKAUFT
                            </Badge>
                          )}
                          {concert.status === 'cancelled' && (
                            <Badge tone="caution" fontSize={0}>
                              ABGESAGT
                            </Badge>
                          )}
                        </Flex>
                        
                        <Text size={1} muted>
                          ðŸ“ {concert.city}, {concert.country}
                        </Text>

                        {concert.tourName && (
                          <Text size={1} muted>
                            ðŸŽ¸ {concert.tourName}
                          </Text>
                        )}

                        {concert.showStart && (
                          <Text size={0} muted>
                            ðŸ• {concert.showStart} Uhr
                          </Text>
                        )}
                      </Stack>
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          )}

          <Button
            mode="ghost"
            text="Abbrechen"
            onClick={() => setIsOpen(false)}
          />
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// NEWS ARTICLE SELECTOR FOR TWITTER
// ============================================

interface NewsArticle {
  _id: string
  title: string
  slug: string
  language: string
  excerpt?: string
  description?: string
  publishedAt?: string
  _createdAt: string
  mainImage?: {
    asset?: { url: string; metadata?: { lqip?: string } }
    alt?: string
  }
  categoryName?: string
  _translations?: Array<{
    _id: string
    language: string
    slug: string
    title: string
  }>
}

interface NewsArticleSelectorProps {
  onArticleSelect: (article: NewsArticle) => void
  onClose: () => void
}

function NewsArticleSelector({ onArticleSelect, onClose }: NewsArticleSelectorProps) {
  const toast = useToast()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/news/list')
        const data = await response.json()

        if (response.ok) {
          setArticles(data.articles || [])
          console.log('[News Selector] Loaded:', data.count, 'DE articles')
        } else {
          throw new Error(data.error || 'Failed to load articles')
        }
      } catch (error) {
        console.error('[News Selector] Error:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'News-Artikel konnten nicht geladen werden',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadArticles()
    }
  }, [isOpen, toast])

  const handleClose = () => {
    setIsOpen(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog
      header="ðŸ¦ News-Artikel fÃ¼r Twitter wÃ¤hlen"
      id="news-article-selector"
      onClose={handleClose}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1} muted>
            WÃ¤hle einen deutschen News-Artikel. Der Tweet wird automatisch mit Bild, Auszug und Links (DE + EN falls verfÃ¼gbar) gefÃ¼llt.
          </Text>

          {isLoading ? (
            <Flex justify="center" padding={5}>
              <Spinner muted />
            </Flex>
          ) : articles.length === 0 ? (
            <Card padding={4} radius={2} tone="transparent">
              <Text size={1} align="center" muted>
                Keine News-Artikel gefunden
              </Text>
            </Card>
          ) : (
            <Stack space={3}>
              {articles.map((article) => {
                // Article is always DE, check if EN translation exists (with null safety)
                const hasEnglishVersion = article._translations?.some(t => t && t.language === 'en') || false

                return (
                  <Card
                    key={article._id}
                    padding={3}
                    radius={2}
                    shadow={1}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onArticleSelect(article)
                      handleClose()
                    }}
                  >
                    <Flex gap={3} align="flex-start">
                      {/* Article Image - Optional */}
                      {article.mainImage?.asset?.url ? (
                        <Box
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={article.mainImage.asset.url}
                            alt={article.mainImage.alt || article.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </Box>
                      ) : (
                        <Box
                          style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--card-muted-bg-color)',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text size={3} muted>ðŸ“°</Text>
                        </Box>
                      )}

                      {/* Article Info */}
                      <Stack space={2} flex={1}>
                        <Text size={2} weight="semibold">
                          {article.title}
                        </Text>

                        {(article.excerpt || article.description) && (
                          <Text size={1} muted style={{ 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {article.excerpt || article.description}
                          </Text>
                        )}

                        <Flex gap={2} wrap="wrap">
                          <Badge tone="primary" fontSize={0}>
                            ðŸ‡©ðŸ‡ª DE
                          </Badge>
                          {hasEnglishVersion ? (
                            <Badge tone="positive" fontSize={0}>
                              + EN Link verfÃ¼gbar
                            </Badge>
                          ) : (
                            <Badge tone="caution" fontSize={0}>
                              Nur DE
                            </Badge>
                          )}
                          {article.categoryName && (
                            <Badge tone="default" fontSize={0}>
                              {article.categoryName}
                            </Badge>
                          )}
                        </Flex>

                        {article.publishedAt && (
                          <Text size={0} muted>
                            ðŸ“… {new Date(article.publishedAt).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                        )}
                      </Stack>
                    </Flex>
                  </Card>
                )
              })}
            </Stack>
          )}

          <Button
            mode="ghost"
            text="Abbrechen"
            onClick={handleClose}
          />
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// CONTENT IMAGE SUGGESTER COMPONENT
// ============================================

interface ContentImage {
  _id: string
  _type: string
  title: string
  slug: string
  imageUrl: string
  imageAlt?: string
  imageLqip?: string
  publishedAt?: string
  _createdAt: string
  categoryName?: string
}

interface ContentImageSuggesterProps {
  category: 'news' | 'aftershow' | 'concertreports' | 'posts' | 'all'
  onImageSelect: (url: string) => void
  language: string
}

function ContentImageSuggester({ category, onImageSelect, language }: ContentImageSuggesterProps) {
  const toast = useToast()
  const [images, setImages] = useState<ContentImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          category,
          language,
          limit: '12',
        })

        const response = await fetch(`/api/content/suggest-images?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setImages(data.images || [])
          console.log('[Content Images] Loaded:', data.count, 'images')
        } else {
          throw new Error(data.error || 'Failed to load images')
        }
      } catch (error) {
        console.error('[Content Images] Error:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Bilder konnten nicht geladen werden',
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadImages()
    }
  }, [category, language, isOpen, toast])

  if (!isOpen) return null

  return (
    <Dialog
      header="ðŸ–¼ï¸ Bild-Vorschlag aus Sanity"
      id="content-image-suggester"
      onClose={() => setIsOpen(false)}
      width={2}
    >
      <Box padding={4}>
        <Stack space={4}>
          <Text size={1} muted>
            WÃ¤hle ein Bild aus deinen letzten {category === 'all' ? 'BeitrÃ¤gen' : category === 'news' ? 'News-Artikeln' : category === 'aftershow' ? 'Aftershow Stories' : 'Concert Reports'}:
          </Text>

          {isLoading ? (
            <Flex justify="center" padding={5}>
              <Spinner muted />
            </Flex>
          ) : images.length === 0 ? (
            <Card padding={4} radius={2} tone="transparent">
              <Text size={1} align="center" muted>
                Keine Bilder gefunden
              </Text>
            </Card>
          ) : (
            <Grid columns={[2, 3, 3]} gap={3}>
              {images.map((image) => (
                <Card
                  key={image._id}
                  radius={2}
                  shadow={1}
                  style={{ 
                    cursor: 'pointer', 
                    overflow: 'hidden',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                  }}
                  onClick={() => {
                    onImageSelect(image.imageUrl)
                    setIsOpen(false)
                    toast.push({
                      status: 'success',
                      title: 'âœ¨ Bild hinzugefÃ¼gt!',
                      description: image.title,
                    })
                  }}
                >
                  <Box style={{ position: 'relative', paddingBottom: '100%', background: '#f0f0f0' }}>
                    <img
                      src={image.imageUrl}
                      alt={image.imageAlt || image.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                  </Box>
                  <Card padding={2}>
                    <Stack space={2}>
                      <Text size={1} weight="semibold" style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {image.title}
                      </Text>
                      
                      <Flex gap={2} wrap="wrap">
                        {image.categoryName && (
                          <Badge tone="primary" fontSize={0}>
                            {image.categoryName}
                          </Badge>
                        )}
                        <Badge tone="default" fontSize={0}>
                          {image._type === 'post' && 'ðŸ“ Post'}
                          {image._type === 'concertReport' && 'ðŸŽ¸ Concert Report'}
                          {image._type === 'aftershowStory' && 'ðŸ“¸ Aftershow'}
                        </Badge>
                      </Flex>
                      
                      {image.publishedAt && (
                        <Text size={0} muted>
                          {new Date(image.publishedAt).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </Card>
              ))}
            </Grid>
          )}

          <Button
            mode="ghost"
            text="Abbrechen"
            onClick={() => setIsOpen(false)}
          />
        </Stack>
      </Box>
    </Dialog>
  )
}

// ============================================
// AI-ASSISTENT COMPONENT (Combined Platform Optimizer + AI Features)
// ============================================

interface AIAssistentProps {
  content: string
  selectedPlatforms: Platform[]
  platformTexts: Record<Platform, string>
  onPlatformTextUpdate: (platform: Platform, text: string) => void
  onContentUpdate: (content: string) => void
  onHashtagsUpdate: (hashtags: string) => void
}

function AIAssistent({ 
  content, 
  selectedPlatforms, 
  platformTexts, 
  onPlatformTextUpdate,
  onContentUpdate,
  onHashtagsUpdate,
}: AIAssistentProps) {
  const toast = useToast()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizingPlatform, setOptimizingPlatform] = useState<Platform | null>(null)
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false)
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false)
  const [showVariants, setShowVariants] = useState(false)
  const [variants, setVariants] = useState<Array<{ tone: string; content: string; description: string }>>([])

  const platformIcons: Record<Platform, string> = {
    instagram: 'ðŸ“¸',
    facebook: 'ðŸ‘¥',
    twitter: 'ðŸ¦',
    threads: 'ðŸ§µ',
  }

  // ============================================
  // PLATFORM OPTIMIZATION
  // ============================================
  const handleOptimizeForPlatform = async (platform: Platform) => {
    const textToOptimize = platformTexts[platform] || content

    if (!textToOptimize.trim()) {
      toast.push({
        status: 'warning',
        title: 'Kein Text',
        description: 'Bitte gib zuerst einen Text ein',
      })
      return
    }

    setIsOptimizing(true)
    setOptimizingPlatform(platform)

    try {
      const response = await fetch('/api/late/platform-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToOptimize,
          platform,
          includeHashtags: platform === 'instagram',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Optimization failed')
      }

      const data = await response.json()

      if (data.optimized) {
        onPlatformTextUpdate(platform, data.optimized)
        toast.push({
          status: 'success',
          title: `${platformIcons[platform]} ${platform} optimiert!`,
        })
      }
    } catch (error) {
      console.error(`[AI Assistent] ${platform} error:`, error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Optimierung fehlgeschlagen',
      })
    } finally {
      setIsOptimizing(false)
      setOptimizingPlatform(null)
    }
  }

  const handleOptimizeAll = async () => {
    if (!content.trim()) {
      toast.push({
        status: 'warning',
        title: 'Kein Text',
        description: 'Bitte gib zuerst einen Basis-Text ein',
      })
      return
    }

    if (selectedPlatforms.length === 0) {
      toast.push({
        status: 'warning',
        title: 'Keine Plattformen',
        description: 'WÃ¤hle zuerst Plattformen aus',
      })
      return
    }

    setIsOptimizing(true)

    try {
      const promises = selectedPlatforms.map(async (platform) => {
        const response = await fetch('/api/late/platform-optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content,
            platform,
            includeHashtags: platform === 'instagram',
          }),
        })
        const data = await response.json()
        return { platform, optimized: data.optimized }
      })

      const results = await Promise.all(promises)
      
      results.forEach(({ platform, optimized }) => {
        if (optimized) {
          onPlatformTextUpdate(platform, optimized)
        }
      })

      toast.push({
        status: 'success',
        title: 'âœ¨ Alle Plattformen optimiert!',
        description: `${selectedPlatforms.length} Plattformen aktualisiert`,
      })
    } catch (error) {
      console.error('[AI Assistent] Bulk optimization error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Optimierung fehlgeschlagen',
      })
    } finally {
      setIsOptimizing(false)
    }
  }

  // ============================================
  // HASHTAG GENERATION
  // ============================================
  const handleGenerateHashtags = async () => {
    if (!content.trim()) {
      toast.push({
        status: 'warning',
        title: 'Kein Text vorhanden',
        description: 'Bitte gib zuerst einen Text ein',
      })
      return
    }

    setIsGeneratingHashtags(true)
    try {
      const response = await fetch('/api/late/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language: 'de',
          count: 10,
          platform: selectedPlatforms[0] || 'instagram',
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        const hashtagString = data.hashtags.join(' ')
        onHashtagsUpdate(hashtagString)
        toast.push({
          status: 'success',
          title: '# Hashtags generiert!',
          description: `${data.hashtags.length} Hashtags hinzugefÃ¼gt`,
        })
      } else {
        throw new Error(data.error || 'Failed to generate hashtags')
      }
    } catch (error) {
      console.error('Hashtag generation error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Hashtags konnten nicht generiert werden',
      })
    } finally {
      setIsGeneratingHashtags(false)
    }
  }

  // ============================================
  // VARIANT GENERATION
  // ============================================
  const handleGenerateVariants = async () => {
    if (!content.trim()) {
      toast.push({
        status: 'warning',
        title: 'Kein Text',
        description: 'Bitte gib zuerst einen Text ein',
      })
      return
    }

    setIsGeneratingVariants(true)
    try {
      const response = await fetch('/api/late/ai/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language: 'de',
          count: 3,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setVariants(data.variants)
        setShowVariants(true)
        toast.push({
          status: 'success',
          title: 'ðŸ“ Varianten generiert!',
          description: `${data.variants.length} Alternativen erstellt`,
        })
      } else {
        throw new Error(data.error || 'Variant generation failed')
      }
    } catch (error) {
      console.error('Variant generation error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Varianten konnten nicht erstellt werden',
      })
    } finally {
      setIsGeneratingVariants(false)
    }
  }

  // Don't show if no content
  if (!content.trim()) {
    return null
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="primary">
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" gap={2}>
          <Text size={2}>âœ¨</Text>
          <Text weight="semibold" size={1}>
            AI-Assistent
          </Text>
          <Badge tone="positive" fontSize={0}>
            Beta
          </Badge>
        </Flex>

        {/* Main Actions Row */}
        <Grid columns={[1, 3]} gap={2}>
          {/* Optimize All Platforms */}
          <Button
            icon={RocketIcon}
            mode="default"
            tone="primary"
            text={isOptimizing && !optimizingPlatform ? 'Optimiere...' : 'Alle optimieren'}
            onClick={handleOptimizeAll}
            disabled={isOptimizing || selectedPlatforms.length === 0}
            loading={isOptimizing && !optimizingPlatform}
            fontSize={1}
            title="Optimiere Text fÃ¼r alle ausgewÃ¤hlten Plattformen"
          />

          {/* Generate Hashtags */}
          <Button
            mode="ghost"
            tone="primary"
            text={isGeneratingHashtags ? 'Generiere...' : '# Hashtags'}
            onClick={handleGenerateHashtags}
            disabled={isGeneratingHashtags}
            loading={isGeneratingHashtags}
            fontSize={1}
            title="Generiere passende Hashtags fÃ¼r deinen Text"
          />

          {/* Generate Variants */}
          <Button
            mode="ghost"
            tone="primary"
            text={isGeneratingVariants ? 'Generiere...' : 'ðŸ“ Varianten'}
            onClick={handleGenerateVariants}
            disabled={isGeneratingVariants}
            loading={isGeneratingVariants}
            fontSize={1}
            title="Erstelle alternative Textversionen"
          />
        </Grid>

        {/* Single Platform Optimization */}
        {selectedPlatforms.length > 0 && (
          <Flex gap={2} wrap="wrap" align="center">
            <Text size={0} muted>
              Einzeln optimieren:
            </Text>
            {selectedPlatforms.map((platform) => (
              <Button
                key={platform}
                mode={optimizingPlatform === platform ? 'default' : 'ghost'}
                tone={optimizingPlatform === platform ? 'primary' : 'default'}
                text={platformIcons[platform]}
                onClick={() => handleOptimizeForPlatform(platform)}
                disabled={isOptimizing}
                loading={optimizingPlatform === platform}
                fontSize={1}
                title={`Nur fÃ¼r ${platform} optimieren`}
              />
            ))}
          </Flex>
        )}

        {/* Variants Dialog */}
        {showVariants && variants.length > 0 && (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Text size={1} weight="semibold">
                  ðŸ“ Text-Varianten
                </Text>
                <Button
                  mode="ghost"
                  text="SchlieÃŸen"
                  onClick={() => setShowVariants(false)}
                  fontSize={0}
                />
              </Flex>

              <Stack space={2}>
                {variants.map((variant, idx) => (
                  <Card
                    key={idx}
                    padding={3}
                    radius={2}
                    tone="default"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      onContentUpdate(variant.content)
                      setShowVariants(false)
                      toast.push({
                        status: 'success',
                        title: 'Variante Ã¼bernommen',
                        description: variant.tone,
                      })
                    }}
                  >
                    <Stack space={2}>
                      <Flex align="center" gap={2}>
                        <Badge tone="primary" fontSize={0}>
                          {variant.tone}
                        </Badge>
                        <Text size={0} muted>
                          {variant.description}
                        </Text>
                      </Flex>
                      <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
                        {variant.content}
                      </Text>
                      <Text size={0} muted>
                        {variant.content.length} Zeichen
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

// ============================================
// THREAD BUILDER COMPONENT
// ============================================

interface ThreadBuilderCardProps {
  content: string
  onThreadUpdate: (tweets: Array<{ content: string; index: number; length: number }>) => void
}

function ThreadBuilderCard({ content, onThreadUpdate }: ThreadBuilderCardProps) {
  const toast = useToast()
  const [tweets, setTweets] = useState<Array<{ content: string; index: number; length: number }>>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleSplitThread = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/late/ai/split-thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          maxLength: 280,
          platform: 'twitter',
          addNumbers: true,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setTweets(data.tweets)
        setShowPreview(true)
        onThreadUpdate(data.tweets)
        toast.push({
          status: 'success',
          title: 'ðŸ§µ Thread erstellt!',
          description: `${data.count} Tweets generiert`,
        })
      } else {
        throw new Error(data.error || 'Thread split failed')
      }
    } catch (error) {
      console.error('Thread split error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Thread konnte nicht erstellt werden',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="caution">
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={2}>ðŸ§µ</Text>
          <Text weight="semibold" size={1}>
            Twitter Thread Builder
          </Text>
          <Badge tone="caution" fontSize={0}>
            Text zu lang fÃ¼r Twitter ({content.length} Zeichen)
          </Badge>
        </Flex>

        <Text size={1} muted>
          Dein Text Ã¼berschreitet das Twitter-Limit von 280 Zeichen. MÃ¶chtest du ihn in einen Thread aufteilen?
        </Text>

        <Button
          icon={RocketIcon}
          mode="default"
          tone="primary"
          text="Thread automatisch erstellen"
          onClick={handleSplitThread}
          disabled={isGenerating}
          loading={isGenerating}
          fontSize={1}
        />

        {showPreview && tweets.length > 0 && (
          <Card padding={3} radius={2} tone="transparent" border>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Text size={1} weight="semibold">
                  ðŸ§µ Thread-Vorschau ({tweets.length} Tweets)
                </Text>
                <Button
                  mode="ghost"
                  text="SchlieÃŸen"
                  onClick={() => setShowPreview(false)}
                  fontSize={0}
                />
              </Flex>

              <Stack space={2}>
                {tweets.map((tweet, idx) => (
                  <Card
                    key={idx}
                    padding={3}
                    radius={2}
                    tone="default"
                  >
                    <Stack space={2}>
                      <Flex align="center" justify="space-between">
                        <Badge tone="primary" fontSize={0}>
                          Tweet {idx + 1}/{tweets.length}
                        </Badge>
                        <Badge tone={tweet.length > 280 ? 'critical' : 'positive'} fontSize={0}>
                          {tweet.length}/280
                        </Badge>
                      </Flex>
                      <Text size={1} style={{ whiteSpace: 'pre-wrap' }}>
                        {tweet.content}
                      </Text>
                    </Stack>
                  </Card>
                ))}
              </Stack>

              <Card padding={2} tone="transparent">
                <Text size={0} muted>
                  ðŸ’¡ Der Thread wird automatisch mit Nummerierung gepostet
                </Text>
              </Card>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

// ============================================
// CAROUSEL BUILDER COMPONENT
// ============================================

interface CarouselBuilderCardProps {
  mediaUrls: string[]
  onReorder: (reordered: string[]) => void
}

function CarouselBuilderCard({ mediaUrls, onReorder }: CarouselBuilderCardProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newUrls = [...mediaUrls]
    const draggedItem = newUrls[draggedIndex]
    newUrls.splice(draggedIndex, 1)
    newUrls.splice(index, 0, draggedItem)
    
    onReorder(newUrls)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <Card padding={4} radius={2} shadow={1} tone="primary">
      <Stack space={3}>
        <Flex align="center" gap={2}>
          <Text size={2}>ðŸŽ </Text>
          <Text weight="semibold" size={1}>
            Carousel Builder
          </Text>
          <Badge tone="positive" fontSize={0}>
            {mediaUrls.length} Medien
          </Badge>
        </Flex>

        <Text size={1} muted>
          Ziehe die Bilder, um die Reihenfolge zu Ã¤ndern
        </Text>

        <Grid columns={[3, 5]} gap={2}>
          {mediaUrls.map((url, idx) => (
            <Box
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '4px',
                overflow: 'hidden',
                cursor: 'grab',
                border: draggedIndex === idx ? '2px solid var(--card-focus-ring-color)' : 'none',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Media ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '4px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {idx + 1}
              </Box>
            </Box>
          ))}
        </Grid>

        <Card padding={2} tone="transparent">
          <Text size={0} muted>
            ðŸ’¡ Instagram Carousels: 2-10 Bilder/Videos, Reihenfolge wichtig!
          </Text>
        </Card>
      </Stack>
    </Card>
  )
}

// ============================================
// PLATFORM PREVIEW COMPONENT
// ============================================

function PlatformPreview({
  platform,
  content,
  username,
  mediaUrl,
  mediaUrls,
  instagramPostType,
  instagramFormat,
}: {
  platform: Platform
  content: string
  username: string
  mediaUrl?: string
  mediaUrls?: string[]
  instagramPostType?: InstagramPostType
  instagramFormat?: InstagramFormat
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const platformConfig = {
    instagram: {
      icon: 'ðŸ“¸',
      color: '#E4405F',
      name: 'Instagram',
      maxChars: 2200,
    },
    facebook: {
      icon: 'ðŸ‘¥',
      color: '#1877F2',
      name: 'Facebook',
      maxChars: 63206,
    },
    threads: {
      icon: 'ðŸ§µ',
      color: '#000000',
      name: 'Threads',
      maxChars: 500,
    },
    twitter: {
      icon: 'ðŸ¦',
      color: '#1DA1F2',
      name: 'X (Twitter)',
      maxChars: 280,
    },
  }

  const config = platformConfig[platform]
  const charCount = content.length
  const isOverLimit = charCount > config.maxChars

  // Bestimme Aspect Ratio basierend auf Plattform, Post-Typ und Format
  let aspectRatio = '16/9' // Standard fÃ¼r Facebook/Twitter
  
  if (platform === 'instagram') {
    // Story und Reel: 9:16 (vertikal)
    if (instagramPostType === 'story' || instagramPostType === 'reel') {
      aspectRatio = '9/16'
    } 
    // Feed und Carousel: Verwende das ausgewÃ¤hlte Format
    else if (instagramPostType === 'feed' || instagramPostType === 'carousel') {
      switch (instagramFormat) {
        case 'square':
          aspectRatio = '1/1'
          break
        case 'portrait':
          aspectRatio = '4/5'
          break
        case 'landscape':
          aspectRatio = '1.91/1'
          break
        default:
          aspectRatio = '4/5' // Default to portrait
      }
    } else {
      aspectRatio = '4/5' // Fallback
    }
  } else if (platform === 'threads') {
    aspectRatio = '4/5'
  }

  // FÃ¼r Carousel: Nutze mediaUrls Array, ansonsten einzelnes mediaUrl
  const isCarousel = instagramPostType === 'carousel' && mediaUrls && mediaUrls.length > 1
  const displayMedia = isCarousel ? mediaUrls : (mediaUrl ? [mediaUrl] : [])
  const currentMedia = displayMedia[currentImageIndex] || mediaUrl

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? displayMedia.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === displayMedia.length - 1 ? 0 : prev + 1))
  }

  return (
    <Card
      padding={3}
      radius={2}
      shadow={1}
      style={{
        border: `2px solid ${config.color}`,
        background: 'var(--card-bg-color)',
      }}
    >
      <Stack space={3}>
        {/* Header */}
        <Flex align="center" gap={2}>
          <Text size={2}>{config.icon}</Text>
          <Stack space={1} flex={1}>
            <Text size={1} weight="semibold">
              {config.name}
            </Text>
            <Text size={0} muted>
              @{username}
            </Text>
          </Stack>
          <Badge tone={isOverLimit ? 'critical' : 'positive'} fontSize={0}>
            {charCount}/{config.maxChars}
          </Badge>
        </Flex>

        {/* Media Preview */}
        {currentMedia && (
          <Box
            style={{
              width: '100%',
              aspectRatio,
              background: 'var(--card-bg2-color)',
              borderRadius: '8px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMedia}
              alt="Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            
            {/* Carousel Navigation */}
            {isCarousel && displayMedia.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    zIndex: 10,
                  }}
                  type="button"
                >
                  â€¹
                </button>
                
                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    zIndex: 10,
                  }}
                  type="button"
                >
                  â€º
                </button>
                
                {/* Dots Indicator */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  {displayMedia.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: idx === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s',
                      }}
                      type="button"
                      aria-label={`Bild ${idx + 1}`}
                    />
                  ))}
                </Box>
                
                {/* Counter Badge */}
                <Box
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 10,
                  }}
                >
                  {currentImageIndex + 1}/{displayMedia.length}
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Content Preview */}
        <Card padding={2} radius={2} tone="transparent">
          <Text size={1} style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%'
          }}>
            {content || 'Dein Post-Text erscheint hier...'}
          </Text>
        </Card>

        {/* Platform-specific info */}
        <Flex gap={2}>
          {platform === 'instagram' && mediaUrl && (
            <Badge tone="primary" fontSize={0}>
              {instagramPostType === 'story' && 'ðŸ“– Story'}
              {instagramPostType === 'reel' && 'ðŸŽ¬ Reel'}
              {instagramPostType === 'carousel' && 'ðŸŽ  Carousel'}
              {instagramPostType === 'feed' && 'ðŸ“° Feed'}
              {!instagramPostType && 'Feed Post'}
            </Badge>
          )}
          {platform === 'threads' && (
            <Badge tone="default" fontSize={0}>
              Max 10 Bilder
            </Badge>
          )}
          {platform === 'twitter' && (
            <Badge tone="default" fontSize={0}>
              Max 4 Bilder
            </Badge>
          )}
        </Flex>
      </Stack>
    </Card>
  )
}

// ============================================
// POST CALENDAR TAB
// ============================================

interface CalendarPost {
  _id: string
  content: string
  platforms: Array<{ platform: string; accountId: string | Record<string, unknown>; username?: string; status?: string; platformPostUrl?: string }>
  mediaItems?: Array<{ url: string; type: string }>
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'partial'
  scheduledFor?: string
  publishedAt?: string
  createdAt: string
}

type CalendarStatusFilter = 'all' | 'published' | 'scheduled' | 'failed'

function PostCalendarTab() {
  const toast = useToast()
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null)
  const [statusFilter, setStatusFilter] = useState<CalendarStatusFilter>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load posts for the current month view with pagination
  const loadPostsForMonth = useCallback(async (date: Date, showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const year = date.getFullYear()
      const month = date.getMonth()
      // Extend range by a few days to capture edge cases with timezones
      const dateFrom = new Date(year, month, 1)
      dateFrom.setDate(dateFrom.getDate() - 1)
      const dateTo = new Date(year, month + 1, 0)
      dateTo.setDate(dateTo.getDate() + 2)

      const fromStr = dateFrom.toISOString().split('T')[0]
      const toStr = dateTo.toISOString().split('T')[0]

      let allPosts: CalendarPost[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const url = `/api/late/posts?limit=50&page=${page}&dateFrom=${fromStr}&dateTo=${toStr}`
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
        const data = await response.json()
        const pagePosts = data.posts || []
        allPosts = [...allPosts, ...pagePosts]

        // Check pagination - stop if we got less than limit or no pagination info
        const pagination = data.pagination
        if (!pagination || page >= (pagination.pages || 1) || pagePosts.length < 50) {
          hasMore = false
        } else {
          page++
        }
      }

      console.log(`[Calendar] Loaded ${allPosts.length} posts for ${year}-${month + 1}`)
      setPosts(allPosts)
    } catch (error) {
      console.error('[Calendar] Error loading posts:', error)
      toast.push({
        status: 'error',
        title: 'Fehler beim Laden der Posts',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [toast])

  // Load when month changes
  useEffect(() => {
    loadPostsForMonth(currentDate)
  }, [currentDate, loadPostsForMonth])

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Start week on Monday (ISO standard)
    let startingDayOfWeek = firstDay.getDay() - 1
    if (startingDayOfWeek < 0) startingDayOfWeek = 6

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  // Filter posts by status
  const filteredPosts = statusFilter === 'all'
    ? posts
    : posts.filter(p => p.status === statusFilter)

  const getPostsForDay = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dayStart = new Date(year, month, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999)

    return filteredPosts.filter(post => {
      const postDateStr = post.publishedAt || post.scheduledFor || post.createdAt
      if (!postDateStr) return false
      const postDate = new Date(postDateStr)
      return postDate >= dayStart && postDate <= dayEnd
    })
  }

  const getPlatformIcon = (platform: string) => {
    const p = platform?.toLowerCase() || ''
    if (p === 'instagram') return 'ðŸ“¸'
    if (p === 'facebook') return 'ðŸ‘¥'
    if (p === 'threads') return 'ðŸ§µ'
    if (p === 'twitter' || p === 'x') return 'ð•'
    if (p === 'linkedin') return 'ðŸ’¼'
    if (p === 'tiktok') return 'ðŸŽµ'
    if (p === 'youtube') return 'â–¶ï¸'
    if (p === 'bluesky') return 'ðŸ¦‹'
    return 'ðŸ“±'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return { tone: 'positive' as const, label: 'âœ“ VerÃ¶ffentlicht' }
      case 'scheduled': return { tone: 'caution' as const, label: 'â° Geplant' }
      case 'failed': return { tone: 'critical' as const, label: 'âœ— Fehlgeschlagen' }
      case 'partial': return { tone: 'caution' as const, label: 'âš  Teilweise' }
      case 'draft': return { tone: 'default' as const, label: 'ðŸ“ Entwurf' }
      default: return { tone: 'default' as const, label: status }
    }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  // Stats
  const publishedCount = posts.filter(p => p.status === 'published').length
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length
  const failedCount = posts.filter(p => p.status === 'failed').length
  const totalCount = posts.length

  if (isLoading) {
    return (
      <Container width={3} padding={4}>
        <Flex padding={4} justify="center" align="center" direction="column" style={{ minHeight: '400px' }}>
          <Spinner muted size={3} />
          <Text muted size={1} style={{ marginTop: '16px' }}>
            Lade Posts fÃ¼r {monthName}...
          </Text>
        </Flex>
      </Container>
    )
  }

  return (
    <Container width={3} padding={4}>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={2}>
            <Flex align="center" gap={3}>
              <CalendarIcon style={{ fontSize: 28 }} />
              <Heading as="h1" size={2}>
                Post Kalender
              </Heading>
              {isRefreshing && <Spinner muted />}
            </Flex>
            <Text muted size={1}>
              Ãœbersicht aller verÃ¶ffentlichten und geplanten Posts
            </Text>
          </Stack>
          <Flex gap={2} align="center" wrap="wrap">
            {publishedCount > 0 && (
              <Badge tone="positive" fontSize={1}>
                {publishedCount} verÃ¶ffentlicht
              </Badge>
            )}
            {scheduledCount > 0 && (
              <Badge tone="caution" fontSize={1}>
                {scheduledCount} geplant
              </Badge>
            )}
            {failedCount > 0 && (
              <Badge tone="critical" fontSize={1}>
                {failedCount} fehlgeschlagen
              </Badge>
            )}
            <Button
              icon={DownloadIcon}
              mode="ghost"
              tone="default"
              title="Aktualisieren"
              onClick={() => loadPostsForMonth(currentDate, true)}
              disabled={isRefreshing}
            />
          </Flex>
        </Flex>

        {/* Status Filter */}
        <Card padding={2} radius={2} tone="transparent">
          <Flex gap={2} wrap="wrap">
            {([
              { key: 'all' as const, label: 'Alle', count: totalCount },
              { key: 'published' as const, label: 'VerÃ¶ffentlicht', count: publishedCount },
              { key: 'scheduled' as const, label: 'Geplant', count: scheduledCount },
              { key: 'failed' as const, label: 'Fehlgeschlagen', count: failedCount },
            ] as const).filter(f => f.key === 'all' || f.count > 0).map(f => (
              <Button
                key={f.key}
                text={`${f.label} (${f.count})`}
                mode={statusFilter === f.key ? 'default' : 'ghost'}
                tone={
                  f.key === 'published' ? 'positive' :
                  f.key === 'scheduled' ? 'caution' :
                  f.key === 'failed' ? 'critical' :
                  'default'
                }
                onClick={() => setStatusFilter(f.key)}
                fontSize={1}
              />
            ))}
          </Flex>
        </Card>

        {/* Post Calendar with Side Panel Layout */}
        <Grid columns={selectedPost ? [1, 1] : [1]} gap={4} style={{
          transition: 'all 0.3s ease',
          gridTemplateColumns: selectedPost ? '1fr 450px' : '1fr'
        }}>
          {/* Calendar */}
          <Card>
            <Stack space={4}>
              {/* Calendar Header */}
              <Flex align="center" justify="space-between">
                <Flex align="center" gap={3}>
                  <Button
                    icon={ChevronLeftIcon}
                    mode="ghost"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() - 1)
                      setCurrentDate(newDate)
                      setSelectedPost(null)
                    }}
                  />
                  <Text size={2} weight="semibold">
                    {monthName}
                  </Text>
                  <Button
                    icon={ChevronRightIcon}
                    mode="ghost"
                    onClick={() => {
                      const newDate = new Date(currentDate)
                      newDate.setMonth(newDate.getMonth() + 1)
                      setCurrentDate(newDate)
                      setSelectedPost(null)
                    }}
                  />
                </Flex>
                <Button
                  text="Heute"
                  mode="ghost"
                  onClick={() => {
                    setCurrentDate(new Date())
                    setSelectedPost(null)
                  }}
                />
              </Flex>

              {/* Weekday Headers - Monday first (ISO) */}
              <Grid columns={7} gap={1}>
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <Card key={day} padding={2} tone="transparent">
                    <Text size={0} weight="semibold" align="center">
                      {day}
                    </Text>
                  </Card>
                ))}
              </Grid>

              {/* Calendar Days */}
              <Grid columns={7} gap={1}>
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <Card key={`empty-${i}`} padding={2} tone="transparent" style={{ minHeight: '100px' }} />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayPosts = getPostsForDay(day)
                  const isToday = new Date().getDate() === day &&
                                 new Date().getMonth() === month &&
                                 new Date().getFullYear() === year

                  return (
                    <Card
                      key={day}
                      padding={2}
                      radius={2}
                      tone={isToday ? 'primary' : 'default'}
                      shadow={isToday ? 2 : 1}
                      style={{ minHeight: '140px', position: 'relative', cursor: dayPosts.length > 0 ? 'pointer' : 'default' }}
                    >
                      <Stack space={2}>
                        <Flex align="center" justify="space-between">
                          <Text size={1} weight={isToday ? 'semibold' : 'regular'}>
                            {day}
                          </Text>
                          {dayPosts.length > 0 && (
                            <Badge
                              tone={dayPosts.some(p => p.status === 'failed') ? 'critical' : dayPosts.some(p => p.status === 'scheduled') ? 'caution' : 'positive'}
                              fontSize={0}
                            >
                              {dayPosts.length}
                            </Badge>
                          )}
                        </Flex>

                        {dayPosts.length > 0 && (
                          <Stack space={1}>
                            {/* Show first post as preview card */}
                            {dayPosts.slice(0, 1).map(post => {
                              const preview = post.content?.length > 40
                                ? post.content.substring(0, 40) + '...'
                                : post.content || '(kein Text)'

                              const primaryPlatform = post.platforms?.[0]?.platform?.toLowerCase() || 'unknown'
                              const platformIcon = getPlatformIcon(primaryPlatform)
                              const postTime = post.publishedAt || post.scheduledFor
                              const statusInfo = getStatusBadge(post.status)

                              return (
                                <Card
                                  key={post._id}
                                  padding={2}
                                  radius={2}
                                  tone={statusInfo.tone}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setSelectedPost(post)}
                                >
                                  <Stack space={2}>
                                    <Flex align="center" justify="space-between">
                                      <Flex align="center" gap={1}>
                                        <Text size={0}>{platformIcon}</Text>
                                        {postTime && (
                                          <Badge tone={statusInfo.tone} fontSize={0}>
                                            {new Date(postTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                                          </Badge>
                                        )}
                                      </Flex>
                                      {post.mediaItems && post.mediaItems.length > 0 && (
                                        <Text size={0}>ðŸ“·</Text>
                                      )}
                                    </Flex>
                                    <Text
                                      size={0}
                                      style={{
                                        lineHeight: '1.3',
                                        wordBreak: 'break-word',
                                      }}
                                    >
                                      {preview}
                                    </Text>
                                  </Stack>
                                </Card>
                              )
                            })}

                            {/* Show stacked dots for additional posts */}
                            {dayPosts.length > 1 && (
                              <Flex gap={1} wrap="wrap" style={{ paddingLeft: '4px' }}>
                                {dayPosts.slice(1, 4).map((post) => {
                                  const primaryPlatform = post.platforms?.[0]?.platform?.toLowerCase() || 'unknown'
                                  const platformIcon = getPlatformIcon(primaryPlatform)
                                  const statusInfo = getStatusBadge(post.status)

                                  return (
                                    <Box
                                      key={post._id}
                                      as="button"
                                      onClick={() => setSelectedPost(post)}
                                      style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: statusInfo.tone === 'positive'
                                          ? 'var(--card-positive-fg-color)'
                                          : statusInfo.tone === 'critical'
                                          ? 'var(--card-critical-fg-color)'
                                          : 'var(--card-caution-fg-color)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        transition: 'transform 0.2s',
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                      {platformIcon}
                                    </Box>
                                  )
                                })}
                                {dayPosts.length > 4 && (
                                  <Box
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      background: 'var(--card-border-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                    }}
                                  >
                                    +{dayPosts.length - 4}
                                  </Box>
                                )}
                              </Flex>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Card>
                  )
                })}
              </Grid>
            </Stack>
          </Card>

          {/* Side Panel for Post Details */}
          {selectedPost && (
            <Card
              padding={4}
              shadow={2}
              style={{
                position: 'sticky',
                top: '20px',
                maxHeight: 'calc(100vh - 40px)',
                overflow: 'auto',
                animation: 'slideIn 0.3s ease'
              }}
            >
              <Stack space={4}>
                {/* Header with Close Button */}
                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={2}>
                    <Badge tone={getStatusBadge(selectedPost.status).tone}>
                      {getStatusBadge(selectedPost.status).label}
                    </Badge>
                    <Text size={1} muted>
                      {(selectedPost.publishedAt || selectedPost.scheduledFor) &&
                        new Date(selectedPost.publishedAt || selectedPost.scheduledFor!).toLocaleString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                    </Text>
                  </Flex>
                  <Button
                    icon={CloseIcon}
                    mode="ghost"
                    tone="default"
                    onClick={() => setSelectedPost(null)}
                    title="SchlieÃŸen"
                  />
                </Flex>

                {/* Platform Badges with status and links */}
                <Stack space={2}>
                  <Text size={0} weight="semibold" muted>Plattformen:</Text>
                  <Flex gap={2} wrap="wrap">
                    {selectedPost.platforms?.map((platform, idx) => (
                      <Flex key={idx} align="center" gap={1}>
                        <Text size={1}>{getPlatformIcon(platform.platform)}</Text>
                        <Badge tone={
                          platform.status === 'success' || platform.status === 'published' ? 'positive' :
                          platform.status === 'failed' ? 'critical' :
                          platform.status === 'pending' ? 'caution' :
                          'primary'
                        }>
                          {platform.platform}
                          {platform.username ? ` @${platform.username}` : ''}
                        </Badge>
                        {platform.platformPostUrl && (
                          <a
                            href={platform.platformPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '12px', textDecoration: 'none' }}
                            title="Post auf Plattform Ã¶ffnen"
                          >
                            ðŸ”—
                          </a>
                        )}
                      </Flex>
                    ))}
                  </Flex>
                </Stack>

                {/* Media Preview */}
                {selectedPost.mediaItems && selectedPost.mediaItems.length > 0 && (
                  <Card padding={3} radius={2} tone="transparent" border>
                    <Stack space={2}>
                      <Text size={1} weight="semibold">Medien ({selectedPost.mediaItems.length}):</Text>
                      <Grid columns={selectedPost.mediaItems.length > 1 ? 2 : 1} gap={2}>
                        {selectedPost.mediaItems.map((media, idx) => (
                          <Box key={idx} style={{ borderRadius: '4px', overflow: 'hidden' }}>
                            {media.type === 'video' ? (
                              <Flex align="center" justify="center" style={{
                                width: '100%', height: '120px',
                                background: 'var(--card-border-color)',
                                borderRadius: '4px'
                              }}>
                                <Text size={3}>ðŸŽ¬</Text>
                              </Flex>
                            ) : (
                              <img
                                src={media.url}
                                alt={`Media ${idx + 1}`}
                                style={{
                                  width: '100%',
                                  height: 'auto',
                                  display: 'block',
                                  maxHeight: '200px',
                                  objectFit: 'cover'
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </Grid>
                    </Stack>
                  </Card>
                )}

                {/* Stats Grid */}
                <Grid columns={3} gap={2}>
                  <Card padding={3} radius={2} tone="default">
                    <Stack space={2}>
                      <Text size={0} muted>Zeichen</Text>
                      <Text size={2} weight="semibold">{selectedPost.content?.length || 0}</Text>
                    </Stack>
                  </Card>
                  <Card padding={3} radius={2} tone="default">
                    <Stack space={2}>
                      <Text size={0} muted>Medien</Text>
                      <Text size={2} weight="semibold">{selectedPost.mediaItems?.length || 0}</Text>
                    </Stack>
                  </Card>
                  <Card padding={3} radius={2} tone="default">
                    <Stack space={2}>
                      <Text size={0} muted>Plattformen</Text>
                      <Text size={2} weight="semibold">{selectedPost.platforms?.length || 0}</Text>
                    </Stack>
                  </Card>
                </Grid>

                {/* Full Content */}
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">VollstÃ¤ndiger Text:</Text>
                    <Text size={1} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {selectedPost.content || '(kein Text)'}
                    </Text>
                  </Stack>
                </Card>

                {/* Created At info */}
                {selectedPost.createdAt && (
                  <Text size={0} muted>
                    Erstellt: {new Date(selectedPost.createdAt).toLocaleString('de-DE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </Text>
                )}
              </Stack>
            </Card>
          )}
        </Grid>

        {/* Legend */}
        <Card padding={3} radius={2} tone="transparent">
          <Flex gap={3} align="center" wrap="wrap">
            <Text size={0} weight="semibold">Legende:</Text>
            <Badge tone="positive">âœ“ VerÃ¶ffentlicht</Badge>
            <Badge tone="caution">â° Geplant</Badge>
            <Badge tone="critical">âœ— Fehlgeschlagen</Badge>
            <Badge tone="primary">Heute</Badge>
          </Flex>
        </Card>

        {/* Empty state for filtered view */}
        {filteredPosts.length === 0 && posts.length > 0 && (
          <Card padding={4} radius={2} tone="transparent">
            <Flex justify="center">
              <Text muted size={1}>
                Keine {statusFilter === 'published' ? 'verÃ¶ffentlichten' : statusFilter === 'scheduled' ? 'geplanten' : 'fehlgeschlagenen'} Posts in diesem Monat.
              </Text>
            </Flex>
          </Card>
        )}

        {/* Empty state for no posts at all */}
        {posts.length === 0 && !isLoading && (
          <Card padding={5} radius={3} shadow={1} tone="transparent">
            <Flex direction="column" align="center" justify="center" style={{ minHeight: '200px' }}>
              <Stack space={4} style={{ maxWidth: '400px', textAlign: 'center' }}>
                <Text size={5}>ðŸ“…</Text>
                <Heading as="h2" size={2}>
                  Keine Posts in {monthName}
                </Heading>
                <Text size={1} muted>
                  FÃ¼r diesen Monat sind keine Posts vorhanden. Erstelle einen neuen Post im &quot;Social Media Posting&quot; Tab!
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}
      </Stack>
    </Container>
  )
}

// ============================================
// SOCIAL MEDIA POSTING TAB
// ============================================

function SocialMediaPostingTab({ initialMediaUrl, onOpenSettings }: { initialMediaUrl?: string | null; onOpenSettings?: () => void }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()

  const [apiSettings, setApiSettings] = useState<{
    apiKey: string | null
    profileId: string | null
    accounts: SocialMediaAccount[]
  }>({
    apiKey: null,
    profileId: null,
    accounts: [],
  })

  const [postState, setPostState] = useState<PostState>({
    content: '',
    hashtags: '',
    photographer: '',
    selectedPlatforms: [],
    platformTexts: {
      instagram: '',
      facebook: '',
      twitter: '',
      threads: '',
    },
    platformFirstComments: {
      instagram: '',
      facebook: '',
      twitter: '',
      threads: '',
    },
    instagramPostType: 'feed',
    instagramFormat: 'portrait', // Default to portrait (4:5)
    scheduledFor: null,
    publishNow: true,
    selectedContent: null,
    mediaUrls: [],
    isUploading: false,
    isPosting: false,
  })

  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [showNewsSelector, setShowNewsSelector] = useState(false)
  const [sanityImages, setSanityImages] = useState<Array<{ _id: string; url: string; alt?: string; title?: string; language?: string }>>([])
  const [showDraftDialog, setShowDraftDialog] = useState(false)
  const [showDraftList, setShowDraftList] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [saveDraftAsTemplate, setSaveDraftAsTemplate] = useState(false)
  const [drafts, setDrafts] = useState<any[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement>(null)

  // Handle initial media URL from Graphics Studio
  useEffect(() => {
    if (initialMediaUrl) {
      setPostState((prev) => ({
        ...prev,
        mediaUrls: [initialMediaUrl],
      }))
    }
  }, [initialMediaUrl])

  // Load API Settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await client.fetch<{
          apiKey: string
          profileId: string
          connectedAccounts: SocialMediaAccount[]
          defaultTimezone?: string
        } | null>(
          `*[_type == "lateApiSettings"][0] {
            apiKey,
            profileId,
            connectedAccounts,
            defaultTimezone
          }`
        )

        if (settings) {
          setApiSettings({
            apiKey: settings.apiKey,
            profileId: settings.profileId,
            accounts: settings.connectedAccounts || [],
          })
        }
      } catch (error) {
        console.error('Error loading API settings:', error)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'API Einstellungen konnten nicht geladen werden',
        })
      } finally {
        setIsLoadingSettings(false)
      }
    }

    loadSettings()
  }, [client, toast])

  // Load Sanity images
  useEffect(() => {
    const loadImages = async () => {
      try {
        // âœ¨ LOAD ALL IMAGES - no language filter, no limit, include drafts
        const query = `*[_type in ["post", "concertReport", "aftershowStory"] && defined(mainImage.asset)] | order(_createdAt desc) {
          _id,
          title,
          "url": mainImage.asset->url,
          "alt": mainImage.alt,
          language,
          _createdAt
        }`
        
        const images = await client.fetch<Array<{ _id: string; url: string; alt?: string; title?: string; language?: string }>>(query)
        console.log('[SM Studio] Loaded Sanity images:', images.length, 'raw results')
        
        // âœ¨ DEDUPLICATE by _id (in case of duplicates from Sanity)
        const uniqueImages = Array.from(
          new Map(images.map(img => [img._id, img])).values()
        )
        console.log('[SM Studio] After deduplication:', uniqueImages.length, 'unique images')
        
        setSanityImages(uniqueImages || [])
      } catch (err) {
        console.error('Error loading Sanity images:', err)
      }
    }

    loadImages()
  }, [client])

  // Handle adding Sanity image to media
  const handleAddSanityImage = useCallback((imageUrl: string) => {
    setPostState((prev) => ({
      ...prev,
      mediaUrls: [...prev.mediaUrls, imageUrl],
    }))
    setShowImagePicker(false)
    toast.push({
      status: 'success',
      title: 'Bild hinzugefÃ¼gt',
    })
  }, [toast])

  // Handle News Article selection for Twitter
  const handleNewsArticleSelect = useCallback(async (article: NewsArticle) => {
    console.log('[Twitter News] Article selected:', article.title, 'Language:', article.language)
    
    // Show loading toast
    toast.push({
      status: 'info',
      title: 'â³ URLs werden gekÃ¼rzt...',
    })
    
    // Article is always DE (from API filter), find EN translation
    const deVersion = article // Always DE
    const enVersion = article._translations?.find(t => t.language === 'en')
    
    // Build full URLs
    const deUrlFull = deVersion ? `https://your-site.com/de/news/${deVersion.slug}` : ''
    const enUrlFull = enVersion ? `https://your-site.com/en/news/${enVersion.slug}` : ''
    
    // Shorten URLs
    let deUrl = deUrlFull
    let enUrl = enUrlFull
    
    try {
      if (deUrlFull) {
        const deResponse = await fetch('/api/shorten-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: deUrlFull }),
        })
        const deData = await deResponse.json()
        deUrl = deData.shortUrl || deUrlFull
      }
      
      if (enUrlFull) {
        const enResponse = await fetch('/api/shorten-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: enUrlFull }),
        })
        const enData = await enResponse.json()
        enUrl = enData.shortUrl || enUrlFull
      }
    } catch (error) {
      console.error('[Twitter News] URL shortening failed:', error)
      // Continue with full URLs if shortening fails
    }
    
    // Create excerpt (max 200 chars for Twitter with URLs)
    const excerpt = (article.excerpt || article.description || '').substring(0, 200)
    
    // Build Tweet text with emoji and excerpt
    // URLs go at the END for Twitter Card display (Twitter hides last URL if it's a card)
    let tweetText = `ðŸ“° ${article.title}\n\n${excerpt}${excerpt.length === 200 ? '...' : ''}\n\n`
    
    // For Twitter Card: Add URLs at the very end
    // Twitter will hide the last URL and show a card preview instead
    if (deUrl || enUrl) {
      // If we have both languages, add both (but Twitter will only show card for first URL)
      if (deUrl && enUrl) {
        tweetText += `ðŸ‡©ðŸ‡ª ${deUrl}\nðŸ‡¬ðŸ‡§ ${enUrl}`
      } else {
        // Single language
        tweetText += `${deUrl || enUrl}`
      }
    }
    
    // Ensure under 280 chars
    if (tweetText.length > 280) {
      // Recalculate with shorter excerpt
      const urlLength = (deUrl && enUrl) 
        ? `ðŸ‡©ðŸ‡ª ${deUrl}\nðŸ‡¬ðŸ‡§ ${enUrl}`.length 
        : (deUrl || enUrl || '').length
      
      const availableChars = 280 - urlLength - `ðŸ“° ${article.title}\n\n\n\n...`.length
      const shortenedExcerpt = (article.excerpt || article.description || '').substring(0, Math.max(availableChars, 50))
      
      tweetText = `ðŸ“° ${article.title}\n\n${shortenedExcerpt}...\n\n`
      
      if (deUrl && enUrl) {
        tweetText += `ðŸ‡©ðŸ‡ª ${deUrl}\nðŸ‡¬ðŸ‡§ ${enUrl}`
      } else if (deUrl || enUrl) {
        tweetText += `${deUrl || enUrl}`
      }
    }
    
    // Add main image if available
    const mediaUrls = article.mainImage?.asset?.url ? [article.mainImage.asset.url] : []
    
    setPostState((prev) => ({
      ...prev,
      content: tweetText,
      mediaUrls: [...prev.mediaUrls, ...mediaUrls],
      // Set Twitter-specific text
      platformTexts: {
        ...prev.platformTexts,
        twitter: tweetText,
      },
    }))
    
    setShowNewsSelector(false)
    
    toast.push({
      status: 'success',
      title: 'ðŸ¦ News-Artikel geladen!',
      description: `${article.title} â€¢ ${tweetText.length} Zeichen â€¢ URLs gekÃ¼rzt`,
    })
  }, [toast])

  // Handle media upload
  const handleMediaUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files || files.length === 0) return

      setPostState((prev) => ({ ...prev, isUploading: true }))

      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          console.log('[SM Studio] Uploading file:', file.name, file.type, file.size)
          
          // Upload via our API endpoint which handles the complete upload process
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch('/api/late/media/upload', {
            method: 'POST',
            body: formData,
          })

          const uploadData = await uploadResponse.json()
          console.log('[SM Studio] Upload response:', uploadData)

          if (!uploadResponse.ok) {
            throw new Error(uploadData.error || uploadData.details || 'Upload failed')
          }

          const mediaUrl = uploadData.downloadUrl || uploadData.publicUrl || uploadData.url

          if (!mediaUrl) {
            throw new Error('Invalid upload response: missing media URL')
          }

          console.log('[SM Studio] Upload successful, URL:', mediaUrl)
          return mediaUrl
        })

        const urls = await Promise.all(uploadPromises)
        console.log('[SM Studio] All uploads successful:', urls)

        setPostState((prev) => ({
          ...prev,
          mediaUrls: [...prev.mediaUrls, ...urls],
        }))

        toast.push({
          status: 'success',
          title: 'Upload erfolgreich',
          description: `${urls.length} Datei(en) hochgeladen`,
        })
      } catch (error) {
        console.error('[SM Studio] Upload error:', error)
        toast.push({
          status: 'error',
          title: 'Upload fehlgeschlagen',
          description: error instanceof Error ? error.message : 'Medien konnten nicht hochgeladen werden',
        })
      } finally {
        setPostState((prev) => ({ ...prev, isUploading: false }))
      }
    },
    [toast]
  )

  // Handle post submission
  const handlePost = useCallback(async () => {
    if (!apiSettings.apiKey || !apiSettings.profileId) {
      toast.push({
        status: 'warning',
        title: 'API nicht konfiguriert',
        description: 'Bitte konfiguriere zuerst die Late API in den Einstellungen',
      })
      return
    }

    // Check if this is ONLY an Instagram Story (Stories don't support text captions)
    const isOnlyInstagramStory = 
      postState.selectedPlatforms.length === 1 &&
      postState.selectedPlatforms.includes('instagram') &&
      postState.instagramPostType === 'story'

    // Content is required UNLESS it's an Instagram Story
    if (!postState.content.trim() && !isOnlyInstagramStory) {
      toast.push({
        status: 'warning',
        title: 'Kein Text',
        description: 'Bitte gib einen Text fÃ¼r deinen Post ein',
      })
      return
    }

    if (postState.selectedPlatforms.length === 0) {
      toast.push({
        status: 'warning',
        title: 'Keine Plattform',
        description: 'Bitte wÃ¤hle mindestens eine Plattform aus',
      })
      return
    }

    // Plattform-spezifische Validierung
    const mediaCount = postState.mediaUrls.length

    // Instagram-spezifische Validierung
    if (postState.selectedPlatforms.includes('instagram')) {
      const hasVideo = postState.mediaUrls.some(url => url.includes('video') || url.includes('.mp4') || url.includes('.mov'))
      
      switch (postState.instagramPostType) {
        case 'feed':
          if (mediaCount === 0) {
            toast.push({
              status: 'warning',
              title: 'ðŸ“¸ Instagram Feed: Fehlende Medien',
              description: 'Instagram Feed Posts benÃ¶tigen mindestens 1 Bild. Empfohlen: 1080x1350px (4:5)',
            })
            return
          }
          if (mediaCount > 10) {
            toast.push({
              status: 'warning',
              title: 'ðŸ“¸ Instagram Feed: Zu viele Medien',
              description: 'Feed Posts kÃ¶nnen maximal 10 Medien enthalten',
            })
            return
          }
          break
        case 'reel':
          if (mediaCount === 0 || !hasVideo) {
            toast.push({
              status: 'warning',
              title: 'ðŸŽ¬ Instagram Reel: Fehlendes Video',
              description: 'Reels benÃ¶tigen ein Video (3-90 Sek., 1080x1920px)',
            })
            return
          }
          if (mediaCount > 1) {
            toast.push({
              status: 'warning',
              title: 'ðŸŽ¬ Instagram Reel: Zu viele Medien',
              description: 'Reels kÃ¶nnen nur 1 Video enthalten',
            })
            return
          }
          break
        case 'carousel':
          if (mediaCount < 2) {
            toast.push({
              status: 'warning',
              title: 'ðŸŽ  Instagram Carousel: Zu wenig Medien',
              description: 'Carousels benÃ¶tigen 2-10 Medien (alle im gleichen Format)',
            })
            return
          }
          if (mediaCount > 10) {
            toast.push({
              status: 'warning',
              title: 'ðŸŽ  Instagram Carousel: Zu viele Medien',
              description: 'Carousels kÃ¶nnen maximal 10 Medien enthalten',
            })
            return
          }
          break
        case 'story':
          // Stories require at least 1 media (no text captions supported)
          if (mediaCount === 0) {
            toast.push({
              status: 'warning',
              title: 'ðŸ“– Instagram Story: Fehlendes Medium',
              description: 'Stories benÃ¶tigen mindestens 1 Bild oder Video (1080x1920px, 9:16)',
            })
            return
          }
          if (mediaCount > 1) {
            toast.push({
              status: 'info',
              title: 'ðŸ“– Instagram Story: Mehrere Medien',
              description: 'Nur das erste Medium wird als Story gepostet. FÃ¼r mehrere Stories: Einzeln posten.',
            })
          }
          break
      }
    }

    // Twitter-spezifische Validierung
    if (postState.selectedPlatforms.includes('twitter')) {
      if (mediaCount > 4) {
        toast.push({
          status: 'warning',
          title: 'ðŸ¦ Twitter/X: Zu viele Medien',
          description: 'Twitter unterstÃ¼tzt maximal 4 Medien pro Tweet',
        })
        return
      }
      
      const contentLength = postState.platformTexts.twitter?.length || postState.content.length
      if (contentLength > 280) {
        toast.push({
          status: 'warning',
          title: 'ðŸ¦ Twitter/X: Text zu lang',
          description: `Tweet hat ${contentLength} Zeichen (max 280). Nutze den Thread-Builder fÃ¼r lÃ¤ngere Texte.`,
        })
        return
      }
    }

    // Threads-spezifische Validierung  
    if (postState.selectedPlatforms.includes('threads')) {
      if (mediaCount > 10) {
        toast.push({
          status: 'warning',
          title: 'ðŸ§µ Threads: Zu viele Medien',
          description: 'Threads unterstÃ¼tzt maximal 10 Bilder',
        })
        return
      }
      
      const contentLength = postState.platformTexts.threads?.length || postState.content.length
      if (contentLength > 500) {
        toast.push({
          status: 'warning',
          title: 'ðŸ§µ Threads: Text zu lang',
          description: `Post hat ${contentLength} Zeichen (max 500). KÃ¼rze den Text oder poste auf anderen Plattformen.`,
        })
        return
      }
    }

    setPostState((prev) => ({ ...prev, isPosting: true }))

    try {
      // Validate media URLs - reject blob: URLs (Instagram requires http/https)
      const invalidUrls = postState.mediaUrls.filter(url => 
        url.startsWith('blob:') || url.startsWith('data:')
      )
      
      if (invalidUrls.length > 0) {
        console.error('[SM Studio] Invalid media URLs detected (blob: or data:):', invalidUrls)
        toast.push({
          status: 'error',
          title: 'UngÃ¼ltige Medien-URLs',
          description: 'Bitte lade die Bilder Ã¼ber die Upload-Funktion hoch oder wÃ¤hle Bilder aus der Sanity-Bibliothek',
        })
        setPostState((prev) => ({ ...prev, isPosting: false }))
        return
      }

      // Build media items - only accept http/https URLs
      const mediaItems = postState.mediaUrls
        .filter(url => url.startsWith('http://') || url.startsWith('https://'))
        .map((url) => ({
          url,
          type: url.includes('video') ? 'video' : 'image',
        }))

      // Build platforms array
      const platforms = postState.selectedPlatforms.map((platform) => {
        const account = apiSettings.accounts.find(
          (a) => a.platform === platform && a.isActive
        )
        const platformData: Record<string, unknown> = {
          platform,
          accountId: account?.accountId,
        }
        
        // Add Instagram-specific post type
        if (platform === 'instagram') {
          platformData.postType = postState.instagramPostType
        }
        
        return platformData as {
          platform: Platform
          accountId: string | undefined
          postType?: InstagramPostType
        }
      })

      // Build final content with hashtags and photographer
      let finalContent = postState.content

      // Add photographer credit if provided
      if (postState.photographer.trim()) {
        const photographerText = postState.photographer.startsWith('ðŸ“¸')
          ? postState.photographer
          : `ðŸ“¸ ${postState.photographer}`
        finalContent += `\n\n${photographerText}`
      }

      // Add hashtags if provided
      if (postState.hashtags.trim()) {
        const hashtags = postState.hashtags
          .split(/\s+/)
          .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
          .join(' ')
        finalContent += `\n\n${hashtags}`
      }

      console.log('[SM Studio] Posting with data:', {
        contentLength: finalContent.length,
        originalContent: postState.content.length,
        hasHashtags: !!postState.hashtags,
        hasPhotographer: !!postState.photographer,
        mediaCount: mediaItems.length,
        platformCount: platforms.length,
        platforms,
        publishNow: postState.publishNow,
      })

      // Post to each platform separately with platform-specific text
      const postPromises = postState.selectedPlatforms.map(async (platform) => {
        const account = apiSettings.accounts.find(
          (a) => a.platform === platform && a.isActive
        )

        // Use platform-specific text if available, otherwise use base content
        let platformContent = postState.platformTexts[platform] || postState.content

        // Add photographer credit if provided
        if (postState.photographer.trim()) {
          const photographerText = postState.photographer.startsWith('ðŸ“¸')
            ? postState.photographer
            : `ðŸ“¸ ${postState.photographer}`
          platformContent += `\n\n${photographerText}`
        }

        // Add hashtags if provided (Twitter gets less)
        if (postState.hashtags.trim()) {
          let hashtags = postState.hashtags
            .split(/\s+/)
            .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
          
          // Twitter only gets 2-3 hashtags
          if (platform === 'twitter') {
            hashtags = hashtags.slice(0, 3)
          }
          
          platformContent += `\n\n${hashtags.join(' ')}`
        }

        const platformData: Record<string, unknown> = {
          platform,
          accountId: account?.accountId,
        }
        
        // Add Instagram-specific post type
        if (platform === 'instagram') {
          platformData.postType = postState.instagramPostType
        }

        // Add first comment if provided (not for Stories)
        const isStory = (platform === 'instagram' || platform === 'facebook') && 
                       postState.instagramPostType === 'story'
        const firstComment = postState.platformFirstComments[platform]?.trim()
        
        if (firstComment && !isStory) {
          if (!platformData.platformSpecificData) {
            platformData.platformSpecificData = {}
          }
          (platformData.platformSpecificData as Record<string, unknown>).firstComment = firstComment
          
          console.log(`[SM Studio] First Comment added for ${platform}:`, {
            comment: firstComment,
            commentLength: firstComment.length,
          })
        }

        console.log(`[SM Studio] Posting to ${platform}:`, {
          textLength: platformContent.length,
          hasCustomText: !!postState.platformTexts[platform],
          hasFirstComment: !!firstComment,
          platformData: JSON.stringify(platformData, null, 2),
        })

        const response = await fetch('/api/late/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: platformContent,
            mediaItems,
            platforms: [platformData],
            publishNow: postState.publishNow,
            scheduledFor: postState.scheduledFor,
            timezone: 'Europe/Berlin',
          }),
        })

        const responseData = await response.json()
        
        if (!response.ok) {
          throw new Error(`${platform}: ${responseData.error || 'Failed'}`)
        }

        return { platform, success: true }
      })

      const results = await Promise.allSettled(postPromises)
      const successCount = results.filter(r => r.status === 'fulfilled').length
      const failedResults = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]

      console.log('[SM Studio] Post results:', results)

      if (failedResults.length > 0) {
        const failedPlatforms = failedResults.map(r => r.reason?.message || 'Unbekannt').join(', ')
        toast.push({
          status: successCount > 0 ? 'warning' : 'error',
          title: successCount > 0 ? 'Teilweise erfolgreich' : 'Posting fehlgeschlagen',
          description: successCount > 0
            ? `${successCount}/${postState.selectedPlatforms.length} erfolgreich. Fehler: ${failedPlatforms}`
            : `Fehler: ${failedPlatforms}`,
        })
      } else {
        toast.push({
          status: 'success',
          title: postState.publishNow ? 'Posts verÃ¶ffentlicht!' : 'Posts geplant!',
          description: `Erfolgreich auf ${successCount} von ${postState.selectedPlatforms.length} Plattform(en)`,
        })
      }

      // Reset form
      setPostState({
        content: '',
        hashtags: '',
        photographer: '',
        selectedPlatforms: [],
        platformTexts: {
          instagram: '',
          facebook: '',
          twitter: '',
          threads: '',
        },
        platformFirstComments: {
          instagram: '',
          facebook: '',
          twitter: '',
          threads: '',
        },
        instagramPostType: 'feed',
        instagramFormat: 'portrait',
        scheduledFor: null,
        publishNow: true,
        selectedContent: null,
        mediaUrls: [],
        isUploading: false,
        isPosting: false,
      })
    } catch (error) {
      console.error('[SM Studio] Post error:', error)
      toast.push({
        status: 'error',
        title: 'Post fehlgeschlagen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
      })
    } finally {
      setPostState((prev) => ({ ...prev, isPosting: false }))
    }
  }, [apiSettings, postState, toast])

  // Toggle platform
  const togglePlatform = useCallback((platform: Platform) => {
    setPostState((prev) => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(platform)
        ? prev.selectedPlatforms.filter((p) => p !== platform)
        : [...prev.selectedPlatforms, platform],
    }))
  }, [])

  // Save draft
  const handleSaveDraft = useCallback(async () => {
    if (!draftTitle.trim()) {
      toast.push({
        status: 'warning',
        title: 'Titel erforderlich',
        description: 'Bitte gib einen Titel fÃ¼r den Draft ein',
      })
      return
    }

    try {
      const draftDoc = {
        _type: 'socialMediaDraft',
        title: draftTitle,
        content: postState.content,
        hashtags: postState.hashtags,
        photographer: postState.photographer,
        platforms: postState.selectedPlatforms,
        platformTexts: postState.platformTexts,
        instagramPostType: postState.instagramPostType,
        mediaUrls: postState.mediaUrls,
        scheduledFor: postState.scheduledFor ? new Date(postState.scheduledFor).toISOString() : null,
        notes: draftNotes,
        isTemplate: saveDraftAsTemplate,
        createdBy: 'Social Media Studio',
      }

      await client.create(draftDoc)

      toast.push({
        status: 'success',
        title: saveDraftAsTemplate ? 'ðŸ“‹ Template gespeichert!' : 'ðŸ’¾ Draft gespeichert!',
        description: draftTitle,
      })

      setShowDraftDialog(false)
      setDraftTitle('')
      setDraftNotes('')
      setSaveDraftAsTemplate(false)
    } catch (error) {
      console.error('Save draft error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler beim Speichern',
        description: 'Draft konnte nicht gespeichert werden',
      })
    }
  }, [draftTitle, draftNotes, saveDraftAsTemplate, postState, toast, client])

  // Load drafts
  const loadDrafts = useCallback(async () => {
    setLoadingDrafts(true)
    try {
      const query = `*[_type == "socialMediaDraft"] | order(_createdAt desc) {
        _id,
        _createdAt,
        title,
        content,
        hashtags,
        photographer,
        platforms,
        platformTexts,
        instagramPostType,
        mediaUrls,
        scheduledFor,
        notes,
        isTemplate,
        createdBy
      }`
      
      const data = await client.fetch(query)
      setDrafts(data || [])
    } catch (error) {
      console.error('Load drafts error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler beim Laden',
        description: 'Drafts konnten nicht geladen werden',
      })
    } finally {
      setLoadingDrafts(false)
    }
  }, [toast, client])

  // Load draft into editor
  const handleLoadDraft = useCallback((draft: any) => {
    setPostState({
      content: draft.content || '',
      hashtags: draft.hashtags || '',
      photographer: draft.photographer || '',
      selectedPlatforms: draft.platforms || [],
      platformTexts: draft.platformTexts || {
        instagram: '',
        facebook: '',
        twitter: '',
        threads: '',
      },
      platformFirstComments: draft.platformFirstComments || {
        instagram: '',
        facebook: '',
        twitter: '',
        threads: '',
      },
      instagramPostType: draft.instagramPostType || 'feed',
      instagramFormat: draft.instagramFormat || 'portrait',
      scheduledFor: draft.scheduledFor ? new Date(draft.scheduledFor).toISOString().slice(0, 16) : null,
      publishNow: !draft.scheduledFor,
      selectedContent: null,
      mediaUrls: draft.mediaUrls || [],
      isUploading: false,
      isPosting: false,
    })

    setShowDraftList(false)
    
    toast.push({
      status: 'success',
      title: 'ðŸ“ Draft geladen!',
      description: draft.title,
    })
  }, [toast])

  // Delete draft
  const handleDeleteDraft = useCallback(async (draftId: string) => {
    try {
      await client.delete(draftId)
      
      setDrafts(prev => prev.filter(d => d._id !== draftId))
      
      toast.push({
        status: 'success',
        title: 'Draft gelÃ¶scht',
      })
    } catch (error) {
      console.error('Delete draft error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler beim LÃ¶schen',
      })
    }
  }, [toast, client])

  // Sync accounts from Late API
  const handleSyncAccounts = useCallback(async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/late/sync-accounts', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()
      
      setApiSettings((prev) => ({
        ...prev,
        accounts: data.accounts || [],
      }))

      toast.push({
        status: 'success',
        title: 'Accounts synchronisiert!',
        description: `${data.count} Account(s) gefunden`,
      })
    } catch (error) {
      console.error('Sync error:', error)
      toast.push({
        status: 'error',
        title: 'Synchronisation fehlgeschlagen',
        description: 'Konten konnten nicht synchronisiert werden',
      })
    } finally {
      setIsSyncing(false)
    }
  }, [toast])

  // Open connect URL for platform
  const handleConnectPlatform = useCallback(
    (platform: Platform) => {
      if (!apiSettings.profileId) {
        toast.push({
          status: 'warning',
          title: 'Profile ID fehlt',
          description: 'Bitte konfiguriere zuerst die Profile ID in den Einstellungen',
        })
        return
      }

      // Open OAuth URL in popup
      const url = `https://getlate.dev/api/v1/connect/${platform}?profileId=${apiSettings.profileId}`
      const popup = window.open(
        url,
        'late-oauth',
        'width=600,height=700,scrollbars=yes'
      )

      if (!popup) {
        toast.push({
          status: 'error',
          title: 'Popup blockiert',
          description: 'Bitte erlaube Popups fÃ¼r diese Seite',
        })
        return
      }

      // Poll for completion
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval)
          // Sync accounts after OAuth
          setTimeout(() => handleSyncAccounts(), 1000)
        }
      }, 1000)
    },
    [apiSettings.profileId, toast, handleSyncAccounts]
  )

  if (isLoadingSettings) {
    return (
      <Flex padding={5} justify="center" align="center">
        <Spinner muted />
      </Flex>
    )
  }

  if (!apiSettings.apiKey) {
    return (
      <Card padding={4} radius={2} tone="caution">
        <Stack space={3}>
          <Flex align="center" gap={2}>
            <RocketIcon style={{ fontSize: 24 }} />
            <Heading size={2}>API nicht konfiguriert</Heading>
          </Flex>
          <Text size={1}>
            Um Social Media Posting zu nutzen, musst du zuerst die Late API in den
            Einstellungen konfigurieren.
          </Text>
          <Button
            icon={CogIcon}
            mode="default"
            text="Einstellungen Ã¶ffnen"
            tone="primary"
            onClick={() => {
              // Switch to Settings tab
              onOpenSettings?.()
            }}
          />
        </Stack>
      </Card>
    )
  }

  const activeAccounts = apiSettings.accounts.filter((a) => a.isActive)
  const needsAccounts = activeAccounts.length === 0

  return (
    <Container width={3} padding={4}>
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Flex align="center" gap={3}>
              <RocketIcon style={{ fontSize: 28 }} />
              <Heading as="h1" size={2}>
                Social Media Posting
              </Heading>
              <Badge tone="positive" fontSize={0}>
                Beta
              </Badge>
            </Flex>
            <Text muted size={1}>
              Poste direkt auf Instagram, Facebook, Threads und X (Twitter)
            </Text>
          </Stack>
          <Flex gap={2}>
            <Badge tone="primary" fontSize={1}>
              {activeAccounts.length} Account(s)
            </Badge>
            <Button
              icon={RocketIcon}
              mode="ghost"
              text="Accounts synchronisieren"
              onClick={handleSyncAccounts}
              disabled={isSyncing}
              loading={isSyncing}
              fontSize={0}
            />
          </Flex>
        </Flex>

        {/* Account Connection Alert */}
        {needsAccounts && (
          <Card padding={4} radius={2} tone="caution">
            <Stack space={3}>
              <Heading size={1}>ðŸ”— Keine Accounts verbunden</Heading>
              <Text size={1}>
                Du musst zuerst Social Media Accounts verbinden, um posten zu kÃ¶nnen.
              </Text>
              <Button
                icon={RocketIcon}
                mode="default"
                text="Accounts verbinden"
                tone="positive"
                onClick={() => setShowConnectModal(true)}
              />
            </Stack>
          </Card>
        )}

        {/* Connect Accounts Modal */}
        {showConnectModal && (
          <Card padding={4} radius={2} shadow={3} tone="primary" style={{ marginBottom: '16px' }}>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Heading size={1}>Social Media Accounts verbinden</Heading>
                <Button
                  mode="ghost"
                  text="SchlieÃŸen"
                  onClick={() => setShowConnectModal(false)}
                  fontSize={0}
                />
              </Flex>
              
              <Text size={1}>
                Klicke auf eine Plattform, um den OAuth-Prozess zu starten. Ein Popup-Fenster
                Ã¶ffnet sich zur Authentifizierung.
              </Text>

              <Grid columns={2} gap={2}>
                {(['instagram', 'facebook', 'threads', 'twitter'] as Platform[]).map(
                  (platform) => {
                    const connected = apiSettings.accounts.some((a) => a.platform === platform)
                    return (
                      <Button
                        key={platform}
                        mode={connected ? 'ghost' : 'default'}
                        tone={connected ? 'positive' : 'primary'}
                        text={
                          platform === 'instagram'
                            ? connected ? 'âœ“ Instagram verbunden' : 'ðŸ“¸ Instagram verbinden'
                            : platform === 'facebook'
                            ? connected ? 'âœ“ Facebook verbunden' : 'ðŸ‘¥ Facebook verbinden'
                            : platform === 'threads'
                            ? connected ? 'âœ“ Threads verbunden' : 'ðŸ§µ Threads verbinden'
                            : connected ? 'âœ“ X verbunden' : 'ðŸ¦ X verbinden'
                        }
                        onClick={() => handleConnectPlatform(platform)}
                        disabled={connected}
                      />
                    )
                  }
                )}
              </Grid>

              <Card padding={3} radius={2} tone="transparent">
                <Text size={0} muted>
                  ðŸ’¡ Tipp: Nach dem Verbinden klicke auf &quot;Accounts synchronisieren&quot; um die
                  Liste zu aktualisieren.
                </Text>
              </Card>
            </Stack>
          </Card>
        )}

        {/* Sanity Image Picker Modal */}
        {showImagePicker && (
          <Card padding={4} radius={2} shadow={3} tone="primary" style={{ marginBottom: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            <Stack space={3}>
              <Flex justify="space-between" align="center">
                <Heading size={1}>Bild aus Sanity wÃ¤hlen</Heading>
                <Button
                  mode="ghost"
                  text="SchlieÃŸen"
                  onClick={() => setShowImagePicker(false)}
                  fontSize={0}
                />
              </Flex>
              
              <Text size={1} muted>
                {sanityImages.length} Bilder verfÃ¼gbar (Posts, Concert Reports, Aftershow Stories)
              </Text>

              <Grid columns={[2, 3, 4]} gap={2}>
                {sanityImages.map((image) => (
                  <Card
                    key={image._id}
                    padding={0}
                    radius={2}
                    shadow={1}
                    style={{ 
                      cursor: 'pointer', 
                      overflow: 'hidden',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onClick={() => handleAddSanityImage(image.url)}
                  >
                    <Box style={{ aspectRatio: '1', position: 'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.alt || image.title || 'Sanity image'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {image.language && (
                        <Badge
                          tone="default"
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            fontSize: '10px',
                          }}
                        >
                          {image.language.toUpperCase()}
                        </Badge>
                      )}
                    </Box>
                    {image.title && (
                      <Box padding={2}>
                        <Text size={0} style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {image.title}
                        </Text>
                      </Box>
                    )}
                  </Card>
                ))}
              </Grid>

              {sanityImages.length === 0 && (
                <Card padding={4} radius={2} tone="transparent">
                  <Text size={1} align="center" muted>
                    Keine Bilder gefunden
                  </Text>
                </Card>
              )}
            </Stack>
          </Card>
        )}

        {/* Twitter News Article Selector */}
        {showNewsSelector && (
          <NewsArticleSelector
            onArticleSelect={handleNewsArticleSelect}
            onClose={() => setShowNewsSelector(false)}
          />
        )}

        <Grid columns={[1, 1, 2]} gap={4}>
          {/* LEFT COLUMN - Compose */}
          <Stack space={3}>
            {/* Template Selector */}
            <Card>
              <TemplateSelectorCard 
                onTemplateSelect={(template) => {
                  // Apply template to post state
                  setPostState((prev) => ({
                    ...prev,
                    content: template.content,
                    hashtags: template.hashtags || prev.hashtags,
                    selectedPlatforms: template.platforms || prev.selectedPlatforms,
                    instagramPostType: template.instagramPostType || prev.instagramPostType,
                  }))
                }}
                onMediaAdd={handleAddSanityImage}
                language="de" // Not used anymore, but kept for compatibility
              />
            </Card>
            
            {/* Drafts Button */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <DocumentsIcon />
                  <Text weight="semibold" size={1}>Drafts & Templates</Text>
                </Flex>
                
                <Button
                  icon={DocumentsIcon}
                  text="Drafts anzeigen"
                  mode="default"
                  tone="primary"
                  onClick={() => {
                    loadDrafts()
                    setShowDraftList(true)
                  }}
                  fontSize={1}
                />
                
                <Text size={0} muted>
                  Gespeicherte Drafts und Templates laden
                </Text>
              </Stack>
            </Card>

            {/* Platform Selection */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary">1</Badge>
                  <Text weight="semibold" size={1}>
                    Plattformen
                  </Text>
                </Flex>

                <Grid columns={2} gap={2}>
                  {(['instagram', 'facebook', 'threads', 'twitter'] as Platform[]).map(
                    (platform) => {
                      const account = activeAccounts.find((a) => a.platform === platform)
                      const isSelected = postState.selectedPlatforms.includes(platform)
                      const isDisabled = !account

                      return (
                        <Card
                          key={platform}
                          padding={3}
                          radius={2}
                          tone={isSelected ? 'primary' : 'default'}
                          shadow={isSelected ? 2 : 1}
                          style={{
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.5 : 1,
                            border: isSelected
                              ? '2px solid var(--card-focus-ring-color)'
                              : '2px solid transparent',
                          }}
                          onClick={() => !isDisabled && togglePlatform(platform)}
                        >
                          <Stack space={2}>
                            <Flex align="center" gap={2}>
                              <Switch
                                checked={isSelected}
                                disabled={isDisabled}
                                onChange={() => !isDisabled && togglePlatform(platform)}
                              />
                              <Text size={1} weight="semibold">
                                {platform === 'instagram' && 'ðŸ“¸ Instagram'}
                                {platform === 'facebook' && 'ðŸ‘¥ Facebook'}
                                {platform === 'threads' && 'ðŸ§µ Threads'}
                                {platform === 'twitter' && 'ðŸ¦ X (Twitter)'}
                              </Text>
                            </Flex>
                            {account && (
                              <Text size={0} muted>
                                @{account.username}
                              </Text>
                            )}
                            {!account && (
                              <Text size={0} style={{ color: 'var(--card-muted-fg-color)' }}>
                                Nicht verbunden
                              </Text>
                            )}
                          </Stack>
                        </Card>
                      )
                    }
                  )}
                </Grid>
              </Stack>
            </Card>

            {/* Instagram Post Type Selection */}
            {postState.selectedPlatforms.includes('instagram') && (
              <Card padding={4} radius={2} shadow={1}>
                <Stack space={3}>
                  <Flex align="center" gap={2}>
                    <Badge tone="primary">2</Badge>
                    <Text weight="semibold" size={1}>
                      ðŸ“¸ Instagram Post-Typ
                    </Text>
                  </Flex>

                  <Grid columns={2} gap={2}>
                    {[
                      { value: 'feed' as InstagramPostType, icon: 'ðŸ“°', label: 'Feed Post', description: 'Single image, permanent' },
                      { value: 'story' as InstagramPostType, icon: 'ðŸ“–', label: 'Story', description: '24h visibility' },
                      { value: 'reel' as InstagramPostType, icon: 'ðŸŽ¬', label: 'Reel', description: 'Auto for videos' },
                      { value: 'carousel' as InstagramPostType, icon: 'ðŸŽ ', label: 'Carousel', description: '2-10 items' },
                    ].map((type) => {
                      const isSelected = postState.instagramPostType === type.value
                      return (
                        <Card
                          key={type.value}
                          padding={3}
                          radius={2}
                          tone={isSelected ? 'primary' : 'default'}
                          shadow={isSelected ? 2 : 1}
                          style={{
                            cursor: 'pointer',
                            border: isSelected
                              ? '2px solid var(--card-focus-ring-color)'
                              : '2px solid transparent',
                          }}
                          onClick={() => {
                            setPostState((prev) => ({
                              ...prev,
                              instagramPostType: type.value,
                            }))
                          }}
                        >
                          <Stack space={2}>
                            <Flex align="center" gap={2}>
                              <Text size={2}>{type.icon}</Text>
                              <Text size={1} weight="semibold">
                                {type.label}
                              </Text>
                            </Flex>
                            <Text size={0} muted>
                              {type.description}
                            </Text>
                          </Stack>
                        </Card>
                      )
                    })}
                  </Grid>

                  {/* Info Badge based on selected type */}
                  {postState.instagramPostType === 'story' && (
                    <Card padding={3} tone="caution">
                      <Stack space={2}>
                        <Text size={1} weight="semibold">ðŸ“– Story-Anforderungen:</Text>
                        <Text size={0}>â€¢ Format: 1080x1920px (9:16 Hochformat)</Text>
                        <Text size={0}>â€¢ Sichtbarkeit: 24 Stunden</Text>
                        <Text size={0}>â€¢ Medien: Bilder oder Videos (max 60 Sek.)</Text>
                        <Text size={0}>â€¢ Text: Muss im Bild selbst sein</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.instagramPostType === 'reel' && (
                    <Card padding={3} tone="caution">
                      <Stack space={2}>
                        <Text size={1} weight="semibold">ðŸŽ¬ Reel-Anforderungen:</Text>
                        <Text size={0}>â€¢ Format: 1080x1920px (9:16 Hochformat)</Text>
                        <Text size={0}>â€¢ Nur Videos (3-90 Sekunden)</Text>
                        <Text size={0}>â€¢ Wird automatisch bei 9:16 Video erkannt</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.instagramPostType === 'carousel' && (
                    <Card padding={3} tone="caution">
                      <Stack space={2}>
                        <Text size={1} weight="semibold">ðŸŽ  Carousel-Anforderungen:</Text>
                        <Text size={0}>â€¢ Format: 1080x1080px (1:1 empfohlen)</Text>
                        <Text size={0}>â€¢ 2-10 Bilder/Videos</Text>
                        <Text size={0}>â€¢ Alle Medien sollten gleiches Format haben</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.instagramPostType === 'feed' && (
                    <Card padding={3} tone="transparent" border>
                      <Stack space={2}>
                        <Text size={1} weight="semibold">ðŸ“° Feed Post-Formate:</Text>
                        <Text size={0}>â€¢ Portrait: 1080x1350px (4:5) - Beste Reichweite</Text>
                        <Text size={0}>â€¢ Quadrat: 1080x1080px (1:1) - Standard</Text>
                        <Text size={0}>â€¢ Landscape: 1080x566px (1.91:1) - Minimum</Text>
                      </Stack>
                    </Card>
                  )}
                  
                  {/* Instagram Format Selector (for Feed & Carousel) */}
                  {(postState.instagramPostType === 'feed' || postState.instagramPostType === 'carousel') && (
                    <InstagramFormatSelector
                      selectedFormat={postState.instagramFormat}
                      onFormatChange={(format) => {
                        setPostState((prev) => ({
                          ...prev,
                          instagramFormat: format,
                        }))
                      }}
                    />
                  )}
                </Stack>
              </Card>
            )}

            {/* Post Content - Multi-Platform Text (NOT for Instagram Stories) */}
            {/* Instagram Stories don't support text captions - show info instead */}
            {postState.selectedPlatforms.length === 1 && 
             postState.selectedPlatforms.includes('instagram') && 
             postState.instagramPostType === 'story' ? (
              <Card padding={4} radius={2} shadow={1} tone="caution">
                <Stack space={3}>
                  <Flex align="center" gap={2}>
                    <Badge tone="caution">3</Badge>
                    <Text weight="semibold" size={1}>
                      ðŸ“– Story-Modus aktiv
                    </Text>
                  </Flex>
                  <Card padding={3} radius={2} tone="caution">
                    <Stack space={3}>
                      <Flex align="center" gap={2}>
                        <Text size={2}>â„¹ï¸</Text>
                        <Text size={1} weight="semibold">Instagram Stories zeigen keinen Text an</Text>
                      </Flex>
                      <Text size={1}>
                        Stories bestehen nur aus Bild/Video. FÃ¼ge Text-Overlays direkt im <strong>Graphics Studio</strong> hinzu, bevor du das Bild hierher sendest.
                      </Text>
                      <Card padding={2} radius={2} tone="transparent" border>
                        <Text size={0} muted>
                          ðŸ’¡ Tipp: Format 1080x1920px (9:16) ist optimal fÃ¼r Stories
                        </Text>
                      </Card>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
            ) : (
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2} justify="space-between">
                  <Flex align="center" gap={2}>
                    <Badge tone="primary">3</Badge>
                    <Text weight="semibold" size={1}>
                      Text pro Plattform
                    </Text>
                    <Badge tone="positive" fontSize={0}>
                      Multi-Text
                    </Badge>
                  </Flex>
                  
                  {/* Twitter News Article Button */}
                  {postState.selectedPlatforms.includes('twitter') && (
                    <Button
                      icon={RocketIcon}
                      mode="ghost"
                      tone="primary"
                      text="ðŸ“° News"
                      onClick={() => setShowNewsSelector(true)}
                      fontSize={1}
                    />
                  )}
                </Flex>

                {postState.selectedPlatforms.length === 0 ? (
                  <Card padding={3} radius={2} tone="caution">
                    <Text size={1} muted align="center">
                      WÃ¤hle zuerst Plattformen aus
                    </Text>
                  </Card>
                ) : (
                  <>
                    {/* Basis-Text fÃ¼r alle */}
                    <Stack space={2}>
                      <Label size={0} muted>
                        ðŸ“ Basis-Text (fÃ¼r alle Plattformen):
                      </Label>
                      <TextArea
                        value={postState.content}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                          const value = e.target.value
                          setPostState((prev) => ({
                            ...prev,
                            content: value,
                          }))
                        }}
                        placeholder="Schreib hier deinen Basis-Text..."
                        rows={5}
                        fontSize={1}
                      />
                      <Flex justify="space-between" align="center">
                        <Text size={0} muted>
                          {postState.content.length} Zeichen
                        </Text>
                        {postState.selectedPlatforms.includes('twitter') && postState.content.length > 280 && (
                          <Badge tone="caution" fontSize={0}>
                            âš ï¸ Twitter: Max 280
                          </Badge>
                        )}
                        {postState.selectedPlatforms.includes('threads') && postState.content.length > 500 && (
                          <Badge tone="caution" fontSize={0}>
                            âš ï¸ Threads: Max 500
                          </Badge>
                        )}
                      </Flex>
                    </Stack>

                    {/* Platform-Specific Texts */}
                    {postState.selectedPlatforms.map((platform) => {
                      const platformIcons: Record<Platform, string> = {
                        instagram: 'ðŸ“¸',
                        facebook: 'ðŸ‘¥',
                        twitter: 'ðŸ¦',
                        threads: 'ðŸ§µ',
                      }
                      const platformLabels: Record<Platform, string> = {
                        instagram: 'Instagram',
                        facebook: 'Facebook',
                        twitter: 'Twitter/X',
                        threads: 'Threads',
                      }

                      return (
                        <Card key={platform} padding={3} radius={2} tone="transparent" border>
                          <Stack space={3}>
                            <Flex align="center" gap={2}>
                              <Text size={2}>{platformIcons[platform]}</Text>
                              <Label size={0}>
                                {platformLabels[platform]}-Text:
                              </Label>
                            </Flex>
                            <TextArea
                              value={postState.platformTexts[platform] || postState.content}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                const value = e.target.value
                                setPostState((prev) => ({
                                  ...prev,
                                  platformTexts: {
                                    ...prev.platformTexts,
                                    [platform]: value,
                                  },
                                }))
                              }}
                              placeholder={`Text fÃ¼r ${platformLabels[platform]}...`}
                              rows={4}
                              fontSize={1}
                            />
                            <Flex justify="space-between" align="center">
                              <Text size={0} muted>
                                {(postState.platformTexts[platform] || postState.content).length} Zeichen
                                {platform === 'twitter' && ` / 280`}
                                {platform === 'threads' && ` / 500`}
                              </Text>
                              {platform === 'twitter' && (postState.platformTexts[platform] || postState.content).length > 280 && (
                                <Badge tone="critical" fontSize={0}>
                                  âš ï¸ Zu lang
                                </Badge>
                              )}
                              {platform === 'threads' && (postState.platformTexts[platform] || postState.content).length > 500 && (
                                <Badge tone="caution" fontSize={0}>
                                  âš ï¸ Zu lang
                                </Badge>
                              )}
                              <Button
                                mode="ghost"
                                tone="default"
                                text="Vom Basis-Text"
                                fontSize={0}
                                onClick={() => {
                                  setPostState((prev) => ({
                                    ...prev,
                                    platformTexts: {
                                      ...prev.platformTexts,
                                      [platform]: prev.content,
                                    },
                                  }))
                                }}
                              />
                            </Flex>

                            {/* First Comment Section - ONLY for Facebook non-Story posts (not fully supported for other platforms) */}
                            {!((platform === 'instagram' || platform === 'facebook') && postState.instagramPostType === 'story') && (
                              <Box paddingTop={2} style={{ borderTop: '1px solid var(--card-border-color)' }}>
                                <Stack space={2}>
                                  <Flex align="center" gap={2} justify="space-between">
                                    <Label size={0}>
                                      ðŸ’¬ First Comment (Optional):
                                      {platform !== 'facebook' && (
                                        <Badge tone="caution" fontSize={0} style={{ marginLeft: '8px' }}>
                                          Experimentell - Nur Facebook getestet
                                        </Badge>
                                      )}
                                    </Label>
                                    <Button
                                      mode="ghost"
                                      tone="primary"
                                      text="Vorlage"
                                      fontSize={0}
                                      icon={DocumentIcon}
                                      onClick={() => {
                                        // First Comment Templates (primarily for Facebook)
                                        const templates: Record<Platform, string[]> = {
                                          instagram: [
                                            'ðŸ”— Link in Bio! Mehr Infos findest du dort.',
                                            'ðŸ“¸ Was hÃ¤ltst du davon? Lass es mich in den Kommentaren wissen! ðŸ‘‡',
                                            'ðŸ’¯ Markiere Freunde, die das sehen mÃ¼ssen!',
                                            'ðŸŽŸï¸ Tickets im Link! Sichere dir deinen Platz!',
                                            'ðŸ”¥ Schreib mir deine Meinung in die Kommentare!',
                                          ],
                                          facebook: [
                                            'ðŸ”— Mehr Infos und Tickets: [LINK HIER EINFÃœGEN]',
                                            'ðŸ‘¥ Was denkst du? Teile deine Meinung in den Kommentaren!',
                                            'ðŸ“… Markiere dir das Datum im Kalender!',
                                            'ðŸŽ‰ Teilen nicht vergessen! Lass andere auch teilhaben.',
                                          ],
                                          twitter: [
                                            'ðŸ”— Details: [LINK]',
                                            'ðŸ’¬ Eure Meinung?',
                                            'ðŸ”„ RT wenn du auch dabei bist!',
                                          ],
                                          threads: [
                                            'ðŸ§µ Was sagt ihr dazu? Drop eure Gedanken! ðŸ‘‡',
                                            'ðŸ’¬ Mehr dazu in meinem Profil!',
                                            'ðŸ”¥ Markiert Freunde, die das interessiert!',
                                          ],
                                        }
                                        
                                        const platformTemplates = templates[platform] || templates.facebook
                                        const randomTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
                                        
                                        setPostState((prev) => ({
                                          ...prev,
                                          platformFirstComments: {
                                            ...prev.platformFirstComments,
                                            [platform]: randomTemplate,
                                          },
                                        }))
                                        
                                        toast.push({
                                          status: platform === 'facebook' ? 'success' : 'warning',
                                          title: platform === 'facebook' ? 'ðŸ’¡ Vorlage eingefÃ¼gt!' : 'âš ï¸ Experimentell',
                                          description: platform === 'facebook' 
                                            ? 'Du kannst den Text jetzt anpassen.' 
                                            : 'First Comments sind nur fÃ¼r Facebook offiziell unterstÃ¼tzt.',
                                        })
                                      }}
                                    />
                                  </Flex>
                                  <TextArea
                                    value={postState.platformFirstComments[platform] || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                      const value = e.target.value
                                      setPostState((prev) => ({
                                        ...prev,
                                        platformFirstComments: {
                                          ...prev.platformFirstComments,
                                          [platform]: value,
                                        },
                                      }))
                                    }}
                                    placeholder={`Automatischer erster Kommentar fÃ¼r ${platformLabels[platform]}... (z.B. Link, CTA)`}
                                    rows={2}
                                    fontSize={1}
                                  />
                                  {postState.platformFirstComments[platform] && (
                                    <Text size={0} muted>
                                      {postState.platformFirstComments[platform].length} Zeichen
                                    </Text>
                                  )}
                                  <Text size={0} muted style={{ fontStyle: 'italic' }}>
                                    {platform === 'facebook' ? (
                                      <>ðŸ’¡ First Comments werden automatisch gepostet. Ideal fÃ¼r Links, CTAs oder Kontext.</>
                                    ) : (
                                      <>âš ï¸ First Comments sind nur fÃ¼r Facebook offiziell unterstÃ¼tzt. Andere Plattformen sind experimentell und funktionieren mÃ¶glicherweise nicht.</>
                                    )}
                                  </Text>
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </Card>
                      )
                    })}
                  </>
                )}
              </Stack>
            </Card>
            )}

            {/* AI-Assistent - NOT for Instagram Stories (no text needed) */}
            {!(postState.selectedPlatforms.length === 1 && 
               postState.selectedPlatforms.includes('instagram') && 
               postState.instagramPostType === 'story') && (
            <AIAssistent
              content={postState.content}
              selectedPlatforms={postState.selectedPlatforms}
              platformTexts={postState.platformTexts}
              onPlatformTextUpdate={(platform, text) => {
                setPostState((prev) => ({
                  ...prev,
                  platformTexts: {
                    ...prev.platformTexts,
                    [platform]: text,
                  },
                }))
              }}
              onContentUpdate={(newContent) => {
                setPostState((prev) => ({ ...prev, content: newContent }))
              }}
              onHashtagsUpdate={(hashtags) => {
                setPostState((prev) => ({ ...prev, hashtags }))
              }}
            />
            )}

            {/* Thread/Carousel Builder */}
            {postState.selectedPlatforms.includes('twitter') && postState.content.length > 280 && (
              <ThreadBuilderCard 
                content={postState.content}
                onThreadUpdate={(tweets) => {
                  // Store tweets in state
                  console.log('Thread tweets:', tweets)
                }}
              />
            )}

            {postState.selectedPlatforms.includes('instagram') && 
             postState.instagramPostType === 'carousel' && 
             postState.mediaUrls.length > 1 && (
              <CarouselBuilderCard 
                mediaUrls={postState.mediaUrls}
                onReorder={(reordered) => {
                  setPostState((prev) => ({ ...prev, mediaUrls: reordered }))
                }}
              />
            )}

            {/* Hashtags & Photographer - NOT for Instagram Stories */}
            {!(postState.selectedPlatforms.length === 1 && 
               postState.selectedPlatforms.includes('instagram') && 
               postState.instagramPostType === 'story') && (
            <>
            {/* Hashtags */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary">#</Badge>
                  <Text weight="semibold" size={1}>
                    Hashtags
                  </Text>
                </Flex>

                <TextInput
                  value={postState.hashtags}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setPostState((prev) => ({
                      ...prev,
                      hashtags: value,
                    }))
                  }}
                  placeholder="#music #concert #live"
                  fontSize={1}
                />

                <Text size={0} muted>
                  Hashtags werden automatisch am Ende des Posts hinzugefÃ¼gt
                </Text>
              </Stack>
            </Card>

            {/* Photographer */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary">ðŸ“¸</Badge>
                  <Text weight="semibold" size={1}>
                    Fotograf / Bildinhaber
                  </Text>
                </Flex>

                <TextInput
                  value={postState.photographer}
                  onChange={(e) => {
                    const value = e.currentTarget.value
                    setPostState((prev) => ({
                      ...prev,
                      photographer: value,
                    }))
                  }}
                  placeholder="ðŸ“¸ @photographer_name"
                  fontSize={1}
                />

                <Text size={0} muted>
                  Credit-Zeile fÃ¼r den Fotografen (beginnt automatisch mit ðŸ“¸)
                </Text>
              </Stack>
            </Card>
            </>
            )}

            {/* Media Upload */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary">4</Badge>
                  <Text weight="semibold" size={1}>
                    Medien
                  </Text>
                  {postState.mediaUrls.length > 0 && (
                    <Badge tone="positive">{postState.mediaUrls.length}</Badge>
                  )}
                </Flex>

                <Flex gap={2} wrap="wrap">
                  <Button
                    icon={UploadIcon}
                    mode="ghost"
                    tone="default"
                    text="Hochladen"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={postState.isUploading}
                    loading={postState.isUploading}
                    fontSize={1}
                  />
                  <Button
                    icon={ImageIcon}
                    mode="ghost"
                    tone="primary"
                    text="Aus Sanity"
                    onClick={() => setShowImagePicker(true)}
                    fontSize={1}
                  />
                </Flex>
                
                {/* Media Requirements Info */}
                {postState.selectedPlatforms.includes('instagram') && (
                  <Card padding={2} radius={2} tone="transparent" border>
                    <Text size={0} muted>
                      {postState.instagramPostType === 'feed' && 'ðŸ“¸ Feed: Min. 1 Bild'}
                      {postState.instagramPostType === 'reel' && 'ðŸŽ¬ Reel: 1 Video erforderlich'}
                      {postState.instagramPostType === 'carousel' && 'ðŸŽ  Carousel: 2-10 Medien'}
                      {postState.instagramPostType === 'story' && 'ðŸ“– Story: Beliebig'}
                    </Text>
                  </Card>
                )}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaUpload}
                  style={{ display: 'none' }}
                />

                {postState.mediaUrls.length > 0 && (
                  <Grid columns={3} gap={2}>
                    {postState.mediaUrls.map((url, idx) => (
                      <Box
                        key={idx}
                        style={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: '4px',
                          overflow: 'hidden',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Media ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <Button
                          icon={TrashIcon}
                          mode="ghost"
                          tone="critical"
                          onClick={() =>
                            setPostState((prev) => ({
                              ...prev,
                              mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx),
                            }))
                          }
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                          }}
                          fontSize={0}
                        />
                      </Box>
                    ))}
                  </Grid>
                )}
              </Stack>
            </Card>

            {/* Scheduling */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Badge tone="primary">5</Badge>
                  <Text weight="semibold" size={1}>
                    Zeitplan
                  </Text>
                </Flex>

                <Flex gap={2}>
                  <Button
                    mode={postState.publishNow ? 'default' : 'ghost'}
                    tone={postState.publishNow ? 'primary' : 'default'}
                    text="Sofort posten"
                    onClick={() =>
                      setPostState((prev) => ({ ...prev, publishNow: true }))
                    }
                    fontSize={1}
                  />
                  <Button
                    mode={!postState.publishNow ? 'default' : 'ghost'}
                    tone={!postState.publishNow ? 'primary' : 'default'}
                    text="Planen"
                    onClick={() =>
                      setPostState((prev) => ({ ...prev, publishNow: false }))
                    }
                    fontSize={1}
                  />
                </Flex>

                {!postState.publishNow && (
                  <Stack space={3}>
                    <Label size={0}>
                      <Flex align="center" gap={2}>
                        <CalendarIcon />
                        <span>Zeitpunkt wÃ¤hlen</span>
                      </Flex>
                    </Label>
                    
                    {/* Quick Select Buttons */}
                    <Grid columns={3} gap={2}>
                      {[
                        { label: 'In 1 Std', hours: 1 },
                        { label: 'In 3 Std', hours: 3 },
                        { label: 'Morgen 10:00', hours: null, custom: () => {
                          const tomorrow = new Date()
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          tomorrow.setHours(10, 0, 0, 0)
                          return tomorrow
                        }},
                        { label: 'Morgen 14:00', hours: null, custom: () => {
                          const tomorrow = new Date()
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          tomorrow.setHours(14, 0, 0, 0)
                          return tomorrow
                        }},
                        { label: 'Morgen 18:00', hours: null, custom: () => {
                          const tomorrow = new Date()
                          tomorrow.setDate(tomorrow.getDate() + 1)
                          tomorrow.setHours(18, 0, 0, 0)
                          return tomorrow
                        }},
                        { label: 'NÃ¤chste Woche', hours: null, custom: () => {
                          const nextWeek = new Date()
                          nextWeek.setDate(nextWeek.getDate() + 7)
                          nextWeek.setHours(10, 0, 0, 0)
                          return nextWeek
                        }},
                      ].map((preset, idx) => (
                        <Button
                          key={idx}
                          mode="ghost"
                          tone="default"
                          text={preset.label}
                          fontSize={0}
                          onClick={() => {
                            const date = preset.custom 
                              ? preset.custom() 
                              : new Date(Date.now() + preset.hours! * 60 * 60 * 1000)
                            
                            // Format for datetime-local input
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const hours = String(date.getHours()).padStart(2, '0')
                            const minutes = String(date.getMinutes()).padStart(2, '0')
                            
                            setPostState((prev) => ({
                              ...prev,
                              scheduledFor: `${year}-${month}-${day}T${hours}:${minutes}`,
                            }))
                          }}
                        />
                      ))}
                    </Grid>
                    
                    <Box>
                      <input
                        type="datetime-local"
                        value={postState.scheduledFor || ''}
                        onChange={(e) =>
                          setPostState((prev) => ({
                            ...prev,
                            scheduledFor: e.target.value || null,
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '14px',
                          border: '1px solid var(--card-border-color)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--card-bg-color)',
                          color: 'var(--card-fg-color)',
                          fontFamily: 'inherit',
                        }}
                      />
                    </Box>
                    
                    {postState.scheduledFor && (
                      <Card padding={2} tone="primary">
                        <Text size={0}>
                          â° Post wird verÃ¶ffentlicht am: {new Date(postState.scheduledFor).toLocaleString('de-DE', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                          })}
                        </Text>
                      </Card>
                    )}
                    
                    <Text size={0} muted>
                      ðŸŒ Timezone: Europe/Berlin (CET/CEST)
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Card>

            {/* Submit Buttons */}
            <Grid columns={2} gap={2}>
              <Button
                icon={RocketIcon}
                mode="default"
                tone="positive"
                text={postState.publishNow ? 'Jetzt posten' : 'Post planen'}
                onClick={handlePost}
                disabled={(() => {
                  // Basic checks
                  if (postState.isPosting) return true
                  if (postState.selectedPlatforms.length === 0) return true
                  
                  // Instagram Story only needs media, no text required
                  const isOnlyInstagramStory = 
                    postState.selectedPlatforms.length === 1 &&
                    postState.selectedPlatforms.includes('instagram') &&
                    postState.instagramPostType === 'story'
                  
                  if (isOnlyInstagramStory) {
                    // Story needs at least 1 media
                    return postState.mediaUrls.length === 0
                  }
                  
                  // All other post types require text
                  return !postState.content.trim()
                })()}
                loading={postState.isPosting}
                fontSize={2}
                padding={4}
              />
              <Button
                icon={DocumentsIcon}
                mode="default"
                tone="primary"
                text="Als Draft speichern"
                onClick={() => setShowDraftDialog(true)}
                disabled={!postState.content.trim() && postState.mediaUrls.length === 0}
                fontSize={2}
                padding={4}
              />
            </Grid>
          </Stack>

          {/* RIGHT COLUMN - Preview */}
          <Stack space={3}>
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <EyeOpenIcon />
                  <Text weight="semibold" size={1}>
                    Vorschau
                  </Text>
                </Flex>

                {postState.selectedPlatforms.length === 0 ? (
                  <Card padding={3} tone="transparent">
                    <Text size={1} muted align="center">
                      WÃ¤hle Plattformen aus, um eine Vorschau zu sehen
                    </Text>
                  </Card>
                ) : (
                  <Stack space={3}>
                    {postState.selectedPlatforms.map((platform) => {
                      const account = activeAccounts.find((a) => a.platform === platform)
                      
                      // Use platform-specific text if available, otherwise use base content
                      let previewContent = postState.platformTexts[platform] || postState.content
                      
                      if (postState.photographer.trim()) {
                        const photographerText = postState.photographer.startsWith('ðŸ“¸')
                          ? postState.photographer
                          : `ðŸ“¸ ${postState.photographer}`
                        previewContent += `\n\n${photographerText}`
                      }
                      
                      if (postState.hashtags.trim()) {
                        let hashtags = postState.hashtags
                          .split(/\s+/)
                          .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
                        
                        // Twitter gets only 2-3 hashtags
                        if (platform === 'twitter') {
                          hashtags = hashtags.slice(0, 3)
                        }
                        
                        previewContent += `\n\n${hashtags.join(' ')}`
                      }
                      
                      return (
                        <PlatformPreview
                          key={platform}
                          platform={platform}
                          content={previewContent}
                          username={account?.username || 'username'}
                          mediaUrl={postState.mediaUrls[0]}
                          mediaUrls={postState.mediaUrls}
                          instagramPostType={platform === 'instagram' ? postState.instagramPostType : undefined}
                          instagramFormat={platform === 'instagram' ? postState.instagramFormat : undefined}
                        />
                      )
                    })}
                  </Stack>
                )}
              </Stack>
            </Card>

            {/* Plattform-Limits Info */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Flex align="center" gap={2}>
                  <Text size={2}>ðŸ“Š</Text>
                  <Text size={1} weight="semibold">
                    Plattform-Limits
                  </Text>
                </Flex>
                <Grid columns={2} gap={2}>
                  {postState.selectedPlatforms.includes('instagram') && (
                    <Card padding={2} radius={2} tone="transparent" border>
                      <Stack space={1}>
                        <Text size={0} weight="semibold">ðŸ“¸ Instagram</Text>
                        <Text size={0} muted>â€¢ Max 2.200 Zeichen</Text>
                        <Text size={0} muted>â€¢ 1-10 Medien (je nach Typ)</Text>
                        <Text size={0} muted>â€¢ Stories: kein Text</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.selectedPlatforms.includes('facebook') && (
                    <Card padding={2} radius={2} tone="transparent" border>
                      <Stack space={1}>
                        <Text size={0} weight="semibold">ðŸ‘¥ Facebook</Text>
                        <Text size={0} muted>â€¢ Max 63.206 Zeichen</Text>
                        <Text size={0} muted>â€¢ Unbegrenzt Medien</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.selectedPlatforms.includes('threads') && (
                    <Card padding={2} radius={2} tone="transparent" border>
                      <Stack space={1}>
                        <Text size={0} weight="semibold">ðŸ§µ Threads</Text>
                        <Text size={0} muted>â€¢ Max 500 Zeichen</Text>
                        <Text size={0} muted>â€¢ Max 10 Bilder</Text>
                        <Text size={0} muted>â€¢ Keine Videos in Carousels</Text>
                      </Stack>
                    </Card>
                  )}
                  {postState.selectedPlatforms.includes('twitter') && (
                    <Card padding={2} radius={2} tone="transparent" border>
                      <Stack space={1}>
                        <Text size={0} weight="semibold">ðŸ¦ Twitter/X</Text>
                        <Text size={0} muted>â€¢ Max 280 Zeichen</Text>
                        <Text size={0} muted>â€¢ Max 4 Medien</Text>
                        <Text size={0} muted>â€¢ 2-3 Hashtags empfohlen</Text>
                      </Stack>
                    </Card>
                  )}
                </Grid>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        {/* Draft Save Dialog */}
        {showDraftDialog && (
          <Dialog
            header="Draft speichern"
            id="draft-save-dialog"
            onClose={() => setShowDraftDialog(false)}
            width={1}
          >
            <Box padding={4}>
              <Stack space={4}>
                <Stack space={2}>
                  <Label>Draft Titel *</Label>
                  <TextInput
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.currentTarget.value)}
                    placeholder="z.B. Konzert-AnkÃ¼ndigung Berlin"
                    fontSize={2}
                  />
                </Stack>

                <Stack space={2}>
                  <Label>Notizen (optional)</Label>
                  <TextArea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.currentTarget.value)}
                    placeholder="Interne Notizen zu diesem Draft..."
                    rows={3}
                  />
                </Stack>

                <Flex align="center" gap={2}>
                  <Switch
                    checked={saveDraftAsTemplate}
                    onChange={(e) => setSaveDraftAsTemplate(e.currentTarget.checked)}
                  />
                  <Label>Als wiederverwendbares Template speichern</Label>
                </Flex>

                <Grid columns={2} gap={2}>
                  <Button
                    text="Abbrechen"
                    mode="ghost"
                    onClick={() => setShowDraftDialog(false)}
                  />
                  <Button
                    text="Speichern"
                    tone="primary"
                    onClick={handleSaveDraft}
                    disabled={!draftTitle.trim()}
                  />
                </Grid>
              </Stack>
            </Box>
          </Dialog>
        )}

        {/* Draft List Dialog */}
        {showDraftList && (
          <Dialog
            header="Gespeicherte Drafts"
            id="draft-list-dialog"
            onClose={() => setShowDraftList(false)}
            width={2}
          >
            <Box padding={4}>
              {loadingDrafts ? (
                <Flex align="center" justify="center" padding={5}>
                  <Spinner />
                </Flex>
              ) : drafts.length === 0 ? (
                <Card padding={5} radius={2} tone="transparent">
                  <Stack space={3} style={{ textAlign: 'center' }}>
                    <Text size={3}>ðŸ“</Text>
                    <Heading size={1}>Keine Drafts</Heading>
                    <Text muted>Speichere deinen ersten Draft!</Text>
                  </Stack>
                </Card>
              ) : (
                <Stack space={3}>
                  {drafts.map((draft) => (
                    <Card key={draft._id} padding={3} radius={2} shadow={1}>
                      <Stack space={2}>
                        <Flex align="center" justify="space-between">
                          <Flex align="center" gap={2}>
                            {draft.isTemplate && <Text>ðŸ“‹</Text>}
                            <Heading size={0}>{draft.title}</Heading>
                          </Flex>
                          <Flex gap={1}>
                            <Button
                              icon={DocumentsIcon}
                              mode="ghost"
                              tone="primary"
                              text="Laden"
                              onClick={() => handleLoadDraft(draft)}
                              fontSize={0}
                            />
                            <Button
                              icon={TrashIcon}
                              mode="ghost"
                              tone="critical"
                              onClick={() => handleDeleteDraft(draft._id)}
                              fontSize={0}
                            />
                          </Flex>
                        </Flex>

                        <Text size={0} muted style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {draft.content?.substring(0, 100) || 'Kein Text'}...
                        </Text>

                        <Flex gap={1} wrap="wrap">
                          {draft.platforms?.map((p: string) => (
                            <Badge key={p} tone="primary" fontSize={0}>
                              {p}
                            </Badge>
                          ))}
                          {draft.mediaUrls?.length > 0 && (
                            <Badge tone="positive" fontSize={0}>
                              {draft.mediaUrls.length} ðŸ–¼ï¸
                            </Badge>
                          )}
                        </Flex>

                        <Text size={0} muted>
                          {new Date(draft._createdAt).toLocaleString('de-DE')}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Dialog>
        )}
      </Stack>
    </Container>
  )
}

// ============================================
// CSV IMPORT TAB
// ============================================

interface CSVDraft {
  scheduledDate: string
  scheduledTime: string
  platform: string
  postType: string
  instagramFormat?: InstagramFormat // Instagram format for feed/carousel
  content: string
  hashtags?: string
  photographer?: string
  firstComment?: string // NEW: First comment for post
  status: 'draft'
  needsImage: boolean
  originalLine: number
  // Multiple images support for carousels
  images?: Array<{
    url: string // Sanity asset URL
    positionX?: number // Horizontal position in % (0-100), default 50
    positionY?: number // Vertical position in % (0-100), default 50
    zoom?: number // Zoom level (1 = 100%, 1.5 = 150%), default 1
    photographer?: string // Optional per-image photographer credit
    altText?: string // Optional alt text for accessibility
  }>
  // Legacy single image support (for backwards compatibility)
  imageUrl?: string
  imagePosition?: 'top' | 'bottom'
  imagePositionX?: number
  imagePositionY?: number
  imageZoom?: number
}

interface CSVImportResult {
  success: boolean
  imported: number
  errors: number
  drafts: CSVDraft[]
  errorDetails: Array<{ line: number; error: string; record: Record<string, string> }>
  summary: {
    totalLines: number
    validLines: number
    invalidLines: number
    platforms: string[]
    dateRange: { from: string; to: string } | null
  }
  message: string
}

interface CSVImportTabProps {
  onDraftsImported: (drafts: CSVDraft[]) => void
  onSwitchToBatchImages: () => void
}

function CSVImportTab({ onDraftsImported, onSwitchToBatchImages }: CSVImportTabProps) {
  const toast = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Bitte wÃ¤hle eine CSV-Datei aus',
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/social-media/csv-import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setImportResult(result)

      if (result.success) {
        // Save drafts to parent component
        if (result.drafts && result.drafts.length > 0) {
          onDraftsImported(result.drafts)
        }
        
        toast.push({
          status: 'success',
          title: 'âœ… Import erfolgreich!',
          description: `${result.imported} Posts als Drafts erstellt`,
          duration: 5000,
        })
      } else if (result.errors > 0) {
        // Still save valid drafts even if there were errors
        if (result.drafts && result.drafts.length > 0) {
          onDraftsImported(result.drafts)
        }
        
        toast.push({
          status: 'warning',
          title: 'âš ï¸ Import mit Fehlern',
          description: `${result.imported} Posts erstellt, ${result.errors} Fehler`,
          duration: 5000,
        })
      }
    } catch (error) {
      console.error('[CSV Import] Error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'CSV-Import fehlgeschlagen',
      })
      setImportResult(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    window.open('/api/social-media/csv-import/template', '_blank')
  }

  return (
    <Container width={3} padding={4}>
      <Stack space={5}>
        {/* Header */}
        <Card padding={4} radius={2} shadow={1} tone="primary">
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Text size={4}>ðŸ“Š</Text>
              <Heading size={2}>CSV Bulk-Import</Heading>
            </Flex>
            <Text size={1} muted>
              Importiere mehrere Social Media Posts auf einmal. Alle Posts werden als <strong>Drafts</strong> erstellt.
              <br />
              Bilder mÃ¼ssen danach Ã¼ber <strong>"Batch Images"</strong> Tab hochgeladen werden.
            </Text>
          </Stack>
        </Card>

        {/* CSV Format Info */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Text size={2}>ðŸ“</Text>
              <Text size={1} weight="semibold">
                CSV-Format
              </Text>
            </Flex>
            <Card padding={3} radius={2} tone="transparent" border style={{ fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto' }}>
              <pre style={{ margin: 0 }}>
{`date,time,platform,post_type,content,hashtags,photographer
2026-01-20,10:00,instagram,feed,"ðŸŽ¸ Post text here","#YourBrand",Example User`}
              </pre>
            </Card>
            <Grid columns={[1, 2]} gap={2}>
              <Card padding={2} radius={2} tone="transparent" border>
                <Stack space={1}>
                  <Text size={0} weight="semibold">âœ… Pflichtfelder:</Text>
                  <Text size={0} muted>â€¢ date (YYYY-MM-DD)</Text>
                  <Text size={0} muted>â€¢ time (HH:MM)</Text>
                  <Text size={0} muted>â€¢ platform (instagram/facebook/threads/twitter)</Text>
                  <Text size={0} muted>â€¢ post_type (feed/story/reel/carousel)</Text>
                  <Text size={0} muted>â€¢ content (Post-Text)</Text>
                </Stack>
              </Card>
              <Card padding={2} radius={2} tone="transparent" border>
                <Stack space={1}>
                  <Text size={0} weight="semibold">âŒ Optional:</Text>
                  <Text size={0} muted>â€¢ hashtags</Text>
                  <Text size={0} muted>â€¢ photographer</Text>
                </Stack>
              </Card>
            </Grid>
            <Button
              icon={DownloadIcon}
              text="Template herunterladen"
              onClick={handleDownloadTemplate}
              mode="ghost"
              tone="primary"
            />
          </Stack>
        </Card>

        {/* File Upload */}
        <Card padding={4} radius={2} shadow={1}>
          <Stack space={4}>
            <Flex align="center" gap={2}>
              <Text size={2}>ðŸ“¤</Text>
              <Text size={1} weight="semibold">
                CSV-Datei hochladen
              </Text>
            </Flex>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Flex gap={2} align="center">
              <Button
                icon={UploadIcon}
                text="Datei auswÃ¤hlen"
                onClick={() => fileInputRef.current?.click()}
                mode="ghost"
              />
              {selectedFile && (
                <Text size={1} muted>
                  {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </Text>
              )}
            </Flex>

            {selectedFile && (
              <Button
                icon={RocketIcon}
                text={isUploading ? 'Importiere...' : 'Importieren'}
                onClick={handleUpload}
                disabled={isUploading}
                tone="primary"
              />
            )}

            {isUploading && (
              <Flex justify="center" padding={3}>
                <Spinner muted />
              </Flex>
            )}
          </Stack>
        </Card>

        {/* Import Result */}
        {importResult && (
          <Card padding={4} radius={2} shadow={1} tone={importResult.success ? 'positive' : 'caution'}>
            <Stack space={4}>
              <Flex align="center" gap={2}>
                <Text size={2}>{importResult.success ? 'âœ…' : 'âš ï¸'}</Text>
                <Heading size={1}>{importResult.message}</Heading>
              </Flex>

              <Grid columns={[2, 4]} gap={3}>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={1}>
                    <Text size={0} muted>Gesamt</Text>
                    <Text size={2} weight="bold">{importResult.summary?.totalLines || 0}</Text>
                  </Stack>
                </Card>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={1}>
                    <Text size={0} muted>Importiert</Text>
                    <Text size={2} weight="bold" style={{ color: 'green' }}>{importResult.imported || 0}</Text>
                  </Stack>
                </Card>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={1}>
                    <Text size={0} muted>Fehler</Text>
                    <Text size={2} weight="bold" style={{ color: 'red' }}>{importResult.errors || 0}</Text>
                  </Stack>
                </Card>
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={1}>
                    <Text size={0} muted>Plattformen</Text>
                    <Text size={0}>{importResult.summary?.platforms?.join(', ') || 'N/A'}</Text>
                  </Stack>
                </Card>
              </Grid>

              {importResult.summary?.dateRange && (
                <Card padding={3} radius={2} tone="transparent" border>
                  <Stack space={1}>
                    <Text size={0} weight="semibold">ðŸ“… Zeitraum:</Text>
                    <Text size={1}>
                      {new Date(importResult.summary.dateRange.from).toLocaleDateString('de-DE')} bis{' '}
                      {new Date(importResult.summary.dateRange.to).toLocaleDateString('de-DE')}
                    </Text>
                  </Stack>
                </Card>
              )}

              {importResult.errors > 0 && importResult.errorDetails && (
                <Card padding={3} radius={2} tone="critical">
                  <Stack space={2}>
                    <Text size={1} weight="semibold">ðŸš¨ Fehler-Details:</Text>
                    <Stack space={1}>
                      {importResult.errorDetails.slice(0, 5).map((err, i) => (
                        <Text key={i} size={0} style={{ fontFamily: 'monospace' }}>
                          Zeile {err.line}: {err.error}
                        </Text>
                      ))}
                      {importResult.errorDetails.length > 5 && (
                        <Text size={0} muted>
                          ... und {importResult.errorDetails.length - 5} weitere Fehler
                        </Text>
                      )}
                    </Stack>
                  </Stack>
                </Card>
              )}

              {importResult.imported > 0 && (
                <Card padding={3} radius={2} tone="positive" border>
                  <Stack space={3}>
                    <Text size={1} weight="semibold">âœ¨ NÃ¤chste Schritte:</Text>
                    <Text size={0}>
                      1. Gehe zum <strong>"Batch Images"</strong> Tab
                      <br />
                      2. Lade Bilder fÃ¼r deine {importResult.imported} Drafts hoch
                      <br />
                      3. Review und Publish im <strong>"Kalender"</strong> Tab
                    </Text>
                    <Button
                      icon={ImagesIcon}
                      text="Zu Batch Images"
                      onClick={onSwitchToBatchImages}
                      tone="primary"
                    />
                  </Stack>
                </Card>
              )}
            </Stack>
          </Card>
        )}

        {/* Documentation Link */}
        <Card padding={4} radius={2} shadow={1} tone="transparent">
          <Stack space={2}>
            <Text size={1} weight="semibold">ðŸ“š Dokumentation</Text>
            <Text size={0} muted>
              Detaillierte Anleitung, Beispiele und Best Practices findest du in der{' '}
              <code>CSV_IMPORT_DOCUMENTATION.md</code>
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

// ============================================
// BATCH IMAGES TAB - Image Upload Component
// ============================================

// Helper: Crop image for posting based on platform, post type, format and user settings
async function cropImageForPosting(
  imageUrl: string,
  platform: string,
  postType: string,
  positionX: number,
  positionY: number,
  zoom: number,
  instagramFormat?: 'square' | 'portrait' | 'landscape' // NEW: Instagram format parameter
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Platform-specific aspect ratios
      const targetRatios: Record<string, Record<string, { width: number; height: number }>> = {
        instagram: {
          feed: { width: 1080, height: 1350 }, // Default portrait for feed
          story: { width: 1080, height: 1920 },
          reel: { width: 1080, height: 1920 },
          carousel: { width: 1080, height: 1350 }, // Default portrait for carousel
        },
        facebook: {
          feed: { width: 1080, height: 1350 },
          story: { width: 1080, height: 1920 },
        },
        twitter: {
          feed: { width: 1080, height: 1350 },
        },
        threads: {
          feed: { width: 1080, height: 1350 },
        },
      }

      const platformRatios = targetRatios[platform] || targetRatios.instagram
      let target = platformRatios[postType] || platformRatios.feed
      
      // Override target dimensions for Instagram feed/carousel if format is specified
      if (platform === 'instagram' && (postType === 'feed' || postType === 'carousel') && instagramFormat) {
        switch (instagramFormat) {
          case 'square':
            target = { width: 1080, height: 1080 }
            break
          case 'portrait':
            target = { width: 1080, height: 1350 }
            break
          case 'landscape':
            target = { width: 1080, height: 566 }
            break
        }
      }
      
      // Create canvas
      const canvas = document.createElement('canvas')
      canvas.width = target.width
      canvas.height = target.height
      const ctx = canvas.getContext('2d')!

      // Calculate source dimensions with zoom
      const targetRatio = target.width / target.height
      let sourceWidth = img.width / zoom
      let sourceHeight = img.height / zoom

      // Adjust source to match target aspect ratio
      const sourceRatio = sourceWidth / sourceHeight
      if (sourceRatio > targetRatio) {
        sourceWidth = sourceHeight * targetRatio
      } else {
        sourceHeight = sourceWidth / targetRatio
      }

      // Calculate source position based on user's position settings
      // positionX/Y are in % (0-100) where 50 = center
      // We need to map this to the available movement range
      const maxX = img.width - sourceWidth
      const maxY = img.height - sourceHeight
      
      // Convert percentage to actual position
      // 0% = left/top edge, 50% = center, 100% = right/bottom edge
      const sourceX = (maxX * positionX) / 100
      const sourceY = (maxY * positionY) / 100

      // Draw image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        target.width,
        target.height
      )

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/jpeg',
        0.92
      )
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

interface BatchImagesTabProps {
  drafts: CSVDraft[]
  onDraftUpdate: (index: number, updates: Partial<CSVDraft>) => void
  onDraftDelete: (index: number) => void
}

function BatchImagesTab({ drafts, onDraftUpdate, onDraftDelete }: BatchImagesTabProps) {
  const toast = useToast()
  const client = useClient({ apiVersion: '2024-01-01' })
  const [showOnlyWithoutImages, setShowOnlyWithoutImages] = useState(true)
  const [uploadingFor, setUploadingFor] = useState<number | null>(null)
  const [editingDraft, setEditingDraft] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<CSVDraft>>({})
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0) // For multi-image editing
  const [apiSettings, setApiSettings] = useState<{
    apiKey: string | null
    profileId: string | null
    accounts: SocialMediaAccount[]
  }>({
    apiKey: null,
    profileId: null,
    accounts: [],
  })

  // Load API settings - EXACTLY like in Posting Tab
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await client.fetch<{
          apiKey: string
          profileId: string
          connectedAccounts: SocialMediaAccount[]
        } | null>(
          `*[_type == "lateApiSettings"][0] {
            apiKey,
            profileId,
            connectedAccounts
          }`
        )

        if (settings) {
          setApiSettings({
            apiKey: settings.apiKey,
            profileId: settings.profileId,
            accounts: settings.connectedAccounts || [],
          })
          
          console.log('[Batch Images] Loaded settings:', {
            hasApiKey: !!settings.apiKey,
            accountCount: settings.connectedAccounts?.length || 0,
            accounts: settings.connectedAccounts?.map(a => ({ 
              platform: a.platform, 
              username: a.username,
              accountId: a.accountId,
              isActive: a.isActive 
            }))
          })
        }
      } catch (error) {
        console.error('[Batch Images] Failed to load API settings:', error)
      }
    }
    loadSettings()
  }, [client])

  // Helper: Crop/resize image for Instagram
  const processImageForInstagram = async (file: File, platform: string, postType: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        // Platform-specific aspect ratios
        const targetRatios: Record<string, Record<string, { width: number; height: number }>> = {
          instagram: {
            feed: { width: 1080, height: 1350 },    // 4:5 portrait
            story: { width: 1080, height: 1920 },   // 9:16 story
            reel: { width: 1080, height: 1920 },    // 9:16 reel
            carousel: { width: 1080, height: 1350 }, // 4:5 carousel
          },
          facebook: {
            feed: { width: 1080, height: 1350 },    // 4:5 portrait
            story: { width: 1080, height: 1920 },   // 9:16 story
          },
          twitter: {
            feed: { width: 1080, height: 1350 },    // 4:5 portrait
          },
          threads: {
            feed: { width: 1080, height: 1350 },    // 4:5 portrait
          },
        }

        const platformRatios = targetRatios[platform] || targetRatios.instagram
        const target = platformRatios[postType as keyof typeof platformRatios] || platformRatios.feed

        // Create canvas with target dimensions
        const canvas = document.createElement('canvas')
        canvas.width = target.width
        canvas.height = target.height
        const ctx = canvas.getContext('2d')!

        // Calculate crop to fill canvas (cover mode)
        const imgRatio = img.width / img.height
        const targetRatio = target.width / target.height

        let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height

        if (imgRatio > targetRatio) {
          // Image is wider - crop sides
          sourceWidth = img.height * targetRatio
          sourceX = (img.width - sourceWidth) / 2
        } else {
          // Image is taller - crop top/bottom
          sourceHeight = img.width / targetRatio
          sourceY = (img.height - sourceHeight) / 2
        }

        // Draw cropped image
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, target.width, target.height
        )

        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], file.name, { type: 'image/jpeg' })
            resolve(croppedFile)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, 'image/jpeg', 0.92)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageUpload = async (draftIndex: number, files: FileList | File) => {
    setUploadingFor(draftIndex)

    try {
      const draft = drafts[draftIndex]
      const fileArray = files instanceof FileList ? Array.from(files) : [files]
      
      // Platform limits for images
      const platformLimits: Record<string, number> = {
        instagram: 10,
        facebook: 10,
        twitter: 4,
        threads: 10, // Assuming same as Instagram
      }
      
      const limit = platformLimits[draft.platform.toLowerCase()] || 10
      const currentCount = draft.images?.length || 0
      
      // Check if adding new images would exceed limit
      if (currentCount + fileArray.length > limit) {
        toast.push({
          status: 'warning',
          title: 'Zu viele Bilder',
          description: `${draft.platform} erlaubt max. ${limit} Bilder pro Post. Du hast bereits ${currentCount} Bild(er).`,
        })
        setUploadingFor(null)
        return
      }

      // Upload ALL images to Sanity (no cropping yet)
      const uploadedImages = await Promise.all(
        fileArray.map(async (file) => {
          const asset = await client.assets.upload('image', file, {
            filename: file.name,
          })
          return {
            url: asset.url,
            positionX: 50, // Default center
            positionY: 50, // Default center
            zoom: 1,       // Default zoom
          }
        })
      )

      // Merge with existing images
      const existingImages = draft.images || []
      const newImages = [...existingImages, ...uploadedImages]

      onDraftUpdate(draftIndex, { 
        needsImage: false,
        images: newImages,
      })

      toast.push({
        status: 'success',
        title: `âœ… ${uploadedImages.length} Bild(er) hochgeladen!`,
        description: newImages.length > 1 
          ? `Karussell mit ${newImages.length} Bildern erstellt` 
          : 'Du kannst den Ausschnitt jetzt im Editor anpassen',
      })
      setUploadingFor(null)
    } catch (error) {
      console.error('[Batch Images] Upload error:', error)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Bilder konnten nicht hochgeladen werden',
      })
      setUploadingFor(null)
    }
  }

  // Delete single image from draft
  const handleDeleteImage = (draftIndex: number, imageIndex: number) => {
    const draft = drafts[draftIndex]
    const updatedImages = [...(draft.images || [])]
    updatedImages.splice(imageIndex, 1)
    
    onDraftUpdate(draftIndex, {
      images: updatedImages.length > 0 ? updatedImages : [],
      needsImage: updatedImages.length === 0,
    })
    
    toast.push({
      status: 'info',
      title: 'Bild gelÃ¶scht',
      description: updatedImages.length > 0 
        ? `Noch ${updatedImages.length} Bild(er) Ã¼brig` 
        : 'Alle Bilder entfernt',
    })
  }

  // Move image in draft (for drag & drop reordering)
  const handleMoveImage = (draftIndex: number, fromIndex: number, toIndex: number) => {
    const draft = drafts[draftIndex]
    const updatedImages = [...(draft.images || [])]
    const [movedImage] = updatedImages.splice(fromIndex, 1)
    updatedImages.splice(toIndex, 0, movedImage)
    
    onDraftUpdate(draftIndex, {
      images: updatedImages,
    })
  }

  const handleEditDraft = (index: number) => {
    setEditingDraft(index)
    setEditForm({
      ...drafts[index],
      imagePositionX: drafts[index].imagePositionX || 50,
      imagePositionY: drafts[index].imagePositionY || 50,
      imageZoom: drafts[index].imageZoom || 1,
    })
  }

  const handleSaveEdit = () => {
    if (editingDraft !== null) {
      onDraftUpdate(editingDraft, editForm)
      setEditingDraft(null)
      setEditForm({})
      toast.push({
        status: 'success',
        title: 'âœ… Draft gespeichert!',
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingDraft(null)
    setEditForm({})
  }

  const filteredDrafts = showOnlyWithoutImages
    ? drafts.filter((d) => d.needsImage)
    : drafts

  // Statistics
  const stats = {
    total: drafts.length,
    withImages: drafts.filter(d => (d.images && d.images.length > 0) || d.imageUrl).length,
    needsImages: drafts.filter(d => d.needsImage).length,
  }

  return (
    <Container width={3} padding={4}>
      <Stack space={5}>
        {/* Header */}
        <Card padding={4} radius={2} shadow={1} tone="primary">
          <Stack space={3}>
            <Flex align="center" gap={2}>
              <Text size={4}>ðŸ–¼ï¸</Text>
              <Heading size={2}>Batch Image Upload</Heading>
            </Flex>
            <Text size={1} muted>
              FÃ¼ge Bilder zu deinen importierten Draft-Posts hinzu. Du kannst Bilder einzeln oder in Bulk hochladen.
            </Text>
          </Stack>
        </Card>

        {/* Statistics Overview */}
        {drafts.length > 0 && (
          <Card padding={4} radius={2} shadow={1}>
            <Stack space={3}>
              <Text size={1} weight="semibold">ðŸ“Š Ãœbersicht</Text>
              <Grid columns={[2, 3, 3]} gap={2}>
                <Card padding={3} radius={2} tone="default" border style={{ textAlign: 'center' }}>
                  <Stack space={1}>
                    <Text size={2} weight="bold">{stats.total}</Text>
                    <Text size={0} muted>Gesamt</Text>
                  </Stack>
                </Card>
                <Card padding={3} radius={2} tone="positive" border style={{ textAlign: 'center' }}>
                  <Stack space={1}>
                    <Text size={2} weight="bold" style={{ color: 'var(--card-positive-fg-color)' }}>
                      {stats.withImages}
                    </Text>
                    <Text size={0} muted>Mit Bild âœ“</Text>
                  </Stack>
                </Card>
                <Card padding={3} radius={2} tone="caution" border style={{ textAlign: 'center' }}>
                  <Stack space={1}>
                    <Text size={2} weight="bold" style={{ color: 'var(--card-caution-fg-color)' }}>
                      {stats.needsImages}
                    </Text>
                    <Text size={0} muted>Fehlt Bild âš ï¸</Text>
                  </Stack>
                </Card>
              </Grid>
            </Stack>
          </Card>
        )}

        {/* Filter */}
        <Card padding={4} radius={2} shadow={1}>
          <Flex align="center" gap={3}>
            <Text size={1} weight="semibold">
              Filter:
            </Text>
            <Flex align="center" gap={2}>
              <Switch
                checked={showOnlyWithoutImages}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShowOnlyWithoutImages(e.target.checked)}
              />
              <Text size={1}>Nur Posts ohne Bilder anzeigen</Text>
            </Flex>
            <Badge tone={showOnlyWithoutImages ? 'caution' : 'default'}>
              {filteredDrafts.length} Posts
            </Badge>
          </Flex>
        </Card>

        {/* Tips */}
        <Card padding={4} radius={2} shadow={1} tone="transparent">
          <Stack space={3}>
            <Text size={1} weight="semibold">ðŸ’¡ Quick-Tipps:</Text>
            <Grid columns={[1, 2]} gap={2}>
              <Card padding={2} radius={2} tone="transparent" border>
                <Text size={0}>
                  <strong>ðŸ“ Dateinamen-Matching:</strong>
                  <br />
                  Benenne Bilder nach Datum (z.B. <code>2026-01-20.jpg</code>) fÃ¼r Auto-Zuordnung
                </Text>
              </Card>
              <Card padding={2} radius={2} tone="transparent" border>
                <Text size={0}>
                  <strong>ðŸŽ¨ BildgrÃ¶ÃŸe:</strong>
                  <br />
                  Empfohlen: 1080x1440px (wird automatisch angepasst)
                </Text>
              </Card>
            </Grid>
          </Stack>
        </Card>

        {/* Drafts List - IMPROVED DESIGN */}
        {filteredDrafts.length === 0 ? (
          <Card padding={5} radius={2} shadow={1} tone="transparent">
            <Stack space={3}>
              <Text size={4} align="center">ðŸŽ‰</Text>
              <Text size={2} weight="semibold" align="center">
                {showOnlyWithoutImages
                  ? 'Alle Posts haben Bilder!'
                  : 'Keine Draft-Posts vorhanden'}
              </Text>
              <Text size={1} muted align="center">
                {showOnlyWithoutImages
                  ? 'Super! Alle deine importierten Posts haben bereits Bilder zugewiesen.'
                  : 'Importiere zuerst Posts Ã¼ber den "CSV Import" Tab.'}
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack space={3}>
            {/* Drafts Items */}
            {filteredDrafts.map((draft) => {
              const actualIndex = drafts.indexOf(draft)
              const isUploading = uploadingFor === actualIndex
              
              return (
                <Card 
                  key={actualIndex} 
                  padding={4} 
                  radius={2} 
                  shadow={1} 
                  border
                  tone={draft.needsImage ? 'caution' : 'default'}
                  style={{
                    borderLeft: draft.needsImage ? '4px solid var(--card-caution-fg-color)' : '4px solid var(--card-positive-fg-color)',
                  }}
                >
                  <Flex gap={4} align="flex-start">
                    {/* Image Preview - Enhanced Multiple Images Support with Delete, Navigation & Reordering */}
                    <Box style={{ flexShrink: 0 }}>
                      {(!draft.images || draft.images.length === 0) && !draft.imageUrl ? (
                        <Card 
                          padding={3} 
                          radius={2} 
                          tone="transparent" 
                          border
                          style={{ 
                            height: '100px',
                            width: '100px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--card-bg2-color)',
                          }}
                        >
                          <Text size={3}>ðŸ“·</Text>
                          <Text size={0} muted align="center">Kein Bild</Text>
                        </Card>
                      ) : (
                        <Stack space={2} style={{ maxWidth: '220px' }}>
                          {/* Main Preview Image with Navigation */}
                          {draft.images && draft.images.length > 0 && (
                            <Box>
                              <Box
                                style={{
                                  position: 'relative',
                                  width: '200px',
                                  height: '200px',
                                  overflow: 'hidden',
                                  borderRadius: '8px',
                                  border: '3px solid var(--card-positive-fg-color)',
                                  background: '#000',
                                }}
                              >
                                <img 
                                  src={draft.images[selectedImageIndex]?.url || draft.images[0].url} 
                                  alt={`Preview ${selectedImageIndex + 1}`}
                                  style={{ 
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                                
                                {/* Image Counter Badge */}
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.7)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: '12px',
                                    padding: '4px 10px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                  }}
                                >
                                  <Text size={1} weight="bold" style={{ color: '#fff' }}>
                                    {selectedImageIndex + 1} / {draft.images.length}
                                  </Text>
                                </Box>

                                {/* Navigation Arrows (only if multiple images) */}
                                {draft.images.length > 1 && (
                                  <>
                                    <Button
                                      icon={ChevronLeftIcon}
                                      mode="ghost"
                                      tone="default"
                                      onClick={() => {
                                        setSelectedImageIndex((prev) => 
                                          prev === 0 ? draft.images!.length - 1 : prev - 1
                                        )
                                      }}
                                      style={{
                                        position: 'absolute',
                                        left: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.6)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        minWidth: '36px',
                                        padding: 0,
                                      }}
                                    />
                                    <Button
                                      icon={ChevronRightIcon}
                                      mode="ghost"
                                      tone="default"
                                      onClick={() => {
                                        setSelectedImageIndex((prev) => 
                                          prev === draft.images!.length - 1 ? 0 : prev + 1
                                        )
                                      }}
                                      style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.6)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        minWidth: '36px',
                                        padding: 0,
                                      }}
                                    />
                                  </>
                                )}

                                {/* Delete Current Image Button */}
                                <Button
                                  icon={TrashIcon}
                                  mode="ghost"
                                  tone="critical"
                                  onClick={() => {
                                    if (confirm(`Bild ${selectedImageIndex + 1} wirklich lÃ¶schen?`)) {
                                      handleDeleteImage(actualIndex, selectedImageIndex)
                                      // Reset to first image if current is deleted
                                      if (selectedImageIndex >= (draft.images!.length - 1)) {
                                        setSelectedImageIndex(0)
                                      }
                                    }
                                  }}
                                  style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    right: '8px',
                                    background: 'rgba(239,68,68,0.9)',
                                    backdropFilter: 'blur(4px)',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                  }}
                                  title="Dieses Bild lÃ¶schen"
                                />
                              </Box>

                              {/* Thumbnail Strip for Reordering (Drag & Drop) */}
                              {draft.images.length > 1 && (
                                <Box>
                                  <Text size={0} muted style={{ marginBottom: '6px' }}>
                                    Reihenfolge Ã¤ndern (Drag & Drop):
                                  </Text>
                                  <Flex gap={1} wrap="wrap">
                                    {draft.images.map((img, idx) => (
                                      <Box
                                        key={idx}
                                        draggable
                                        onDragStart={(e) => {
                                          e.dataTransfer.effectAllowed = 'move'
                                          e.dataTransfer.setData('imageIndex', idx.toString())
                                          e.dataTransfer.setData('draftIndex', actualIndex.toString())
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault()
                                          e.dataTransfer.dropEffect = 'move'
                                        }}
                                        onDrop={(e) => {
                                          e.preventDefault()
                                          const fromIndex = parseInt(e.dataTransfer.getData('imageIndex'))
                                          const fromDraft = parseInt(e.dataTransfer.getData('draftIndex'))
                                          
                                          // Only allow reordering within same draft
                                          if (fromDraft === actualIndex && fromIndex !== idx) {
                                            handleMoveImage(actualIndex, fromIndex, idx)
                                            // Update selected index if needed
                                            if (selectedImageIndex === fromIndex) {
                                              setSelectedImageIndex(idx)
                                            } else if (selectedImageIndex === idx) {
                                              setSelectedImageIndex(fromIndex)
                                            }
                                          }
                                        }}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        style={{
                                          position: 'relative',
                                          width: '42px',
                                          height: '42px',
                                          overflow: 'hidden',
                                          borderRadius: '6px',
                                          border: selectedImageIndex === idx 
                                            ? '3px solid var(--card-positive-fg-color)' 
                                            : '2px solid var(--card-border-color)',
                                          cursor: 'grab',
                                          opacity: selectedImageIndex === idx ? 1 : 0.6,
                                          transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.opacity = '1'
                                          e.currentTarget.style.transform = 'scale(1.05)'
                                        }}
                                        onMouseLeave={(e) => {
                                          if (selectedImageIndex !== idx) {
                                            e.currentTarget.style.opacity = '0.6'
                                          }
                                          e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                      >
                                        <img 
                                          src={img.url} 
                                          alt={`Thumbnail ${idx + 1}`}
                                          style={{ 
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            pointerEvents: 'none',
                                          }}
                                        />
                                        {/* Position Number Badge */}
                                        <Box
                                          style={{
                                            position: 'absolute',
                                            top: '2px',
                                            left: '2px',
                                            background: selectedImageIndex === idx ? '#10b981' : 'rgba(0,0,0,0.6)',
                                            borderRadius: '50%',
                                            width: '16px',
                                            height: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                            pointerEvents: 'none',
                                          }}
                                        >
                                          <Text size={0} weight="bold" style={{ color: '#fff', fontSize: '10px' }}>
                                            {idx + 1}
                                          </Text>
                                        </Box>
                                      </Box>
                                    ))}
                                  </Flex>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Legacy single image support */}
                          {!draft.images && draft.imageUrl && (
                            <Box
                              style={{
                                position: 'relative',
                                width: '100px',
                                height: '100px',
                                overflow: 'hidden',
                                borderRadius: '4px',
                                border: '2px solid var(--card-positive-fg-color)',
                              }}
                            >
                              <img 
                                src={draft.imageUrl} 
                                alt="Draft preview"
                                style={{ 
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <Box
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: '#10b981',
                                  borderRadius: '50%',
                                  width: '24px',
                                  height: '24px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                }}
                              >
                                <Text size={1} weight="bold" style={{ color: '#fff' }}>âœ“</Text>
                              </Box>
                            </Box>
                          )}
                        </Stack>
                      )}
                    </Box>

                    {/* Content Area - Takes remaining space */}
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Stack space={3}>
                        {/* Top Row: Badges & Meta */}
                        <Flex align="center" gap={2} wrap="wrap">
                          {draft.platform === 'instagram' && <Badge tone="primary" fontSize={1}>ðŸ“¸ Instagram</Badge>}
                          {draft.platform === 'facebook' && <Badge tone="positive" fontSize={1}>ðŸ‘¥ Facebook</Badge>}
                          {draft.platform === 'threads' && <Badge tone="caution" fontSize={1}>ðŸ§µ Threads</Badge>}
                          {draft.platform === 'twitter' && <Badge tone="default" fontSize={1}>ðŸ¦ Twitter</Badge>}
                          
                          <Badge tone="default" fontSize={0}>{draft.postType}</Badge>
                          
                          {/* Instagram Format Badge (fÃ¼r Feed & Carousel) */}
                          {draft.platform === 'instagram' && (draft.postType === 'feed' || draft.postType === 'carousel') && draft.instagramFormat && (
                            <Badge tone="positive" fontSize={0}>
                              ðŸ“ {draft.instagramFormat === 'square' ? '1:1' : draft.instagramFormat === 'portrait' ? '4:5' : '1.91:1'}
                            </Badge>
                          )}
                          
                          {draft.needsImage && (
                            <Badge tone="critical" fontSize={0}>âš ï¸ Bild fehlt</Badge>
                          )}
                          
                          <Text size={0} muted>
                            CSV Zeile {draft.originalLine}
                          </Text>
                        </Flex>

                        {/* Schedule Info */}
                        <Flex align="center" gap={3}>
                          <Flex align="center" gap={2}>
                            <Text size={2}>ðŸ“…</Text>
                            <Text size={1} weight="semibold">
                              {new Date(draft.scheduledDate).toLocaleDateString('de-DE', { 
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </Text>
                          </Flex>
                          <Flex align="center" gap={2}>
                            <Text size={2}>ðŸ•</Text>
                            <Text size={1} weight="semibold">
                              {draft.scheduledTime}
                            </Text>
                          </Flex>
                        </Flex>

                        {/* Content Text - Full width, wraps nicely */}
                        <Text 
                          size={1} 
                          style={{ 
                            lineHeight: '1.5',
                            wordBreak: 'break-word',
                          }}
                        >
                          {draft.content.length > 200 ? draft.content.substring(0, 200) + '...' : draft.content}
                        </Text>

                        {/* Hashtags */}
                        {draft.hashtags && (
                          <Text size={1} muted style={{ 
                            wordBreak: 'break-word',
                          }}>
                            {draft.hashtags}
                          </Text>
                        )}
                      </Stack>
                    </Box>

                    {/* Actions Column */}
                    <Flex direction="column" gap={2} style={{ flexShrink: 0 }}>
                      <Button
                        icon={UploadIcon}
                        text={isUploading ? 'Upload...' : (draft.images && draft.images.length > 0 ? '+ Mehr Bilder' : 'Bild hochladen')}
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.multiple = true // Allow multiple file selection
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files && files.length > 0) {
                              handleImageUpload(actualIndex, files)
                            }
                          }
                          input.click()
                        }}
                        disabled={uploadingFor !== null}
                        tone={draft.needsImage ? 'primary' : 'positive'}
                        fontSize={1}
                        style={{ width: '150px' }}
                      />
                      
                      {/* Jetzt planen Button - only if image(s) exist */}
                      {((draft.images && draft.images.length > 0) || draft.imageUrl) && !draft.needsImage && (
                        <Button
                          icon={CalendarIcon}
                          text="Jetzt planen"
                          onClick={async () => {
                            try {
                              // Prepare content with photographer and hashtags
                              let finalContent = draft.content || ''
                              
                              if (draft.photographer) {
                                const photographerText = draft.photographer.startsWith('ðŸ“¸') 
                                  ? draft.photographer 
                                  : `ðŸ“¸ ${draft.photographer}`
                                finalContent += `\n\n${photographerText}`
                              }

                              if (draft.hashtags) {
                                const hashtags = draft.hashtags.split(/\s+/).map(tag => 
                                  tag.startsWith('#') ? tag : `#${tag}`
                                )
                                const platform = draft.platform || 'instagram'
                                const limitedHashtags = platform === 'twitter' ? hashtags.slice(0, 3) : hashtags
                                finalContent += `\n\n${limitedHashtags.join(' ')}`
                              }

                              const scheduledDateTime = `${draft.scheduledDate}T${draft.scheduledTime}`

                              // Crop image if needed
                              let mediaItems: Array<{ url: string; type: 'image' }> = []
                              
                              // Process images - support both single and multiple images
                              if (draft.images && draft.images.length > 0) {
                                // Multiple images (carousel)
                                mediaItems = await Promise.all(
                                  draft.images.map(async (img) => {
                                    // Crop if position/zoom is customized
                                    if (img.positionX !== 50 || img.positionY !== 50 || (img.zoom || 1) !== 1) {
                                      const croppedBlob = await cropImageForPosting(
                                        img.url,
                                        draft.platform,
                                        draft.postType,
                                        img.positionX || 50,
                                        img.positionY || 50,
                                        img.zoom || 1,
                                        draft.instagramFormat
                                      )
                                      
                                      const croppedAsset = await client.assets.upload('image', croppedBlob, {
                                        filename: `cropped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                                      })
                                      
                                      return { 
                                        url: croppedAsset.url, 
                                        type: 'image' as const,
                                        altText: img.altText
                                      }
                                    } else {
                                      // Use original if no customization
                                      return { 
                                        url: img.url, 
                                        type: 'image' as const,
                                        altText: img.altText
                                      }
                                    }
                                  })
                                )
                              } else if (draft.imageUrl) {
                                // Legacy single image support
                                if (draft.imagePositionX || draft.imagePositionY || draft.imageZoom !== 1) {
                                  const croppedBlob = await cropImageForPosting(
                                    draft.imageUrl,
                                    draft.platform,
                                    draft.postType,
                                    draft.imagePositionX || 50,
                                    draft.imagePositionY || 50,
                                    draft.imageZoom || 1,
                                    draft.instagramFormat
                                  )
                                  
                                  const croppedAsset = await client.assets.upload('image', croppedBlob, {
                                    filename: `cropped_${Date.now()}.jpg`,
                                  })
                                  
                                  mediaItems = [{ url: croppedAsset.url, type: 'image' }]
                                } else {
                                  mediaItems = [{ url: draft.imageUrl, type: 'image' }]
                                }
                              }

                              // Get account
                              const platform = draft.platform
                              const account = apiSettings.accounts.find(
                                (a) => a.platform === platform && a.isActive
                              )

                              if (!account?.accountId) {
                                throw new Error(`Kein aktiver ${platform} Account gefunden`)
                              }

                              const platformData: Record<string, unknown> = {
                                platform,
                                accountId: account.accountId,
                              }
                              
                              if (platform === 'instagram') {
                                platformData.postType = draft.postType || 'feed'
                              }

                              // Call Late API
                              const response = await fetch('/api/late/posts', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  content: finalContent,
                                  mediaItems,
                                  platforms: [platformData],
                                  publishNow: false,
                                  scheduledFor: scheduledDateTime,
                                  timezone: 'Europe/Berlin',
                                }),
                              })

                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}))
                                throw new Error(errorData.error || `API Error: ${response.statusText}`)
                              }

                              // Remove from drafts
                              onDraftDelete(actualIndex)

                              toast.push({
                                status: 'success',
                                title: 'ðŸŽ‰ Post geplant!',
                                description: `${platform} - ${new Date(draft.scheduledDate).toLocaleDateString('de-DE')} ${draft.scheduledTime}`,
                              })
                            } catch (error) {
                              console.error('[Batch Images] Schedule error:', error)
                              toast.push({
                                status: 'error',
                                title: 'âŒ Fehler beim Planen',
                                description: error instanceof Error ? error.message : 'Post konnte nicht geplant werden',
                              })
                            }
                          }}
                          tone="positive"
                          fontSize={1}
                          style={{ width: '150px' }}
                        />
                      )}
                      
                      <Button
                        icon={EyeOpenIcon}
                        text="Bearbeiten"
                        onClick={() => handleEditDraft(actualIndex)}
                        mode="ghost"
                        fontSize={1}
                        style={{ width: '150px' }}
                      />
                      <Button
                        icon={TrashIcon}
                        text="LÃ¶schen"
                        onClick={() => {
                          if (confirm('Draft wirklich lÃ¶schen?')) {
                            onDraftDelete(actualIndex)
                            toast.push({
                              status: 'success',
                              title: 'âœ… Draft gelÃ¶scht',
                            })
                          }
                        }}
                        mode="ghost"
                        tone="critical"
                        fontSize={1}
                        style={{ width: '150px' }}
                      />
                    </Flex>
                  </Flex>
                </Card>
              )
            })}
          </Stack>
        )}

        {/* Edit Dialog */}
        {editingDraft !== null && (
          <Dialog
            header="âœï¸ Draft bearbeiten"
            id="edit-draft-dialog"
            onClose={handleCancelEdit}
            width={2}
            zOffset={1000}
          >
            <Box padding={4}>
              <Stack space={4}>
                {/* Platform & Post Type */}
                <Grid columns={[1, 2]} gap={3}>
                  <Stack space={2}>
                    <Label size={1}>Plattform</Label>
                    <Card padding={3} radius={2} border>
                      <Flex gap={2} wrap="wrap">
                        {(['instagram', 'facebook', 'threads', 'twitter'] as const).map((platform) => (
                          <Button
                            key={platform}
                            text={platform === 'instagram' ? 'ðŸ“¸ Instagram' : platform === 'facebook' ? 'ðŸ‘¥ Facebook' : platform === 'threads' ? 'ðŸ§µ Threads' : 'ðŸ¦ Twitter'}
                            mode={editForm.platform === platform ? 'default' : 'ghost'}
                            tone={editForm.platform === platform ? 'primary' : 'default'}
                            onClick={() => setEditForm({ ...editForm, platform })}
                            fontSize={0}
                          />
                        ))}
                      </Flex>
                    </Card>
                  </Stack>

                  {/* Post-Type NUR fÃ¼r Instagram */}
                  {editForm.platform === 'instagram' && (
                    <Stack space={2}>
                      <Label size={1}>Post-Typ</Label>
                      <Card padding={3} radius={2} border>
                        <Flex gap={2} wrap="wrap">
                          {(['feed', 'story', 'reel', 'carousel'] as const).map((type) => (
                            <Button
                              key={type}
                              text={type === 'feed' ? 'ðŸ“° Feed' : type === 'story' ? 'ðŸ“– Story' : type === 'reel' ? 'ðŸŽ¬ Reel' : 'ðŸŽ  Carousel'}
                              mode={editForm.postType === type ? 'default' : 'ghost'}
                              tone={editForm.postType === type ? 'primary' : 'default'}
                              onClick={() => setEditForm({ ...editForm, postType: type })}
                              fontSize={0}
                            />
                          ))}
                        </Flex>
                      </Card>
                    </Stack>
                  )}
                  
                  {/* Instagram Format Selector (nur fÃ¼r Feed & Carousel) */}
                  {editForm.platform === 'instagram' && (editForm.postType === 'feed' || editForm.postType === 'carousel') && (
                    <Stack space={2}>
                      <InstagramFormatSelector
                        selectedFormat={editForm.instagramFormat || 'portrait'}
                        onFormatChange={(format) => {
                          setEditForm({ ...editForm, instagramFormat: format })
                        }}
                      />
                    </Stack>
                  )}
                </Grid>

                {/* Date & Time */}
                <Grid columns={[1, 2]} gap={3}>
                  <Stack space={2}>
                    <Label size={1}>ðŸ“… Datum</Label>
                    <TextInput
                      type="date"
                      value={editForm.scheduledDate || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditForm({ ...editForm, scheduledDate: e.target.value })
                      }
                      fontSize={1}
                    />
                  </Stack>
                  <Stack space={2}>
                    <Label size={1}>â° Zeit</Label>
                    <TextInput
                      type="time"
                      value={editForm.scheduledTime || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setEditForm({ ...editForm, scheduledTime: e.target.value })
                      }
                      fontSize={1}
                    />
                  </Stack>
                </Grid>

                {/* Content */}
                <Stack space={2}>
                  <Label size={1}>âœï¸ Content</Label>
                  <TextArea
                    value={editForm.content || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setEditForm({ ...editForm, content: e.target.value })
                    }
                    rows={6}
                    fontSize={1}
                    placeholder="Post-Text hier eingeben..."
                  />
                  <Text size={0} muted>
                    {(editForm.content || '').length} Zeichen
                  </Text>
                </Stack>

                {/* First Comment - ONLY for non-Story posts */}
                {editForm.postType !== 'story' && (
                  <Card padding={3} radius={2} tone="transparent" border>
                    <Stack space={2}>
                      <Flex align="center" justify="space-between">
                        <Label size={1}>ðŸ’¬ First Comment (Optional)</Label>
                        <Button
                          mode="ghost"
                          tone="primary"
                          text="Vorlage"
                          fontSize={0}
                          icon={DocumentIcon}
                          onClick={() => {
                            // First Comment Templates based on platform
                            const templates: Record<string, string[]> = {
                              instagram: [
                                'ðŸ”— Link in Bio! Mehr Infos findest du dort.',
                                'ðŸ“¸ Was hÃ¤ltst du davon? Lass es mich in den Kommentaren wissen! ðŸ‘‡',
                                'ðŸ’¯ Markiere Freunde, die das sehen mÃ¼ssen!',
                                'ðŸŽŸï¸ Tickets im Link! Sichere dir deinen Platz!',
                                'ðŸ”¥ Schreib mir deine Meinung in die Kommentare!',
                              ],
                              facebook: [
                                'ðŸ”— Mehr Infos und Tickets: [LINK HIER EINFÃœGEN]',
                                'ðŸ‘¥ Was denkst du? Teile deine Meinung in den Kommentaren!',
                                'ðŸ“… Markiere dir das Datum im Kalender!',
                                'ðŸŽ‰ Teilen nicht vergessen! Lass andere auch teilhaben.',
                              ],
                              twitter: [
                                'ðŸ”— Details: [LINK]',
                                'ðŸ’¬ Eure Meinung?',
                                'ðŸ”„ RT wenn du auch dabei bist!',
                              ],
                              threads: [
                                'ðŸ§µ Was sagt ihr dazu? Drop eure Gedanken! ðŸ‘‡',
                                'ðŸ’¬ Mehr dazu in meinem Profil!',
                                'ðŸ”¥ Markiert Freunde, die das interessiert!',
                              ],
                            }
                            
                            const platform = (editForm.platform || 'instagram').toLowerCase()
                            const platformTemplates = templates[platform] || templates.instagram
                            const randomTemplate = platformTemplates[Math.floor(Math.random() * platformTemplates.length)]
                            
                            setEditForm({ ...editForm, firstComment: randomTemplate })
                            
                            toast.push({
                              status: 'info',
                              title: 'ðŸ’¡ Vorlage eingefÃ¼gt!',
                              description: 'Du kannst den Text jetzt anpassen.',
                            })
                          }}
                        />
                      </Flex>
                      <TextArea
                        value={editForm.firstComment || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          setEditForm({ ...editForm, firstComment: e.target.value })
                        }
                        rows={3}
                        fontSize={1}
                        placeholder="Automatischer erster Kommentar... (z.B. Link, CTA, zusÃ¤tzlicher Kontext)"
                      />
                      {editForm.firstComment && (
                        <Text size={0} muted>
                          {editForm.firstComment.length} Zeichen
                        </Text>
                      )}
                      <Text size={0} muted style={{ fontStyle: 'italic' }}>
                        ðŸ’¡ First Comments werden automatisch nach dem Post als erster Kommentar gepostet. Perfekt fÃ¼r Links, CTAs oder zusÃ¤tzlichen Kontext!
                      </Text>
                    </Stack>
                  </Card>
                )}

                {/* Live Post Preview mit exakten Dimensionen - Multi-Image Support */}
                {((editForm.images && editForm.images.length > 0) || editForm.imageUrl) && (
                  <Card padding={4} radius={2} shadow={2} tone="primary">
                    <Stack space={4}>
                      <Flex align="center" gap={2}>
                        <Text size={2}>ðŸ“±</Text>
                        <Text weight="semibold" size={1}>Post-Vorschau</Text>
                        <Badge tone="positive">{editForm.platform || 'Instagram'}</Badge>
                        {editForm.postType && (
                          <Badge tone="default">{editForm.postType}</Badge>
                        )}
                        {editForm.images && editForm.images.length > 1 && (
                          <Badge tone="primary">Karussell ({editForm.images.length} Bilder)</Badge>
                        )}
                      </Flex>

                      {/* Image Selector for Multiple Images */}
                      {editForm.images && editForm.images.length > 0 && (
                        <Card padding={3} radius={2} tone="transparent" border>
                          <Stack space={3}>
                            <Flex align="center" justify="space-between">
                              <Text size={0} weight="semibold">
                                ðŸ–¼ï¸ Bilder verwalten ({editForm.images.length})
                              </Text>
                              {editForm.images.length > 1 && selectedImageIndex >= 0 && (
                                <Button
                                  icon={TrashIcon}
                                  text="Bild lÃ¶schen"
                                  onClick={() => {
                                    if (confirm(`Bild ${selectedImageIndex + 1} wirklich lÃ¶schen?`)) {
                                      const newImages = editForm.images!.filter((_, i) => i !== selectedImageIndex)
                                      setEditForm({ ...editForm, images: newImages })
                                      // Adjust selected index if needed
                                      if (selectedImageIndex >= newImages.length) {
                                        setSelectedImageIndex(Math.max(0, newImages.length - 1))
                                      }
                                      toast.push({
                                        status: 'success',
                                        title: 'ðŸ—‘ï¸ Bild gelÃ¶scht',
                                        description: `${newImages.length} Bild(er) verbleibend`,
                                      })
                                    }
                                  }}
                                  tone="critical"
                                  mode="ghost"
                                  fontSize={0}
                                />
                              )}
                            </Flex>
                            
                            {editForm.images.length > 1 && (
                              <Flex gap={2} wrap="wrap">
                                {editForm.images.map((img, idx) => (
                                  <Box key={idx} style={{ position: 'relative' }}>
                                    <Button
                                      text={`Bild ${idx + 1}`}
                                      onClick={() => setSelectedImageIndex(idx)}
                                      tone={selectedImageIndex === idx ? 'primary' : 'default'}
                                      mode={selectedImageIndex === idx ? 'default' : 'ghost'}
                                      fontSize={0}
                                      style={{
                                        border: selectedImageIndex === idx ? '2px solid var(--card-focus-ring-color)' : 'none'
                                      }}
                                    />
                                  </Box>
                                ))}
                              </Flex>
                            )}

                            {editForm.images.length === 1 && (
                              <Flex align="center" gap={2}>
                                <Badge tone="default">Einzelbild</Badge>
                                <Button
                                  icon={TrashIcon}
                                  text="Bild entfernen"
                                  onClick={() => {
                                    if (confirm('Bild wirklich entfernen?')) {
                                      setEditForm({ 
                                        ...editForm, 
                                        images: undefined,
                                        imageUrl: undefined, // Also remove legacy
                                        needsImage: true 
                                      })
                                      toast.push({
                                        status: 'success',
                                        title: 'ðŸ—‘ï¸ Bild entfernt',
                                      })
                                    }
                                  }}
                                  tone="critical"
                                  mode="ghost"
                                  fontSize={0}
                                />
                              </Flex>
                            )}
                          </Stack>
                        </Card>
                      )}

                      {/* Legacy imageUrl support - also deletable */}
                      {!editForm.images && editForm.imageUrl && (
                        <Card padding={3} radius={2} tone="transparent" border>
                          <Flex align="center" justify="space-between">
                            <Text size={0} weight="semibold">ðŸ–¼ï¸ Bild vorhanden</Text>
                            <Button
                              icon={TrashIcon}
                              text="Bild entfernen"
                              onClick={() => {
                                if (confirm('Bild wirklich entfernen?')) {
                                  setEditForm({ 
                                    ...editForm, 
                                    imageUrl: undefined,
                                    needsImage: true 
                                  })
                                  toast.push({
                                    status: 'success',
                                    title: 'ðŸ—‘ï¸ Bild entfernt',
                                  })
                                }
                              }}
                              tone="critical"
                              mode="ghost"
                              fontSize={0}
                            />
                          </Flex>
                        </Card>
                      )}

                      {/* Image Position Controls - Now for selected image */}
                      <Card padding={3} radius={2} tone="transparent" border>
                        <Stack space={3}>
                          <Text size={0} weight="semibold">
                            ðŸŽ¯ Bildausschnitt positionieren{editForm.images && editForm.images.length > 1 ? ` (Bild ${selectedImageIndex + 1})` : ''}:
                          </Text>
                          
                          {/* Large Interactive Crop Preview */}
                          {(() => {
                            const platform = editForm.platform || 'instagram'
                            const postType = editForm.postType || 'feed'
                            const instagramFormat = editForm.instagramFormat || 'portrait'
                            
                            // Define aspect ratios
                            let aspectRatio = '1080 / 1350' // Default 4:5 portrait
                            
                            if (platform === 'instagram') {
                              if (postType === 'story' || postType === 'reel') {
                                aspectRatio = '1080 / 1920' // 9:16
                              } else if (postType === 'feed' || postType === 'carousel') {
                                switch (instagramFormat) {
                                  case 'square':
                                    aspectRatio = '1080 / 1080'
                                    break
                                  case 'portrait':
                                    aspectRatio = '1080 / 1350'
                                    break
                                  case 'landscape':
                                    aspectRatio = '1080 / 566'
                                    break
                                  default:
                                    aspectRatio = '1080 / 1350'
                                }
                              }
                            } else if (platform === 'facebook') {
                              aspectRatio = postType === 'story' ? '1080 / 1920' : '1080 / 1350'
                            } else if (platform === 'twitter' || platform === 'threads') {
                              aspectRatio = '1080 / 1350'
                            }
                            
                            return (
                              <Box
                                style={{
                                  width: '100%',
                                  aspectRatio: aspectRatio,
                                  position: 'relative',
                                  overflow: 'hidden',
                                  backgroundColor: '#000',
                                  borderRadius: '8px',
                                  border: '3px solid var(--card-focus-ring-color)'
                                }}
                              >
                                {/* Cropped Image Preview */}
                                <img
                                  src={(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].url : editForm.imageUrl || ''}
                                  alt="Crop Preview"
                                  style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: `${(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionX || 50 : editForm.imagePositionX || 50}% ${(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionY || 50 : editForm.imagePositionY || 50}%`,
                                    transform: `scale(${(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].zoom || 1 : editForm.imageZoom || 1})`,
                                    transformOrigin: `${(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionX || 50 : editForm.imagePositionX || 50}% ${(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionY || 50 : editForm.imagePositionY || 50}%`
                                  }}
                                />
                                
                                {/* Crosshair Overlay */}
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '0',
                                    right: '0',
                                    height: '1px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    pointerEvents: 'none'
                                  }}
                                />
                                <Box
                                  style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '0',
                                    bottom: '0',
                                    width: '1px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                    pointerEvents: 'none'
                                  }}
                                />
                                
                                {/* Format Label */}
                                <Box
                                  style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  <Text size={0} style={{ color: '#fff', fontWeight: 'bold' }}>
                                    {platform === 'instagram' && postType === 'story' && '9:16 Story'}
                                    {platform === 'instagram' && postType === 'reel' && '9:16 Reel'}
                                    {platform === 'instagram' && postType === 'feed' && instagramFormat === 'square' && '1:1 Quadrat'}
                                    {platform === 'instagram' && postType === 'feed' && instagramFormat === 'portrait' && '4:5 Portrait'}
                                    {platform === 'instagram' && postType === 'feed' && instagramFormat === 'landscape' && '1.91:1 Landscape'}
                                    {platform === 'instagram' && postType === 'carousel' && instagramFormat === 'square' && '1:1 Karussell'}
                                    {platform === 'instagram' && postType === 'carousel' && instagramFormat === 'portrait' && '4:5 Karussell'}
                                    {platform === 'instagram' && postType === 'carousel' && instagramFormat === 'landscape' && '1.91:1 Karussell'}
                                    {platform !== 'instagram' && `${platform}`}
                                  </Text>
                                </Box>
                                
                                {/* Carousel Indicator */}
                                {editForm.images && editForm.images.length > 1 && (
                                  <Box
                                    style={{
                                      position: 'absolute',
                                      top: '8px',
                                      right: '8px',
                                      background: 'rgba(0,0,0,0.7)',
                                      padding: '4px 8px',
                                      borderRadius: '12px',
                                    }}
                                  >
                                    <Text size={0} style={{ color: '#fff', fontWeight: 'bold' }}>
                                      {selectedImageIndex + 1}/{editForm.images.length}
                                    </Text>
                                  </Box>
                                )}
                              </Box>
                            )
                          })()}
                          
                          <Text size={0} muted align="center" style={{ fontStyle: 'italic' }}>
                            ðŸ‘† So wird das Bild im Post aussehen (mit Rahmen = sichtbarer Bereich)
                          </Text>
                          
                          {/* Zoom Control - Works with selected image */}
                          <Stack space={2}>
                            <Flex justify="space-between" align="center">
                              <Label size={0}>ðŸ” Zoom: {Math.round(((editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].zoom || 1 : editForm.imageZoom || 1) * 100)}%</Label>
                              <Flex gap={2}>
                                <Button
                                  text="-"
                                  onClick={() => {
                                    if (editForm.images && editForm.images[selectedImageIndex]) {
                                      const newImages = [...editForm.images]
                                      newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], zoom: Math.max(0.5, (newImages[selectedImageIndex].zoom || 1) - 0.1) }
                                      setEditForm({ ...editForm, images: newImages })
                                    } else {
                                      setEditForm({ ...editForm, imageZoom: Math.max(0.5, (editForm.imageZoom || 1) - 0.1) })
                                    }
                                  }}
                                  mode="ghost"
                                  fontSize={0}
                                />
                                <Button
                                  text="Reset"
                                  onClick={() => {
                                    if (editForm.images && editForm.images[selectedImageIndex]) {
                                      const newImages = [...editForm.images]
                                      newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], zoom: 1, positionX: 50, positionY: 50 }
                                      setEditForm({ ...editForm, images: newImages })
                                    } else {
                                      setEditForm({ ...editForm, imageZoom: 1, imagePositionX: 50, imagePositionY: 50 })
                                    }
                                  }}
                                  mode="ghost"
                                  fontSize={0}
                                />
                                <Button
                                  text="+"
                                  onClick={() => {
                                    if (editForm.images && editForm.images[selectedImageIndex]) {
                                      const newImages = [...editForm.images]
                                      newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], zoom: Math.min(3, (newImages[selectedImageIndex].zoom || 1) + 0.1) }
                                      setEditForm({ ...editForm, images: newImages })
                                    } else {
                                      setEditForm({ ...editForm, imageZoom: Math.min(3, (editForm.imageZoom || 1) + 0.1) })
                                    }
                                  }}
                                  mode="ghost"
                                  fontSize={0}
                                />
                              </Flex>
                            </Flex>
                            <input
                              type="range"
                              min="50"
                              max="300"
                              value={((editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].zoom || 1 : editForm.imageZoom || 1) * 100}
                              onChange={(e) => {
                                const newZoom = parseInt(e.target.value) / 100
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], zoom: newZoom }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imageZoom: newZoom })
                                }
                              }}
                              style={{
                                width: '100%',
                                accentColor: 'var(--card-focus-ring-color)'
                              }}
                            />
                          </Stack>

                          {/* Position Controls - Works with selected image */}
                          <Grid columns={2} gap={3}>
                            <Stack space={2}>
                              <Label size={0}>â†”ï¸ Horizontal: {(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionX || 50 : editForm.imagePositionX || 50}%</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionX || 50 : editForm.imagePositionX || 50}
                                onChange={(e) => {
                                  const newPos = parseInt(e.target.value)
                                  if (editForm.images && editForm.images[selectedImageIndex]) {
                                    const newImages = [...editForm.images]
                                    newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionX: newPos }
                                    setEditForm({ ...editForm, images: newImages })
                                  } else {
                                    setEditForm({ ...editForm, imagePositionX: newPos })
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  accentColor: 'var(--card-focus-ring-color)'
                                }}
                              />
                            </Stack>
                            <Stack space={2}>
                              <Label size={0}>â†•ï¸ Vertikal: {(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionY || 50 : editForm.imagePositionY || 50}%</Label>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={(editForm.images && editForm.images[selectedImageIndex]) ? editForm.images[selectedImageIndex].positionY || 50 : editForm.imagePositionY || 50}
                                onChange={(e) => {
                                  const newPos = parseInt(e.target.value)
                                  if (editForm.images && editForm.images[selectedImageIndex]) {
                                    const newImages = [...editForm.images]
                                    newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionY: newPos }
                                    setEditForm({ ...editForm, images: newImages })
                                  } else {
                                    setEditForm({ ...editForm, imagePositionY: newPos })
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  accentColor: 'var(--card-focus-ring-color)'
                                }}
                              />
                            </Stack>
                          </Grid>

                          {/* Quick Position Buttons - Works with selected image */}
                          <Flex gap={2} wrap="wrap">
                            <Button
                              text="â¬†ï¸ Oben"
                              onClick={() => {
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionY: 0 }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imagePositionY: 0 })
                                }
                              }}
                              mode="ghost"
                              fontSize={0}
                            />
                            <Button
                              text="â¬‡ï¸ Unten"
                              onClick={() => {
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionY: 100 }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imagePositionY: 100 })
                                }
                              }}
                              mode="ghost"
                              fontSize={0}
                            />
                            <Button
                              text="â¬…ï¸ Links"
                              onClick={() => {
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionX: 0 }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imagePositionX: 0 })
                                }
                              }}
                              mode="ghost"
                              fontSize={0}
                            />
                            <Button
                              text="âž¡ï¸ Rechts"
                              onClick={() => {
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionX: 100 }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imagePositionX: 100 })
                                }
                              }}
                              mode="ghost"
                              fontSize={0}
                            />
                            <Button
                              text="ðŸŽ¯ Zentriert"
                              onClick={() => {
                                if (editForm.images && editForm.images[selectedImageIndex]) {
                                  const newImages = [...editForm.images]
                                  newImages[selectedImageIndex] = { ...newImages[selectedImageIndex], positionX: 50, positionY: 50 }
                                  setEditForm({ ...editForm, images: newImages })
                                } else {
                                  setEditForm({ ...editForm, imagePositionX: 50, imagePositionY: 50 })
                                }
                              }}
                              mode="ghost"
                              fontSize={0}
                            />
                          </Flex>
                        </Stack>
                      </Card>

                      {/* Compact Post Preview Card with Caption */}
                      <Card padding={3} radius={2} shadow={1}>
                        <Stack space={2}>
                          <Text size={0} weight="semibold">ðŸ“± Post-Preview mit Text:</Text>
                          {(() => {
                            const platform = editForm.platform || 'instagram'
                            const platformStyles = {
                              instagram: { username: 'your-username', hashtagColor: '#00376b' },
                              facebook: { username: 'Your Page Name', hashtagColor: '#385898' },
                              twitter: { username: '@your-username', hashtagColor: '#1da1f2' },
                              threads: { username: '@your-username', hashtagColor: '#000000' },
                            }
                            const style = platformStyles[platform as keyof typeof platformStyles] || platformStyles.instagram
                            
                            return (
                              <Box>
                                <Text size={0} style={{ lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                  <strong>{style.username}</strong> {editForm.content || '(Kein Text)'}
                                </Text>
                                {editForm.photographer && (
                                  <Text size={0} muted style={{ marginTop: '4px', display: 'block' }}>
                                    {editForm.photographer.startsWith('ðŸ“¸') ? editForm.photographer : `ðŸ“¸ ${editForm.photographer}`}
                                  </Text>
                                )}
                                {editForm.hashtags && (
                                  <Text size={0} style={{ color: style.hashtagColor, display: 'block', marginTop: '4px' }}>
                                    {editForm.hashtags.split(/\s+/).map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')}
                                  </Text>
                                )}
                              </Box>
                            )
                          })()}
                        </Stack>
                      </Card>
                    </Stack>
                  </Card>
                )}

                {/* Hashtags */}
                <Stack space={2}>
                  <Label size={1}>#ï¸âƒ£ Hashtags</Label>
                  <TextInput
                    value={editForm.hashtags || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditForm({ ...editForm, hashtags: e.target.value })
                    }
                    fontSize={1}
                    placeholder="#YourBrand #concert #berlin"
                  />
                </Stack>

                {/* Photographer */}
                <Stack space={2}>
                  <Label size={1}>ðŸ“¸ Fotograf (optional)</Label>
                  <TextInput
                    value={editForm.photographer || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setEditForm({ ...editForm, photographer: e.target.value })
                    }
                    fontSize={1}
                    placeholder="Name des Fotografen"
                  />
                </Stack>

                {/* Image Upload */}
                <Stack space={3}>
                  <Label size={1}>ðŸ–¼ï¸ Bild</Label>
                  
                  {editForm.imageUrl ? (
                    <Box>
                      <img 
                        src={editForm.imageUrl} 
                        alt="Draft preview"
                        style={{ 
                          width: '100%',
                          maxHeight: '300px',
                          objectFit: 'contain',
                          borderRadius: '4px',
                          border: '1px solid var(--card-border-color)'
                        }}
                      />
                      <Button
                        text="Anderes Bild hochladen"
                        mode="ghost"
                        tone="primary"
                        onClick={async () => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file && editingDraft !== null) {
                              try {
                                let processedFile = file

                                // Auto-crop for all platforms
                                if (['instagram', 'facebook', 'threads', 'twitter'].includes(editForm.platform || 'instagram')) {
                                  toast.push({
                                    status: 'info',
                                    title: `ðŸ“ ${editForm.platform}-Optimierung...`,
                                  })
                                  processedFile = await processImageForInstagram(file, editForm.platform || 'instagram', editForm.postType || 'feed')
                                }

                                const asset = await client.assets.upload('image', processedFile, {
                                  filename: file.name,
                                })

                                setEditForm({ 
                                  ...editForm, 
                                  needsImage: false, 
                                  imageUrl: asset.url,
                                  imagePositionX: editForm.imagePositionX || 50,
                                  imagePositionY: editForm.imagePositionY || 50,
                                  imageZoom: editForm.imageZoom || 1,
                                })

                                toast.push({
                                  status: 'success',
                                  title: 'âœ… Bild hochgeladen!',
                                  description: `FÃ¼r ${editForm.platform || 'Instagram'} optimiert`,
                                })
                              } catch (error) {
                                console.error('[Batch Images] Upload error:', error)
                                toast.push({
                                  status: 'error',
                                  title: 'Fehler beim Hochladen',
                                })
                              }
                            }
                          }
                          input.click()
                        }}
                        style={{ marginTop: '8px' }}
                      />
                    </Box>
                  ) : (
                    <Card padding={4} radius={2} border tone="transparent" style={{ textAlign: 'center' }}>
                      <Stack space={3}>
                        <Text size={4}>ðŸ“·</Text>
                        <Text size={1} muted>Kein Bild vorhanden</Text>
                        <Button
                          icon={UploadIcon}
                          text="Bild hochladen"
                          tone="primary"
                          onClick={async () => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file && editingDraft !== null) {
                                try {
                                  // Upload ORIGINAL image (no cropping)
                                  const asset = await client.assets.upload('image', file, {
                                    filename: file.name,
                                  })

                                  setEditForm({ 
                                    ...editForm, 
                                    needsImage: false, 
                                    imageUrl: asset.url,
                                    imagePositionX: 50,
                                    imagePositionY: 50,
                                    imageZoom: 1,
                                  })

                                  toast.push({
                                    status: 'success',
                                    title: 'âœ… Bild hochgeladen!',
                                    description: 'Passe den Ausschnitt mit den Controls an',
                                  })
                                } catch (error) {
                                  console.error('[Batch Images] Upload error:', error)
                                  toast.push({
                                    status: 'error',
                                    title: 'Fehler beim Hochladen',
                                  })
                                }
                              }
                            }
                            input.click()
                          }}
                        />
                      </Stack>
                    </Card>
                  )}
                </Stack>

                {/* Action Buttons */}
                <Grid columns={[1, 3]} gap={3}>
                  <Button
                    text="Abbrechen"
                    onClick={handleCancelEdit}
                    mode="ghost"
                  />
                  <Button
                    text="Speichern"
                    onClick={handleSaveEdit}
                    tone="primary"
                    icon={EyeOpenIcon}
                  />
                  <Button
                    text="ðŸš€ Beitrag Planen"
                    onClick={async () => {
                      if (editingDraft !== null) {
                        // Show loading toast
                        toast.push({
                          status: 'info',
                          title: 'â³ Beitrag wird geplant...',
                        })

                        try {
                          // Build final content with photographer and hashtags
                          let finalContent = editForm.content || ''

                          if (editForm.photographer?.trim()) {
                            const photographerText = editForm.photographer.startsWith('ðŸ“¸')
                              ? editForm.photographer
                              : `ðŸ“¸ ${editForm.photographer}`
                            finalContent += `\n\n${photographerText}`
                          }

                          if (editForm.hashtags?.trim()) {
                            const hashtags = editForm.hashtags
                              .split(/\s+/)
                              .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
                            
                            // Twitter only gets 2-3 hashtags
                            const platform = editForm.platform || 'instagram'
                            const limitedHashtags = platform === 'twitter' ? hashtags.slice(0, 3) : hashtags
                            
                            finalContent += `\n\n${limitedHashtags.join(' ')}`
                          }

                          // Prepare scheduled date/time
                          const scheduledDateTime = `${editForm.scheduledDate}T${editForm.scheduledTime}`

                          // Prepare media items with cropping
                          let mediaItems: Array<{ url: string; type: 'image' }> = []
                          
                          // Handle new images array (multi-image support)
                          if (editForm.images && editForm.images.length > 0) {
                            console.log('[Batch Images] Processing images array:', editForm.images.length, 'images')
                            
                            for (const img of editForm.images) {
                              try {
                                // ALWAYS crop images to ensure correct format for platform
                                const croppedBlob = await cropImageForPosting(
                                  img.url,
                                  editForm.platform || 'instagram',
                                  editForm.postType || 'feed',
                                  img.positionX || 50,
                                  img.positionY || 50,
                                  img.zoom || 1,
                                  editForm.instagramFormat
                                )
                                
                                // Upload cropped image to Sanity
                                const croppedAsset = await client.assets.upload('image', croppedBlob, {
                                  filename: `cropped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`,
                                })
                                
                                mediaItems.push({
                                  url: croppedAsset.url,
                                  type: 'image',
                                })
                                
                                console.log('[Batch Images] Cropped and uploaded image:', {
                                  original: img.url,
                                  cropped: croppedAsset.url,
                                  position: { x: img.positionX || 50, y: img.positionY || 50 },
                                  zoom: img.zoom || 1
                                })
                              } catch (cropError) {
                                console.error('[Batch Images] Crop error for image, using original:', cropError)
                                // Fallback to original image
                                mediaItems.push({
                                  url: img.url,
                                  type: 'image',
                                })
                              }
                            }
                          } 
                          // Handle legacy single imageUrl
                          else if (editForm.imageUrl) {
                            console.log('[Batch Images] Processing legacy imageUrl')
                            try {
                              // ALWAYS crop images to ensure correct format for platform
                              const croppedBlob = await cropImageForPosting(
                                editForm.imageUrl,
                                editForm.platform || 'instagram',
                                editForm.postType || 'feed',
                                editForm.imagePositionX || 50,
                                editForm.imagePositionY || 50,
                                editForm.imageZoom || 1,
                                editForm.instagramFormat
                              )
                              
                              // Upload cropped image to Sanity
                              const croppedAsset = await client.assets.upload('image', croppedBlob, {
                                filename: `cropped_${Date.now()}.jpg`,
                              })
                              
                              mediaItems = [{
                                url: croppedAsset.url,
                                type: 'image',
                              }]
                              
                              console.log('[Batch Images] Cropped and uploaded image:', {
                                original: editForm.imageUrl,
                                cropped: croppedAsset.url,
                                position: { x: editForm.imagePositionX || 50, y: editForm.imagePositionY || 50 },
                                zoom: editForm.imageZoom || 1
                              })
                            } catch (cropError) {
                              console.error('[Batch Images] Crop error, using original:', cropError)
                              // Fallback to original image
                              mediaItems = [{
                                url: editForm.imageUrl,
                                type: 'image',
                              }]
                            }
                          }

                          // Get account for platform
                          const platform = editForm.platform || 'instagram'
                          
                          console.log('[Batch Images] API Settings:', {
                            totalAccounts: apiSettings.accounts.length,
                            accounts: apiSettings.accounts.map(a => ({ platform: a.platform, accountId: a.accountId, isActive: a.isActive })),
                            searchingFor: platform
                          })
                          
                          const account = apiSettings.accounts.find(
                            (a) => a.platform === platform && a.isActive
                          )

                          console.log('[Batch Images] Found account:', account)

                          if (!account) {
                            throw new Error(`Kein aktiver ${platform} Account gefunden. Bitte verbinde zuerst einen Account im Posting Tab.`)
                          }

                          if (!account.accountId) {
                            throw new Error(`Account fÃ¼r ${platform} hat keine accountId. Bitte synchronisiere die Accounts neu.`)
                          }

                          // Prepare platform data with accountId
                          const platformData: Record<string, unknown> = {
                            platform,
                            accountId: account.accountId,
                          }
                          
                          console.log('[Batch Images] Platform data to send:', platformData)
                          
                          if (platform === 'instagram') {
                            platformData.postType = editForm.postType || 'feed'
                          }

                          // Add first comment if provided (not for Stories)
                          const isStory = editForm.postType === 'story'
                          const firstComment = editForm.firstComment?.trim()
                          
                          if (firstComment && !isStory) {
                            if (!platformData.platformSpecificData) {
                              platformData.platformSpecificData = {}
                            }
                            (platformData.platformSpecificData as Record<string, unknown>).firstComment = firstComment
                          }

                          console.log('[Batch Images] Final platform data:', platformData)

                          // Call Late API
                          const response = await fetch('/api/late/posts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              content: finalContent,
                              mediaItems,
                              platforms: [platformData],
                              publishNow: false,
                              scheduledFor: scheduledDateTime,
                              timezone: 'Europe/Berlin',
                            }),
                          })

                          if (!response.ok) {
                            throw new Error(`API Error: ${response.statusText}`)
                          }

                          const result = await response.json()

                          // Remove from drafts
                          onDraftDelete(editingDraft)
                          setEditingDraft(null)
                          setEditForm({})

                          toast.push({
                            status: 'success',
                            title: 'ðŸŽ‰ Beitrag erfolgreich geplant!',
                            description: `Post fÃ¼r ${editForm.platform} am ${new Date(editForm.scheduledDate || '').toLocaleDateString('de-DE')} um ${editForm.scheduledTime} Uhr`,
                          })
                        } catch (error) {
                          console.error('[Batch Images] Schedule error:', error)
                          toast.push({
                            status: 'error',
                            title: 'âŒ Fehler beim Planen',
                            description: error instanceof Error ? error.message : 'Post konnte nicht geplant werden',
                          })
                        }
                      }
                    }}
                    tone="positive"
                    disabled={!editForm.content || !editForm.scheduledDate || !editForm.scheduledTime}
                  />
                </Grid>
              </Stack>
            </Box>
          </Dialog>
        )}

        {/* Bulk Upload (Coming Soon) */}
        <Card padding={4} radius={2} shadow={1} tone="transparent" border style={{ borderStyle: 'dashed' }}>
          <Stack space={2}>
            <Text size={1} weight="semibold" align="center">ðŸš€ Coming Soon: Bulk Upload</Text>
            <Text size={0} muted align="center">
              Lade mehrere Bilder gleichzeitig hoch und weise sie automatisch basierend auf Dateinamen zu.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

// ============================================
// MAIN TOOL COMPONENT WITH TABS
// ============================================

export function SocialMediaStudioToolV2() {
  const [activeTab, setActiveTab] = useState<'graphics' | 'concertday' | 'posting' | 'calendar' | 'csv-import' | 'batch-images' | 'drafts' | 'settings'>('graphics')
  const [sharedMediaUrl, setSharedMediaUrl] = useState<string | null>(null)
  const [importedDrafts, setImportedDrafts] = useState<CSVDraft[]>([])

  const handleSendToPosting = useCallback((imageUrl: string) => {
    setSharedMediaUrl(imageUrl)
    setActiveTab('posting')
  }, [])

  const handleDraftsImported = useCallback((drafts: CSVDraft[]) => {
    setImportedDrafts(drafts)
    // Save to localStorage for persistence
    try {
      localStorage.setItem('social-media-drafts', JSON.stringify(drafts))
    } catch (error) {
      console.error('[Drafts] Failed to save to localStorage:', error)
    }
  }, [])

  const handleDraftUpdate = useCallback((index: number, updates: Partial<CSVDraft>) => {
    setImportedDrafts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], ...updates }
      try {
        localStorage.setItem('social-media-drafts', JSON.stringify(updated))
      } catch (error) {
        console.error('[Drafts] Failed to save to localStorage:', error)
      }
      return updated
    })
  }, [])

  const handleDraftDelete = useCallback((index: number) => {
    setImportedDrafts((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      try {
        localStorage.setItem('social-media-drafts', JSON.stringify(updated))
      } catch (error) {
        console.error('[Drafts] Failed to save to localStorage:', error)
      }
      return updated
    })
  }, [])

  // Load drafts from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('social-media-drafts')
      if (saved) {
        setImportedDrafts(JSON.parse(saved))
      }
    } catch (error) {
      console.error('[Drafts] Failed to load from localStorage:', error)
    }
  }, [])

  return (
    <Card height="fill">
      {/* Header with Tabs */}
      <Card padding={3} borderBottom>
        <Stack space={2}>
          <Flex align="center" justify="center">
            <Heading size={1}>Social Media Studio</Heading>
          </Flex>
          
          <Flex gap={2} justify="center" align="center" wrap="wrap">
            <Button
              icon={ImageIcon}
              text="Graphics"
              mode={activeTab === 'graphics' ? 'default' : 'ghost'}
              tone={activeTab === 'graphics' ? 'primary' : 'default'}
              onClick={() => setActiveTab('graphics')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={DocumentsIcon}
              text="Concert Day"
              mode={activeTab === 'concertday' ? 'default' : 'ghost'}
              tone={activeTab === 'concertday' ? 'primary' : 'default'}
              onClick={() => setActiveTab('concertday')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={RocketIcon}
              text="Posting"
              mode={activeTab === 'posting' ? 'default' : 'ghost'}
              tone={activeTab === 'posting' ? 'primary' : 'default'}
              onClick={() => setActiveTab('posting')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={CalendarIcon}
              text="Kalender"
              mode={activeTab === 'calendar' ? 'default' : 'ghost'}
              tone={activeTab === 'calendar' ? 'primary' : 'default'}
              onClick={() => setActiveTab('calendar')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={DocumentIcon}
              text="CSV Import"
              mode={activeTab === 'csv-import' ? 'default' : 'ghost'}
              tone={activeTab === 'csv-import' ? 'primary' : 'default'}
              onClick={() => setActiveTab('csv-import')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={ImagesIcon}
              text="Batch Images"
              mode={activeTab === 'batch-images' ? 'default' : 'ghost'}
              tone={activeTab === 'batch-images' ? 'primary' : 'default'}
              onClick={() => setActiveTab('batch-images')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={DocumentTextIcon}
              text="Drafts & Templates"
              mode={activeTab === 'drafts' ? 'default' : 'ghost'}
              tone={activeTab === 'drafts' ? 'primary' : 'default'}
              onClick={() => setActiveTab('drafts')}
              fontSize={0}
              padding={2}
            />
            <Button
              icon={CogIcon}
              text="Settings"
              mode={activeTab === 'settings' ? 'default' : 'ghost'}
              tone={activeTab === 'settings' ? 'caution' : 'default'}
              onClick={() => setActiveTab('settings')}
              fontSize={0}
              padding={2}
            />
          </Flex>
        </Stack>
      </Card>

      <Card overflow="auto" style={{ height: 'calc(100vh - 140px)' }}>
        {activeTab === 'graphics' && <GraphicsStudio onSendToPosting={handleSendToPosting} />}
        {activeTab === 'concertday' && <ConcertDayGenerator onSendToPosting={handleSendToPosting} />}
        {activeTab === 'posting' && <SocialMediaPostingTab initialMediaUrl={sharedMediaUrl} onOpenSettings={() => setActiveTab('settings')} />}
        {activeTab === 'calendar' && <PostCalendarTab />}
        {activeTab === 'csv-import' && (
          <CSVImportTab 
            onDraftsImported={handleDraftsImported}
            onSwitchToBatchImages={() => setActiveTab('batch-images')}
          />
        )}
        {activeTab === 'batch-images' && (
          <BatchImagesTab 
            drafts={importedDrafts}
            onDraftUpdate={handleDraftUpdate}
            onDraftDelete={handleDraftDelete}
          />
        )}
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'drafts' && (
          <DraftsTemplatesTab
            onLoadDraft={(draft) => {
              // Load draft into posting tab
              setSharedMediaUrl(draft.mediaUrls?.[0] || null)
              setActiveTab('posting')
            }}
            onApplyTemplate={() => {
              setActiveTab('posting')
            }}
          />
        )}
      </Card>
    </Card>
  )
}

export default SocialMediaStudioToolV2

