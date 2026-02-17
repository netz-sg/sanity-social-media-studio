/**
 * Social Media Graphics Studio - Type Definitions
 */

// ============================================
// CONTENT TYPES
// ============================================

export type ContentType = 'post' | 'concertReport' | 'aftershowStory'

export interface ContentItem {
  _id: string
  _type: ContentType
  title: string
  subtitle?: string
  excerpt?: string
  publishedAt?: string
  categories?: { title: string }[]
  author?: { name: string }
  authorName?: string
  concertDate?: string
  eventDate?: string
  location?: string
  concertReference?: {
    title: string
    venue?: string
    tour?: { title: string }
  }
  mainImage?: {
    url: string
    alt?: string
  }
  language: string
  slug?: { current: string }
}

// ============================================
// FORMAT TYPES
// ============================================

export type GraphicFormat = 'feed' | 'story'

export interface FormatConfig {
  width: number
  height: number
  label: string
  labelDE: string
}

export const FORMATS: Record<GraphicFormat, FormatConfig> = {
  feed: {
    width: 1080,
    height: 1440,
    label: 'Feed',
    labelDE: 'Feed',
  },
  story: {
    width: 1080,
    height: 1920,
    label: 'Story',
    labelDE: 'Story',
  },
}

// ============================================
// STYLE TYPES
// ============================================

export type StyleId = 'industrial' | 'minimal' | 'gradient' | 'bold' | 'neon'

export interface BackgroundConfig {
  baseColor: string
  overlayOpacity: number
  blur: number
  gradientType: 'radial' | 'linear' | 'none'
  gradientColors: string[]
}

export interface TypographyConfig {
  titleSize: {
    feed: number
    story: number
  }
  titleWeight: string
  titleColor: string
  titleShadow: boolean
  subtitleSize: {
    feed: number
    story: number
  }
  subtitleWeight: string
  subtitleColor: string
  excerptSize: {
    feed: number
    story: number
  }
  excerptColor: string
  dateSize: {
    feed: number
    story: number
  }
  dateColor: string
  textTransform: 'uppercase' | 'none' | 'capitalize'
}

export interface AccentConfig {
  primaryColor: string
  secondaryColor?: string
  badgeStyle: 'filled' | 'outline' | 'glow' | 'minimal'
  cornerAccents: boolean
  cornerStyle?: 'brackets' | 'lines' | 'dots' | 'none'
}

export interface EffectsConfig {
  glow: boolean
  glowColor?: string
  glowIntensity?: number
  noise: boolean
  noiseOpacity?: number
  scanlines: boolean
  vignette: boolean
  vignetteIntensity?: number
}

export interface GraphicStyle {
  id: StyleId
  name: string
  nameDE: string
  description: string
  descriptionDE: string
  background: BackgroundConfig
  typography: TypographyConfig
  accent: AccentConfig
  effects: EffectsConfig
}

// ============================================
// LOGO TYPES
// ============================================

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface LogoConfig {
  dataUrl: string | null
  position: LogoPosition
  size: number
  opacity: number
}

// ============================================
// TEXT POSITION
// ============================================

export type TextPosition = 'top' | 'center' | 'bottom'
export type TextAlign = 'left' | 'center' | 'right'

// ============================================
// ADVANCED SETTINGS
// ============================================

export interface AdvancedSettings {
  textScale: number
  blurIntensity: number
  showExcerpt: boolean
  showQRCode: boolean
  showWatermark: boolean
  watermarkText: string
  textPosition: TextPosition
  textAlign: TextAlign
  showBorder: boolean
  borderWidth: number
  borderColor: string
}

// ============================================
// STUDIO STATE
// ============================================

export interface StudioState {
  contentType: ContentType
  selectedContent: ContentItem | null
  format: GraphicFormat
  style: StyleId
  customTitle: string
  customSubtitle: string
  customExcerpt: string
  primaryColor: string
  logo: LogoConfig
  advanced: AdvancedSettings
  isGenerating: boolean
}

// ============================================
// API PARAMS
// ============================================

export interface GraphicsApiParams {
  id: string
  style: StyleId
  format: GraphicFormat
  locale: string
  title?: string
  subtitle?: string
  excerpt?: string
  primaryColor?: string
  logoDataUrl?: string
  logoPosition?: LogoPosition
  logoSize?: number
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
}

// ============================================
// DEFAULT VALUES
// ============================================

export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings = {
  textScale: 100,
  blurIntensity: 0,
  showExcerpt: true,
  showQRCode: false,
  showWatermark: true,
  watermarkText: 'YOUR SITE',
  textPosition: 'center',
  textAlign: 'center',
  showBorder: false,
  borderWidth: 4,
  borderColor: '#dc2626',
}

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  dataUrl: null,
  position: 'top-right',
  size: 150,
  opacity: 100,
}
