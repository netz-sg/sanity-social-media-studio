'use client'

import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { Box } from '@sanity/ui'
import type {
  ContentItem,
  GraphicFormat,
  StyleId,
  LogoPosition,
  StudioState,
} from '../../lib/types'
import { FORMATS } from '../../lib/types'
import { getStyle } from '../../lib/styles'

// Font family constant â€” matches server-side renderer exactly
const FONT_FAMILY = '"Inter", "Helvetica Neue", Arial, sans-serif'

// Load Inter from Google Fonts for canvas rendering
let fontLoaded = false
function loadInterFont(): Promise<void> {
  if (fontLoaded) return Promise.resolve()
  if (typeof document === 'undefined') return Promise.resolve()
  
  return new Promise((resolve) => {
    // Check if already loaded
    if (document.fonts) {
      const existing = Array.from(document.fonts.values()).some(
        (f) => f.family === 'Inter' && f.status === 'loaded'
      )
      if (existing) {
        fontLoaded = true
        resolve()
        return
      }
    }

    // Add Inter from Google Fonts if not present
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
      const link = document.createElement('link')
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    // Wait for font to be available
    if (document.fonts) {
      document.fonts.ready.then(() => {
        fontLoaded = true
        resolve()
      })
    } else {
      // Fallback: wait a bit for font to load
      setTimeout(() => {
        fontLoaded = true
        resolve()
      }, 1000)
    }
  })
}

interface PreviewCanvasProps {
  content: ContentItem | null
  format: GraphicFormat
  style: StyleId
  customTitle: string
  customSubtitle: string
  customExcerpt: string
  primaryColor: string
  logo: { dataUrl: string | null; position: LogoPosition; size: number; opacity: number }
  advanced: StudioState['advanced']
}

export function PreviewCanvas({
  content,
  format,
  style,
  customTitle,
  customSubtitle,
  customExcerpt,
  primaryColor,
  logo,
  advanced,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const styleConfig = useMemo(() => getStyle(style), [style])
  const formatConfig = FORMATS[format]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Debounce canvas redraws to prevent excessive rendering on rapid state changes
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      // Load Inter font before rendering
      await loadInterFont()

      const { width, height } = formatConfig
      canvas.width = width
      canvas.height = height

      // Text scale factor
      const textScale = advanced.textScale / 100

      // Clear canvas
      ctx.fillStyle = styleConfig.background.baseColor
    ctx.fillRect(0, 0, width, height)

    const drawContent = async () => {
      // Background image
      if (content?.mainImage?.url) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = reject
            img.src = content.mainImage!.url
          })

          // Cover fit
          const imgRatio = img.width / img.height
          const canvasRatio = width / height
          let drawWidth, drawHeight, drawX, drawY

          if (imgRatio > canvasRatio) {
            drawHeight = height
            drawWidth = drawHeight * imgRatio
            drawX = (width - drawWidth) / 2
            drawY = 0
          } else {
            drawWidth = width
            drawHeight = drawWidth / imgRatio
            drawX = 0
            drawY = (height - drawHeight) / 2
          }

          ctx.save()
          ctx.globalAlpha = 1 - styleConfig.background.overlayOpacity
          
          // Apply blur effect
          if (advanced.blurIntensity > 0) {
            ctx.filter = `blur(${advanced.blurIntensity}px)`
          }
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
          ctx.filter = 'none'
          ctx.restore()
        } catch (e) {
          console.error('Image load error:', e)
        }
      }

      // Gradient overlay
      if (styleConfig.background.gradientType === 'radial') {
        const grad = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          height / 1.2,
        )
        styleConfig.background.gradientColors.forEach((color, i) => {
          grad.addColorStop(i / (styleConfig.background.gradientColors.length - 1), color)
        })
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
      } else if (styleConfig.background.gradientType === 'linear') {
        const grad = ctx.createLinearGradient(0, 0, width, height)
        styleConfig.background.gradientColors.forEach((color, i) => {
          grad.addColorStop(i / (styleConfig.background.gradientColors.length - 1), color)
        })
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, width, height)
      }

      // Scanlines for neon style
      if (styleConfig.effects.scanlines) {
        ctx.fillStyle = 'rgba(0,0,0,0.08)'
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 2)
        }
      }

      // Border
      if (advanced.showBorder) {
        ctx.strokeStyle = advanced.borderColor
        ctx.lineWidth = advanced.borderWidth
        ctx.strokeRect(
          advanced.borderWidth / 2,
          advanced.borderWidth / 2,
          width - advanced.borderWidth,
          height - advanced.borderWidth
        )
      }

      // ============================================
      // TEXT RENDERING - Sequential from top to bottom
      // ============================================
      
      const padding = format === 'story' ? 140 : 120
      const contentHeight = height - padding * 2

      // Scaled font sizes
      const titleSize = Math.round(styleConfig.typography.titleSize[format] * textScale)
      const subtitleSize = Math.round(styleConfig.typography.subtitleSize[format] * textScale)
      const excerptSize = Math.round(styleConfig.typography.excerptSize[format] * textScale)
      const dateSize = Math.round(styleConfig.typography.dateSize[format] * textScale)

      // Calculate starting Y position based on text position setting
      let currentY: number
      switch (advanced.textPosition) {
        case 'top':
          currentY = padding
          break
        case 'bottom':
          currentY = height - padding - 450 // Leave room for all elements
          break
        default: // center
          currentY = height / 2 - 200 // Aligned with server-side renderer
      }

      const textX = advanced.textAlign === 'right' ? width - 70 : 70
      const accentColor = primaryColor || styleConfig.accent.primaryColor

      // ============================================
      // 1. BADGE (Category/Content Type)
      // ============================================
      
      // Badge shows content type or category
      let badgeText: string
      if (content?._type === 'concertReport') {
        badgeText = 'KONZERTBERICHT'
      } else if (content?._type === 'aftershowStory') {
        badgeText = 'AFTERSHOW'
      } else if (content?.categories?.[0]?.title) {
        badgeText = content.categories[0].title.toUpperCase()
      } else {
        badgeText = 'NEWS'
      }

      ctx.font = `900 ${Math.round((format === 'story' ? 36 : 30) * textScale)}px ${FONT_FAMILY}`
      const categoryWidth = ctx.measureText(badgeText).width
      const badgePadding = format === 'story' ? 50 : 40
      const badgeWidth = categoryWidth + badgePadding * 2
      const badgeHeight = Math.round((format === 'story' ? 70 : 60) * textScale)

      // Draw badge background
      ctx.save()
      if (styleConfig.accent.badgeStyle === 'filled' || styleConfig.accent.badgeStyle === 'glow') {
        ctx.fillStyle = accentColor
        if (styleConfig.accent.badgeStyle === 'glow') {
          ctx.shadowColor = accentColor
          ctx.shadowBlur = 20
        }
        ctx.fillRect(textX, currentY, badgeWidth, badgeHeight)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'
      } else if (styleConfig.accent.badgeStyle === 'outline') {
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 2
        ctx.strokeRect(textX, currentY, badgeWidth, badgeHeight)
        ctx.fillStyle = accentColor
      } else {
        ctx.fillStyle = accentColor
      }

      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(badgeText, textX + badgePadding, currentY + badgeHeight / 2)
      ctx.restore()

      currentY += badgeHeight + 20 // Move down after badge

      // ============================================
      // 2. DATE + LOCATION LINE
      // ============================================
      
      const dateStr = content?.publishedAt
      
      let infoLine = ''
      if (dateStr) {
        const date = new Date(dateStr)
        infoLine = new Intl.DateTimeFormat('de-DE', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }).format(date)
      }
      
      if (infoLine) {
        ctx.font = `500 ${dateSize}px ${FONT_FAMILY}`
        ctx.fillStyle = styleConfig.typography.dateColor
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(
          infoLine.toUpperCase(),
          textX,
          currentY,
        )
        currentY += dateSize + 12 // Move down after date
      } else {
        currentY += 5 // Small gap if no date
      }

      // ============================================
      // 3. AUTHOR LINE (for all content types)
      // ============================================
      
      // Author line for news posts
      let authorText = ''
      if (content?.author?.name) {
        authorText = `von ${content.author.name}`
      }

      if (authorText) {
        ctx.font = `600 ${Math.round(dateSize * 0.9)}px ${FONT_FAMILY}`
        ctx.fillStyle = accentColor
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(authorText, textX, currentY)
        currentY += Math.round(dateSize * 0.9) + 18 // Move down after author
      } else {
        currentY += 12 // Gap if no author
      }

      // ============================================
      // 4. TITLE
      // ============================================
      
      const title = customTitle || content?.title || 'Titel hier'
      ctx.font = `${styleConfig.typography.titleWeight} ${titleSize}px ${FONT_FAMILY}`
      ctx.textAlign = advanced.textAlign
      ctx.textBaseline = 'top'

      // Word wrap with responsive sizing
      const words = title.split(' ')
      let lines: string[] = []
      let currentLine = ''
      const maxWidth = width - 140

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)

      // Auto-reduce font size if too many lines
      let adjustedTitleSize = titleSize
      if (lines.length > 4) {
        adjustedTitleSize = Math.round(titleSize * 0.8)
        ctx.font = `${styleConfig.typography.titleWeight} ${adjustedTitleSize}px ${FONT_FAMILY}`
        // Re-wrap
        lines = []
        currentLine = ''
        for (const word of words) {
          const testLine = currentLine + (currentLine ? ' ' : '') + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine)
            currentLine = word
          } else {
            currentLine = testLine
          }
        }
        if (currentLine) lines.push(currentLine)
      }

      const lineHeight = adjustedTitleSize * 1.15
      const totalTitleHeight = lines.length * lineHeight

      // Glow/shadow effect for title
      ctx.save()
      if (styleConfig.effects.glow && styleConfig.effects.glowColor) {
        ctx.shadowColor = styleConfig.effects.glowColor
        ctx.shadowBlur = 25 * (styleConfig.effects.glowIntensity || 0.5)
      }
      if (styleConfig.typography.titleShadow) {
        ctx.shadowColor = ctx.shadowColor || 'rgba(0,0,0,0.85)'
        ctx.shadowBlur = ctx.shadowBlur || 18
        ctx.shadowOffsetY = 4
      }

      const titleTextX = advanced.textAlign === 'left' ? 70 : (advanced.textAlign === 'right' ? width - 70 : width / 2)

      ctx.fillStyle = styleConfig.typography.titleColor
      for (const line of lines) {
        const displayLine = line.toUpperCase()
        ctx.fillText(displayLine, titleTextX, currentY, maxWidth)
        currentY += lineHeight
      }
      ctx.restore()

      currentY += 20 // Gap after title

      // ============================================
      // 5. SUBTITLE (optional)
      // ============================================
      
      const subtitle = customSubtitle || content?.subtitle
      if (subtitle) {
        ctx.font = `${styleConfig.typography.subtitleWeight} ${subtitleSize}px ${FONT_FAMILY}`
        ctx.fillStyle = styleConfig.typography.subtitleColor
        ctx.textAlign = advanced.textAlign
        ctx.textBaseline = 'top'

        if (styleConfig.effects.glow && style === 'neon') {
          ctx.shadowColor = '#00f0ff'
          ctx.shadowBlur = 12
        }

        ctx.fillText(subtitle, titleTextX, currentY, maxWidth)
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        currentY += subtitleSize + 20
      }

      // ============================================
      // 6. EXCERPT (optional)
      // ============================================
      
      if (advanced.showExcerpt && customExcerpt) {
        ctx.font = `400 ${excerptSize}px ${FONT_FAMILY}`
        ctx.fillStyle = styleConfig.typography.excerptColor
        ctx.textAlign = advanced.textAlign
        ctx.textBaseline = 'top'

        // Wrap excerpt
        const excerptWords = customExcerpt.split(' ')
        const excerptLines: string[] = []
        let excerptLine = ''
        const excerptMaxWidth = maxWidth - 40

        for (const word of excerptWords) {
          const testLine = excerptLine + (excerptLine ? ' ' : '') + word
          const metrics = ctx.measureText(testLine)
          if (metrics.width > excerptMaxWidth && excerptLine) {
            excerptLines.push(excerptLine)
            excerptLine = word
          } else {
            excerptLine = testLine
          }
        }
        if (excerptLine) excerptLines.push(excerptLine)

        // Limit to 3 lines
        const displayLines = excerptLines.slice(0, 3)
        if (excerptLines.length > 3) {
          displayLines[2] = displayLines[2].slice(0, -3) + '...'
        }

        for (const line of displayLines) {
          ctx.fillText(line, titleTextX, currentY, excerptMaxWidth)
          currentY += excerptSize * 1.4
        }
      }

      // ============================================
      // 7. CTA BUTTON
      // ============================================

      // CTA Button
      const ctaText = 'JETZT LESEN' // Locale can be made configurable later
      const btnY = format === 'story' ? height - 320 : height - 260
      const btnW = Math.round((format === 'story' ? 420 : 380) * textScale)
      const btnH = Math.round((format === 'story' ? 90 : 80) * textScale)
      const btnX = (width - btnW) / 2
      const btnFontSize = Math.round((format === 'story' ? 46 : 40) * textScale)

      ctx.save()
      ctx.fillStyle = accentColor
      if (styleConfig.effects.glow) {
        ctx.shadowColor = accentColor
        ctx.shadowBlur = 25
      }
      ctx.fillRect(btnX, btnY, btnW, btnH)
      ctx.restore()

      ctx.font = `900 ${btnFontSize}px ${FONT_FAMILY}`
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ctaText, width / 2, btnY + btnH / 2)

      // Watermark/Branding
      if (advanced.showWatermark) {
        const brandingSize = Math.round((format === 'story' ? 30 : 28) * textScale)
        ctx.font = `700 ${brandingSize}px ${FONT_FAMILY}`
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.textAlign = 'center'
        ctx.fillText(advanced.watermarkText, width / 2, format === 'story' ? height - 150 : height - 120)
      }

      // Corner accents
      if (styleConfig.accent.cornerAccents) {
        const cs = format === 'story' ? 18 : 16
        const co = format === 'story' ? 30 : 28
        ctx.strokeStyle = accentColor
        ctx.lineWidth = 3

        if (styleConfig.effects.glow) {
          ctx.shadowColor = accentColor
          ctx.shadowBlur = 8
        }

        // Top-left
        ctx.beginPath()
        ctx.moveTo(co + cs, co)
        ctx.lineTo(co, co)
        ctx.lineTo(co, co + cs)
        ctx.stroke()

        // Top-right
        ctx.beginPath()
        ctx.moveTo(width - co - cs, co)
        ctx.lineTo(width - co, co)
        ctx.lineTo(width - co, co + cs)
        ctx.stroke()

        // Bottom-left
        ctx.beginPath()
        ctx.moveTo(co, height - co - cs)
        ctx.lineTo(co, height - co)
        ctx.lineTo(co + cs, height - co)
        ctx.stroke()

        // Bottom-right
        ctx.beginPath()
        ctx.moveTo(width - co, height - co - cs)
        ctx.lineTo(width - co, height - co)
        ctx.lineTo(width - co - cs, height - co)
        ctx.stroke()

        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }

      // QR Code placeholder
      if (advanced.showQRCode) {
        const qrSize = 100
        const qrX = width - qrSize - 50
        const qrY = height - qrSize - 180
        
        ctx.fillStyle = '#fff'
        ctx.fillRect(qrX, qrY, qrSize, qrSize)
        
        ctx.fillStyle = '#000'
        ctx.font = `10px ${FONT_FAMILY}`
        ctx.textAlign = 'center'
        ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2)
        ctx.fillText('(API)', qrX + qrSize/2, qrY + qrSize/2 + 12)
      }

      // Logo
      if (logo.dataUrl) {
        try {
          const logoImg = new Image()
          await new Promise<void>((resolve, reject) => {
            logoImg.onload = () => resolve()
            logoImg.onerror = reject
            logoImg.src = logo.dataUrl!
          })

          const logoScale = Math.min(logo.size / logoImg.width, 1)
          const logoW = logoImg.width * logoScale
          const logoH = logoImg.height * logoScale
          const logoPadding = 45

          let logoX: number, logoY: number
          switch (logo.position) {
            case 'top-left':
              logoX = logoPadding
              logoY = logoPadding
              break
            case 'top-right':
              logoX = width - logoW - logoPadding
              logoY = logoPadding
              break
            case 'bottom-left':
              logoX = logoPadding
              logoY = height - logoH - logoPadding
              break
            case 'bottom-right':
              logoX = width - logoW - logoPadding
              logoY = height - logoH - logoPadding
              break
          }

          ctx.save()
          ctx.globalAlpha = logo.opacity / 100
          ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
          ctx.restore()
        } catch (e) {
          console.error('Logo load error:', e)
        }
      }
    }

    drawContent()
    }, 50) // End of debounce setTimeout

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [content, format, style, customTitle, customSubtitle, customExcerpt, primaryColor, logo, advanced, styleConfig, formatConfig])

  // Calculate display size
  const containerMaxHeight = 480
  const aspectRatio = formatConfig.width / formatConfig.height
  const displayHeight = Math.min(containerMaxHeight, 480)
  const displayWidth = displayHeight * aspectRatio

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px',
        background: 'var(--card-bg2-color)',
        borderRadius: '4px',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}
      />
    </Box>
  )
}

