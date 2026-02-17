/**
 * Social Media Graphics Studio - Renderer
 * 
 * Generiert Feed & Story Grafiken fÃ¼r Social Media
 */

import { createCanvas, loadImage, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas'
import { getStyle } from './styles'
import type { GraphicFormat, StyleId, LogoPosition, TextPosition, TextAlign } from './types'
import path from 'path'
import fs from 'fs'

// ============================================
// FONT REGISTRATION
// ============================================

let fontsRegistered = false

/**
 * Register Inter font for server-side rendering.
 * Attempts to load from:
 * 1. Project's public/fonts directory
 * 2. System fonts
 * Falls back to system default if not available.
 */
function registerFonts() {
  if (fontsRegistered) return
  fontsRegistered = true

  try {
    // Try loading Inter from local fonts directory
    const fontPaths = [
      path.join(process.cwd(), 'public', 'fonts', 'Inter-Variable.ttf'),
      path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'),
      path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'),
    ]

    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        GlobalFonts.registerFromPath(fontPath, 'Inter')
        console.log(`[Renderer] Registered font: ${fontPath}`)
      }
    }

    // Log available font families for debugging
    const families = GlobalFonts.families
    const hasInter = families.some((f: { family: string }) => f.family === 'Inter')
    if (hasInter) {
      console.log('[Renderer] Inter font available for rendering')
    } else {
      console.warn('[Renderer] Inter font not found locally. Using system fallback (Helvetica Neue / Arial).')
      console.warn('[Renderer] For best results, add Inter font files to public/fonts/')
    }
  } catch (e) {
    console.error('[Renderer] Font registration error:', e)
  }
}

// ============================================
// TYPES
// ============================================

export interface RenderOptions {
  width: number
  height: number
  format: GraphicFormat
  style: StyleId
  title: string
  subtitle?: string
  excerpt?: string
  date?: string
  category?: string
  contentType?: 'post' | 'concertReport' | 'aftershowStory'
  authorName?: string
  location?: string
  imageUrl?: string
  logoDataUrl?: string
  logoPosition?: LogoPosition
  logoSize?: number
  logoOpacity?: number
  primaryColor?: string
  locale?: string
  // Advanced Options
  textScale?: number
  blurIntensity?: number
  showExcerpt?: boolean
  showQRCode?: boolean
  showWatermark?: boolean
  watermarkText?: string
  textPosition?: TextPosition
  textAlign?: TextAlign
  showBorder?: boolean
  borderWidth?: number
  borderColor?: string
  articleUrl?: string
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Word-wrap text with proper clamping - NIEMALS Ã¼ber Grenzen hinaus
 */
function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontWeight: string,
  maxLines?: number
): string[] {
  ctx.font = `${fontWeight} ${fontSize}px "Inter", "Helvetica Neue", Arial, sans-serif`
  const lines: string[] = []
  
  // Split by explicit newlines first
  const paragraphs = text.split(/\n/)
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('')
      continue
    }
    
    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
        
        // Check max lines
        if (maxLines && lines.length >= maxLines) {
          // Truncate with ellipsis
          const lastLine = lines[lines.length - 1]
          if (ctx.measureText(lastLine + '...').width <= maxWidth) {
            lines[lines.length - 1] = lastLine + '...'
          } else {
            lines[lines.length - 1] = lastLine.slice(0, -3) + '...'
          }
          return lines
        }
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
      if (maxLines && lines.length >= maxLines) {
        return lines
      }
    }
  }

  return lines
}

/**
 * Calculate how many lines will fit in available space
 */
function calculateMaxLines(availableHeight: number, fontSize: number, lineHeight: number): number {
  return Math.floor(availableHeight / (fontSize * lineHeight))
}

// ============================================
// MAIN SINGLE-IMAGE RENDER FUNCTION
// ============================================

export async function renderGraphic(options: RenderOptions): Promise<Buffer> {
  // Ensure fonts are registered before rendering
  registerFonts()

  const {
    width,
    height,
    format,
    style,
    title,
    subtitle,
    excerpt,
    date,
    category,
    contentType = 'post',
    authorName,
    location,
    imageUrl,
    logoDataUrl,
    logoPosition = 'top-right',
    logoSize = 150,
    logoOpacity = 100,
    primaryColor,
    locale = 'de',
    textScale = 100,
    blurIntensity = 0,
    showExcerpt = false,
    showWatermark = true,
    watermarkText = 'YOUR SITE',
    textPosition = 'center',
    textAlign = 'center',
    showBorder = false,
    borderWidth = 5,
    borderColor = '#dc2626',
  } = options

  const styleConfig = getStyle(style)
  const accentColor = primaryColor || styleConfig.accent.primaryColor
  const scale = textScale / 100

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // ============================================
  // 1. BACKGROUND
  // ============================================

  // Base color
  ctx.fillStyle = styleConfig.background.baseColor
  ctx.fillRect(0, 0, width, height)

  // Background image with optional blur
  if (imageUrl) {
    try {
      const bg = await loadImage(imageUrl)
      const ratio = bg.width / bg.height
      const canvasRatio = width / height
      let drawWidth, drawHeight, drawX, drawY

      if (ratio > canvasRatio) {
        drawHeight = height
        drawWidth = drawHeight * ratio
        drawX = (width - drawWidth) / 2
        drawY = 0
      } else {
        drawWidth = width
        drawHeight = drawWidth / ratio
        drawX = 0
        drawY = (height - drawHeight) / 2
      }

      ctx.save()
      ctx.globalAlpha = 1 - styleConfig.background.overlayOpacity
      
      if (blurIntensity > 0) {
        ctx.globalAlpha *= (1 - blurIntensity / 100)
      }
      
      ctx.drawImage(bg, drawX, drawY, drawWidth, drawHeight)
      ctx.restore()
    } catch (e) {
      console.error('Background image load error:', e)
    }
  }

  // Gradient overlay
  if (styleConfig.background.gradientType === 'radial') {
    const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, height / 1.2)
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

  // ============================================
  // 2. BORDER
  // ============================================

  if (showBorder) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth
    ctx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      width - borderWidth,
      height - borderWidth
    )
  }

  // ============================================
  // 3. EFFECTS
  // ============================================

  // Scanlines (Neon style)
  if (styleConfig.effects.scanlines) {
    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2)
    }
  }

  // Noise (Neon style)
  if (styleConfig.effects.noise && styleConfig.effects.noiseOpacity) {
    ctx.save()
    ctx.globalAlpha = styleConfig.effects.noiseOpacity
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
      ctx.fillRect(x, y, 1, 1)
    }
    ctx.restore()
  }

  // ============================================
  // 4. TEXT RENDERING
  // ============================================

  const padding = format === 'story' ? 140 : 120

  let currentY: number
  switch (textPosition) {
    case 'top':
      currentY = padding
      break
    case 'bottom':
      currentY = height - padding - 450
      break
    default:
      currentY = height / 2 - 200
  }

  const baseTextX = textAlign === 'right' ? width - 70 : (format === 'story' ? 70 : 60)
  let ctxTextAlign: CanvasTextAlign
  
  switch (textAlign) {
    case 'left':
      ctxTextAlign = 'left'
      break
    case 'right':
      ctxTextAlign = 'right'
      break
    default:
      ctxTextAlign = 'center'
  }

  const titleTextX = textAlign === 'left' ? 70 : (textAlign === 'right' ? width - 70 : width / 2)

  // Category Badge
  let badgeText: string
  if (contentType === 'concertReport') {
    badgeText = 'KONZERTBERICHT'
  } else if (contentType === 'aftershowStory') {
    badgeText = 'AFTERSHOW'
  } else {
    badgeText = (category || 'NEWS').toUpperCase()
  }

  const badgeFontSize = Math.round((format === 'story' ? 36 : 30) * scale)
  ctx.font = `900 ${badgeFontSize}px "Inter", Arial, sans-serif`
  const categoryWidth = ctx.measureText(badgeText).width
  const badgePadding = format === 'story' ? 50 : 40
  const badgeWidth = categoryWidth + badgePadding * 2
  const badgeHeight = Math.round((format === 'story' ? 70 : 60) * scale)

  ctx.save()
  if (styleConfig.accent.badgeStyle === 'filled' || styleConfig.accent.badgeStyle === 'glow') {
    ctx.fillStyle = accentColor
    if (styleConfig.accent.badgeStyle === 'glow') {
      ctx.shadowColor = accentColor
      ctx.shadowBlur = 20
    }
    ctx.fillRect(baseTextX, currentY, badgeWidth, badgeHeight)
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
  } else if (styleConfig.accent.badgeStyle === 'outline') {
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 2
    ctx.strokeRect(baseTextX, currentY, badgeWidth, badgeHeight)
    ctx.fillStyle = accentColor
  } else {
    ctx.fillStyle = accentColor
  }

  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, baseTextX + badgePadding, currentY + badgeHeight / 2)
  ctx.restore()

  currentY += badgeHeight + 20

  // Date + Location
  const dateSize = Math.round(styleConfig.typography.dateSize[format] * scale)
  let infoLine = ''
  if (date) {
    const dateText = new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
    infoLine = dateText.toUpperCase()
  }
  
  if (location && (contentType === 'concertReport' || contentType === 'aftershowStory')) {
    infoLine = infoLine ? `${infoLine} â€¢ ${location}` : location
  }

  if (infoLine) {
    ctx.font = `500 ${dateSize}px "Inter", Arial, sans-serif`
    ctx.fillStyle = styleConfig.typography.dateColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(infoLine, baseTextX, currentY)
    currentY += dateSize + 12
  } else {
    currentY += 5
  }

  // Author
  if (authorName) {
    const authorText = `von ${authorName}`
    ctx.font = `600 ${Math.round(dateSize * 0.9)}px "Inter", Arial, sans-serif`
    ctx.fillStyle = accentColor
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(authorText, baseTextX, currentY)
    currentY += Math.round(dateSize * 0.9) + 18
  } else {
    currentY += 12
  }

  // Title
  const titleSize = Math.round(styleConfig.typography.titleSize[format] * scale)
  const maxTitleWidth = width - 160
  let titleLines = wrapText(ctx, title, maxTitleWidth, titleSize, styleConfig.typography.titleWeight)
  
  let adjustedTitleSize = titleSize
  if (titleLines.length > 4) {
    adjustedTitleSize = Math.round(titleSize * 0.8)
    titleLines = wrapText(ctx, title, maxTitleWidth, adjustedTitleSize, styleConfig.typography.titleWeight)
  }
  
  const lineHeight = adjustedTitleSize * 1.15

  ctx.textAlign = ctxTextAlign
  ctx.textBaseline = 'top'

  ctx.save()
  if (styleConfig.effects.glow && styleConfig.effects.glowColor) {
    ctx.shadowColor = styleConfig.effects.glowColor
    ctx.shadowBlur = 30 * (styleConfig.effects.glowIntensity || 0.5)
  }
  if (styleConfig.typography.titleShadow) {
    ctx.shadowColor = ctx.shadowColor || 'rgba(0,0,0,0.9)'
    ctx.shadowBlur = ctx.shadowBlur || 20
    ctx.shadowOffsetY = 5
  }

  ctx.fillStyle = styleConfig.typography.titleColor
  ctx.font = `${styleConfig.typography.titleWeight} ${adjustedTitleSize}px "Inter", Arial, sans-serif`

  for (const line of titleLines) {
    ctx.fillText(line.toUpperCase(), titleTextX, currentY, maxTitleWidth)
    currentY += lineHeight
  }
  ctx.restore()

  currentY += 20

  // Subtitle
  if (subtitle) {
    const subtitleSize = Math.round(styleConfig.typography.subtitleSize[format] * scale)

    ctx.save()
    if (styleConfig.effects.glow && style === 'neon') {
      ctx.shadowColor = styleConfig.accent.secondaryColor || '#00f0ff'
      ctx.shadowBlur = 15
    }

    ctx.font = `${styleConfig.typography.subtitleWeight} ${subtitleSize}px "Inter", Arial, sans-serif`
    ctx.fillStyle = styleConfig.typography.subtitleColor
    ctx.textAlign = ctxTextAlign
    ctx.textBaseline = 'top'
    ctx.fillText(subtitle, titleTextX, currentY, maxTitleWidth)
    ctx.restore()
    currentY += subtitleSize + 20
  }

  // Excerpt
  if (showExcerpt && excerpt) {
    const excerptSize = Math.round(styleConfig.typography.excerptSize[format] * scale)

    ctx.font = `400 ${excerptSize}px "Inter", Arial, sans-serif`
    ctx.fillStyle = styleConfig.typography.excerptColor
    ctx.textAlign = ctxTextAlign
    ctx.textBaseline = 'top'

    const excerptLines = wrapText(ctx, excerpt, maxTitleWidth - 60, excerptSize, '400', 3)

    for (const line of excerptLines) {
      ctx.fillText(line, titleTextX, currentY, maxTitleWidth - 60)
      currentY += excerptSize * 1.4
    }
  }

  // CTA Button
  const ctaText = locale === 'de' ? 'JETZT LESEN' : 'READ NOW'
  const btnY = format === 'story' ? height - 320 : height - 260
  const btnW = Math.round((format === 'story' ? 420 : 380) * scale)
  const btnH = Math.round((format === 'story' ? 90 : 80) * scale)
  const btnX = (width - btnW) / 2
  const btnFontSize = Math.round((format === 'story' ? 46 : 40) * scale)

  ctx.save()
  ctx.fillStyle = accentColor
  if (styleConfig.effects.glow) {
    ctx.shadowColor = accentColor
    ctx.shadowBlur = 25
  }
  ctx.fillRect(btnX, btnY, btnW, btnH)
  ctx.restore()

  ctx.font = `900 ${btnFontSize}px "Inter", Arial, sans-serif`
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ctaText, width / 2, btnY + btnH / 2)

  // Watermark
  if (showWatermark) {
    const brandingY = format === 'story' ? height - 150 : height - 120
    const brandingSize = Math.round((format === 'story' ? 30 : 28) * scale)

    ctx.font = `700 ${brandingSize}px "Inter", Arial, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.textAlign = 'center'
    ctx.fillText(watermarkText, width / 2, brandingY)
  }

  // Corner Accents
  if (styleConfig.accent.cornerAccents) {
    const cs = format === 'story' ? 18 : 16
    const co = format === 'story' ? 30 : 28
    ctx.strokeStyle = accentColor
    ctx.lineWidth = 3

    if (styleConfig.effects.glow) {
      ctx.shadowColor = accentColor
      ctx.shadowBlur = 10
    }

    ctx.beginPath()
    ctx.moveTo(co + cs, co)
    ctx.lineTo(co, co)
    ctx.lineTo(co, co + cs)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width - co - cs, co)
    ctx.lineTo(width - co, co)
    ctx.lineTo(width - co, co + cs)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(co, height - co - cs)
    ctx.lineTo(co, height - co)
    ctx.lineTo(co + cs, height - co)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(width - co, height - co - cs)
    ctx.lineTo(width - co, height - co)
    ctx.lineTo(width - co - cs, height - co)
    ctx.stroke()
    
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
  }

  // Logo
  if (logoDataUrl) {
    try {
      const logoImg = await loadImage(logoDataUrl)
      const maxLogoWidth = logoSize
      const logoScale = Math.min(maxLogoWidth / logoImg.width, 1)
      const logoW = logoImg.width * logoScale
      const logoH = logoImg.height * logoScale
      const logoPadding = 50

      let logoX: number, logoY: number
      switch (logoPosition) {
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
        default:
          logoX = width - logoW - logoPadding
          logoY = logoPadding
      }

      ctx.save()
      ctx.globalAlpha = logoOpacity / 100
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH)
      ctx.restore()
    } catch (e) {
      console.error('Logo load error:', e)
    }
  }

  return canvas.toBuffer('image/png')
}

