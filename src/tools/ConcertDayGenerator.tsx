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
  Dialog,
} from '@sanity/ui'
import {
  ImageIcon,
  DownloadIcon,
  UploadIcon,
  SearchIcon,
  RocketIcon,
  CalendarIcon,
  TrashIcon,
  EyeOpenIcon,
} from '@sanity/icons'
import { useClient } from 'sanity'

// ============================================
// TYPES
// ============================================

type FormatType = 'feed' | 'story' // 1080x1440 | 1080x1920

interface Concert {
  _id: string
  venue: string
  city: string
  country: string
  date: string
  doorsOpen?: string
  showStart?: string
  tourName?: string
  concertNumber?: number
  specialGuest?: string
  photographer?: string
  band?: {
    name: string
    logo?: { asset?: { url: string } }
  }
}

interface BackgroundImage {
  url: string
  scale: number
  offsetX: number
  offsetY: number
  darkness: number // 0-100, overlay opacity
}

interface ConcertDayState {
  selectedConcert: Concert | null
  format: FormatType
  backgroundImage: BackgroundImage | null
  isGenerating: boolean
}

// ============================================
// CANVAS RENDERER COMPONENT
// ============================================

function ConcertDayCanvas({
  concert,
  format,
  backgroundImage,
  onImageGenerated,
}: {
  concert: Concert | null
  format: FormatType
  backgroundImage: BackgroundImage | null
  onImageGenerated: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !concert) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions
    const width = 1080
    const height = format === 'feed' ? 1440 : 1920
    canvas.width = width
    canvas.height = height

    const drawContent = async () => {
      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)

      // Draw background image FULL COVER if available
      if (backgroundImage?.url) {
        try {
          const bgImg = new Image()
          bgImg.crossOrigin = 'anonymous'
          
          await new Promise((resolve, reject) => {
            bgImg.onload = resolve
            bgImg.onerror = reject
            bgImg.src = backgroundImage.url
          })

          // PERFECT COVER FIT - GARANTIERT KEINE SCHWARZEN BALKEN!
          const scale = backgroundImage.scale
          const imgRatio = bgImg.width / bgImg.height
          const canvasRatio = width / height
          
          let drawWidth, drawHeight
          
          // Calculate dimensions for COVER (fill entire canvas)
          if (imgRatio > canvasRatio) {
            // Image is wider - fit by HEIGHT, let width overflow
            drawHeight = height * scale
            drawWidth = drawHeight * imgRatio
          } else {
            // Image is taller - fit by WIDTH, let height overflow
            drawWidth = width * scale
            drawHeight = drawWidth / imgRatio
          }
          
          // Center the image
          let drawX = (width - drawWidth) / 2
          let drawY = (height - drawHeight) / 2
          
          // Apply user offsets
          drawX += backgroundImage.offsetX
          drawY += backgroundImage.offsetY
          
          // Draw background (will overflow canvas = perfect cover)
          ctx.save()
          ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight)
          ctx.restore()
          
          // Dark overlay for text readability (user-adjustable)
          const darknessOpacity = (backgroundImage.darkness || 50) / 100
          ctx.save()
          ctx.fillStyle = `rgba(0, 0, 0, ${darknessOpacity})`
          ctx.fillRect(0, 0, width, height)
          ctx.restore()
        } catch (e) {
          console.error('Background image load error:', e)
        }
      }

      // Parse date
      const concertDate = new Date(concert.date)
      const dateStr = concertDate.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      
      // Time with timezone
      const timeStr = concert.showStart || '19:30'
      const timezone = 'Europe/Berlin'
      let timeWithZone = timeStr
      
      // Format with timezone
      try {
        const tzShort = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          timeZoneName: 'short',
        }).format(concertDate).split(' ').pop()
        timeWithZone = `${timeStr} ${tzShort}`
      } catch {
        timeWithZone = timeStr
      }

      // TOP: Concert Number (centered)
      const padding = 50
      if (concert.concertNumber) {
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 20
        ctx.fillStyle = '#d4af37'
        ctx.font = 'bold 96px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`#${concert.concertNumber}`, width / 2, 100)
        ctx.restore()
      }

      // CENTER: Band Logo (NO FRAME - just logo with shadow)
      const logoSize = 220
      const logoX = width / 2 - logoSize / 2
      const logoY = format === 'feed' ? 400 : 600
      
      // Draw band logo if available
      if (concert.band?.logo?.asset?.url) {
        try {
          const logoImg = new Image()
          logoImg.crossOrigin = 'anonymous'
          const logoUrl = concert.band.logo.asset.url
          
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve
            logoImg.onerror = reject
            logoImg.src = logoUrl
          })

          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
          ctx.shadowBlur = 30
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 5
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
          ctx.restore()
        } catch (e) {
          console.error('Logo load error:', e)
        }
      }

      // CONCERT DAY TEXT (with strong shadow)
      const mainTextY = logoY + logoSize + 120
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 25
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 3
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 110px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('CONCERT DAY!', width / 2, mainTextY)
      
      ctx.font = 'italic 48px Arial, sans-serif'
      ctx.fillStyle = '#d4af37'
      ctx.fillText('JOUR DE CONCERT!', width / 2, mainTextY + 70)
      ctx.restore()

      // BOTTOM SECTION: Centered clean layout
      const bottomY = height - 380
      
      // Location + Country (centered)
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 54px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${concert.city}, ${concert.country.toUpperCase()}`, width / 2, bottomY)
      ctx.restore()

      // Venue (gold, centered)
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#d4af37'
      ctx.font = 'bold 48px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ðŸ“ ${concert.venue}`, width / 2, bottomY + 70)
      ctx.restore()

      // Date (centered)
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 58px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ðŸ“… ${dateStr}`, width / 2, bottomY + 150)
      ctx.restore()

      // Time (centered)
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 58px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`ðŸ• ${timeWithZone}`, width / 2, bottomY + 220)
      ctx.restore()

      // Special Guest (if exists, centered)
      if (concert.specialGuest) {
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)'
        ctx.shadowBlur = 20
        ctx.fillStyle = '#d4af37'
        ctx.font = 'bold 42px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`ðŸŽ¸ ${concert.specialGuest}`, width / 2, bottomY + 290)
        ctx.restore()
      }

      // Photo Credit (bottom)
      if (concert.photographer) {
        ctx.save()
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.font = '28px Arial, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`photo ${concert.photographer}`, width / 2, height - 90)
        ctx.restore()
      }

      // Website Footer
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('https://your-site.com', width / 2, height - 45)
      ctx.restore()

      // Generate data URL
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0)
        onImageGenerated(dataUrl)
      } catch (e) {
        console.error('Canvas to data URL error:', e)
      }
    }

    drawContent()
  }, [concert, format, backgroundImage, onImageGenerated])

  // Calculate display size
  const containerMaxHeight = 500
  const aspectRatio = format === 'feed' ? 1080 / 1440 : 1080 / 1920
  const displayHeight = Math.min(containerMaxHeight, 500)
  const displayWidth = displayHeight * aspectRatio

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${displayWidth}px`,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
      />
    </Box>
  )
}

// ============================================
// MAIN CONCERT DAY GENERATOR COMPONENT
// ============================================

export function ConcertDayGenerator({ onSendToPosting }: { onSendToPosting?: (imageUrl: string) => void }) {
  const client = useClient({ apiVersion: '2024-01-01' })
  const toast = useToast()

  const [state, setState] = useState<ConcertDayState>({
    selectedConcert: null,
    format: 'feed',
    backgroundImage: null,
    isGenerating: false,
  })

  const [concerts, setConcerts] = useState<Concert[]>([])
  const [isLoadingConcerts, setIsLoadingConcerts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [sanityImages, setSanityImages] = useState<Array<{ _id: string; url: string; alt?: string }>>([])
  const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  // Load concerts from Sanity
  useEffect(() => {
    const loadConcerts = async () => {
      setIsLoadingConcerts(true)
      try {
        // Get current date for filtering future concerts
        const today = new Date().toISOString().split('T')[0]
        
        const query = `*[_type == "concert" 
          && date >= $today 
          && (isFestival != true || !defined(isFestival))
          && language == "de"
        ] | order(date asc)[0...50] {
          _id,
          venue,
          city,
          country,
          date,
          doorsOpen,
          showStart,
          "tourName": tour->title,
          "band": band->{ name, "logo": logo { asset->{ url } } },
          concertNumber,
          specialGuest,
          photographer
        }`

        const data = await client.fetch<Concert[]>(query, { today })
        setConcerts(data || [])
      } catch (err) {
        console.error('Error loading concerts:', err)
        toast.push({
          status: 'error',
          title: 'Fehler',
          description: 'Konzerte konnten nicht geladen werden',
        })
      } finally {
        setIsLoadingConcerts(false)
      }
    }

    loadConcerts()
  }, [client, toast])

  // Load Sanity images
  const loadSanityImages = useCallback(async () => {
    try {
      const query = `*[_type == "post" || _type == "concertReport" || _type == "aftershowStory"] {
        _id,
        "url": mainImage.asset->url,
        "alt": mainImage.alt,
        title
      }[defined(url)][0...50]`

      const images = await client.fetch(query)
      setSanityImages(images || [])
      setShowImagePicker(true)
    } catch (err) {
      console.error('Error loading images:', err)
      toast.push({
        status: 'error',
        title: 'Fehler',
        description: 'Bilder konnten nicht geladen werden',
      })
    }
  }, [client, toast])

  // Handle background upload
  const handleBackgroundUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setState((prev) => ({
        ...prev,
        backgroundImage: {
          url: e.target?.result as string,
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          darkness: 50,
        },
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle Sanity image selection
  const handleSanityImageSelect = useCallback((imageUrl: string) => {
    setState((prev) => ({
      ...prev,
      backgroundImage: {
        url: imageUrl,
        scale: 1.0,
        offsetX: 0,
        offsetY: 0,
        darkness: 50,
      },
    }))
    setShowImagePicker(false)
  }, [])

  // Filter concerts
  const filteredConcerts = React.useMemo(() => {
    if (!searchQuery.trim()) return concerts
    const query = searchQuery.toLowerCase()
    return concerts.filter((c) => 
      c.venue?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.country?.toLowerCase().includes(query)
    )
  }, [concerts, searchQuery])

  // Handle image generated
  const handleImageGenerated = useCallback((dataUrl: string) => {
    setLastGeneratedImage(dataUrl)
  }, [])

  // Download image
  const handleDownload = useCallback(() => {
    if (!lastGeneratedImage) return

    const link = document.createElement('a')
    const filename = `concert-day-${state.selectedConcert?.city}-${state.format}.png`
    link.download = filename
    link.href = lastGeneratedImage
    link.click()

    toast.push({
      status: 'success',
      title: 'Download gestartet',
      description: filename,
    })
  }, [lastGeneratedImage, state.selectedConcert, state.format, toast])

  // Send to posting
  const handleSendToPosting = useCallback(() => {
    if (!lastGeneratedImage) return
    if (onSendToPosting) {
      onSendToPosting(lastGeneratedImage)
      toast.push({
        status: 'success',
        title: 'Bild gesendet',
        description: 'Bild wurde zum Social Media Posting hinzugefÃ¼gt',
      })
    }
  }, [lastGeneratedImage, onSendToPosting, toast])

  return (
    <Container width={3} padding={4}>
      <Stack space={4}>
        {/* Header */}
        <Flex align="center" justify="space-between">
          <Stack space={2}>
            <Flex align="center" gap={3}>
              <CalendarIcon style={{ fontSize: 32 }} />
              <Heading as="h1" size={2}>
                Concert Day Generator
              </Heading>
            </Flex>
            <Text muted size={1}>
              Erstelle Concert Day Graphics mit Konzertdaten aus Sanity
            </Text>
          </Stack>
        </Flex>

        <Grid columns={[1, 1, 2]} gap={4}>
          {/* LEFT: Configuration */}
          <Stack space={4}>
            {/* Format Selection */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Label size={1} weight="semibold">
                  Format
                </Label>
                <Flex gap={2}>
                  <Button
                    mode={state.format === 'feed' ? 'default' : 'ghost'}
                    tone={state.format === 'feed' ? 'primary' : 'default'}
                    text="Feed (1080x1440)"
                    onClick={() => setState((prev) => ({ ...prev, format: 'feed' }))}
                    fontSize={1}
                    style={{ flex: 1 }}
                  />
                  <Button
                    mode={state.format === 'story' ? 'default' : 'ghost'}
                    tone={state.format === 'story' ? 'primary' : 'default'}
                    text="Story (1080x1920)"
                    onClick={() => setState((prev) => ({ ...prev, format: 'story' }))}
                    fontSize={1}
                    style={{ flex: 1 }}
                  />
                </Flex>
              </Stack>
            </Card>

            {/* Concert Selection */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Label size={1} weight="semibold">
                  Konzert auswÃ¤hlen
                </Label>

                <TextInput
                  icon={SearchIcon}
                  placeholder="Suche nach Venue, Stadt oder Land..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  fontSize={1}
                />

                {isLoadingConcerts ? (
                  <Flex padding={4} justify="center">
                    <Spinner muted />
                  </Flex>
                ) : (
                  <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Stack space={2}>
                      {filteredConcerts.map((concert) => (
                        <Card
                          key={concert._id}
                          padding={3}
                          radius={2}
                          tone={state.selectedConcert?._id === concert._id ? 'primary' : 'default'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setState((prev) => ({ ...prev, selectedConcert: concert }))}
                        >
                          <Stack space={2}>
                            <Text size={1} weight="semibold">
                              {concert.venue}
                            </Text>
                            <Text size={0} muted>
                              {concert.city}, {concert.country} â€¢ {new Date(concert.date).toLocaleDateString('de-DE')}
                            </Text>
                            {concert.tourName && (
                              <Badge tone="primary" fontSize={0}>
                                {concert.tourName}
                              </Badge>
                            )}
                          </Stack>
                        </Card>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Background Image */}
            <Card padding={4} radius={2} shadow={1}>
              <Stack space={3}>
                <Label size={1} weight="semibold">
                  Hintergrundbild
                </Label>

                <Grid columns={2} gap={2}>
                  <Button
                    icon={UploadIcon}
                    text="Hochladen"
                    mode="ghost"
                    tone="default"
                    onClick={() => backgroundInputRef.current?.click()}
                    fontSize={1}
                  />
                  <Button
                    icon={ImageIcon}
                    text="Aus Sanity"
                    mode="ghost"
                    tone="default"
                    onClick={loadSanityImages}
                    fontSize={1}
                  />
                </Grid>

                <input
                  ref={backgroundInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleBackgroundUpload}
                />

                {state.backgroundImage && (
                  <Card padding={3} radius={2} tone="transparent">
                    <Stack space={3}>
                      <Text size={0} weight="semibold">Bildposition anpassen:</Text>
                      
                      <Stack space={2}>
                        <Label size={0}>Zoom</Label>
                        <input
                          type="range"
                          min="0.5"
                          max="2"
                          step="0.1"
                          value={state.backgroundImage.scale}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              backgroundImage: prev.backgroundImage
                                ? { ...prev.backgroundImage, scale: parseFloat(e.target.value) }
                                : null,
                            }))
                          }}
                          style={{ width: '100%' }}
                        />
                        <Text size={0} muted>{state.backgroundImage.scale.toFixed(1)}x</Text>
                      </Stack>

                      <Stack space={2}>
                        <Label size={0}>Horizontal</Label>
                        <input
                          type="range"
                          min="-500"
                          max="500"
                          step="10"
                          value={state.backgroundImage.offsetX}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              backgroundImage: prev.backgroundImage
                                ? { ...prev.backgroundImage, offsetX: parseInt(e.target.value) }
                                : null,
                            }))
                          }}
                          style={{ width: '100%' }}
                        />
                      </Stack>

                      <Stack space={2}>
                        <Label size={0}>Vertikal</Label>
                        <input
                          type="range"
                          min="-500"
                          max="500"
                          step="10"
                          value={state.backgroundImage.offsetY}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              backgroundImage: prev.backgroundImage
                                ? { ...prev.backgroundImage, offsetY: parseInt(e.target.value) }
                                : null,
                            }))
                          }}
                          style={{ width: '100%' }}
                        />
                      </Stack>

                      <Stack space={2}>
                        <Label size={0}>Abdunkeln</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={state.backgroundImage.darkness || 50}
                          onChange={(e) => {
                            setState((prev) => ({
                              ...prev,
                              backgroundImage: prev.backgroundImage
                                ? { ...prev.backgroundImage, darkness: parseInt(e.target.value) }
                                : null,
                            }))
                          }}
                          style={{ width: '100%' }}
                        />
                        <Text size={0} muted>
                          {state.backgroundImage.darkness || 50}% dunkel
                        </Text>
                      </Stack>

                      <Button
                        text="Bild entfernen"
                        mode="ghost"
                        tone="critical"
                        fontSize={0}
                        onClick={() => setState((prev) => ({ ...prev, backgroundImage: null }))}
                      />
                    </Stack>
                  </Card>
                )}
              </Stack>
            </Card>
          </Stack>

          {/* RIGHT: Preview & Actions */}
          <Stack space={3}>
            {state.selectedConcert ? (
              <>
                {/* Preview Card */}
                <Card padding={4} radius={2} shadow={1}>
                  <Stack space={3}>
                    <Flex align="center" justify="space-between">
                      <Flex align="center" gap={2}>
                        <EyeOpenIcon />
                        <Text weight="semibold" size={1}>Vorschau</Text>
                      </Flex>
                      <Badge tone="caution" fontSize={0}>
                        {state.format === 'feed' ? '1080Ã—1440' : '1080Ã—1920'}
                      </Badge>
                    </Flex>

                    <ConcertDayCanvas
                      concert={state.selectedConcert}
                      format={state.format}
                      backgroundImage={state.backgroundImage}
                      onImageGenerated={handleImageGenerated}
                    />

                    <Card padding={2} radius={2} tone="transparent">
                      <Grid columns={3} gap={2}>
                        <Stack space={1}>
                          <Text size={0} muted>Format</Text>
                          <Text size={0} weight="medium">{state.format === 'feed' ? 'Feed' : 'Story'}</Text>
                        </Stack>
                        <Stack space={1}>
                          <Text size={0} muted>Venue</Text>
                          <Text size={0} weight="medium">{state.selectedConcert.venue}</Text>
                        </Stack>
                        <Stack space={1}>
                          <Text size={0} muted>Datum</Text>
                          <Text size={0} weight="medium">
                            {new Date(state.selectedConcert.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                          </Text>
                        </Stack>
                      </Grid>
                    </Card>
                  </Stack>
                </Card>

                {/* Actions Card */}
                <Card padding={4} radius={2} shadow={1} tone="primary">
                  <Stack space={3}>
                    <Flex align="center" gap={2}>
                      <DownloadIcon />
                      <Text weight="semibold" size={1}>Aktionen</Text>
                    </Flex>

                    <Grid columns={2} gap={2}>
                      <Button
                        icon={DownloadIcon}
                        text="Download"
                        mode="default"
                        tone="primary"
                        onClick={handleDownload}
                        disabled={!lastGeneratedImage}
                        fontSize={1}
                      />
                      <Button
                        icon={RocketIcon}
                        text="An Posting"
                        mode="default"
                        tone="positive"
                        onClick={handleSendToPosting}
                        disabled={!lastGeneratedImage || !onSendToPosting}
                        fontSize={1}
                      />
                    </Grid>
                  </Stack>
                </Card>
              </>
            ) : (
              <Card padding={5} radius={2} tone="transparent" shadow={1}>
                <Flex align="center" justify="center" direction="column" style={{ minHeight: '400px' }}>
                  <Stack space={3} style={{ textAlign: 'center' }}>
                    <Text size={4}>ðŸŽ¸</Text>
                    <Heading size={1}>WÃ¤hle ein Konzert</Heading>
                    <Text muted size={1}>
                      WÃ¤hle ein Konzert aus der Liste links, um zu starten
                    </Text>
                  </Stack>
                </Flex>
              </Card>
            )}
          </Stack>
        </Grid>

        {/* Image Picker Dialog */}
        {showImagePicker && (
          <Dialog
            header="Bild aus Sanity wÃ¤hlen"
            id="image-picker"
            onClose={() => setShowImagePicker(false)}
            width={2}
          >
            <Box padding={4}>
              <Grid columns={3} gap={3}>
                {sanityImages.map((img) => (
                  <Card
                    key={img._id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSanityImageSelect(img.url)}
                  >
                    <Box style={{ aspectRatio: '1', overflow: 'hidden' }}>
                      <img
                        src={img.url}
                        alt={img.alt || 'Sanity image'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  </Card>
                ))}
              </Grid>
            </Box>
          </Dialog>
        )}
      </Stack>
    </Container>
  )
}

