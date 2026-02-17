import type { LogoPosition, TextPosition, TextAlign, StyleId } from '../../lib/types'

// Content type labels
export const CONTENT_TYPE_LABELS: { [key: string]: { de: string; en: string } } = {
  post: { de: 'News Artikel', en: 'News Article' },
}

// Logo position options
export const LOGO_POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: 'top-left', label: 'â†– Oben links' },
  { value: 'top-right', label: 'â†— Oben rechts' },
  { value: 'bottom-left', label: 'â†™ Unten links' },
  { value: 'bottom-right', label: 'â†˜ Unten rechts' },
]

// Text position options
export const TEXT_POSITIONS: { value: TextPosition; label: string }[] = [
  { value: 'top', label: 'â†‘ Oben' },
  { value: 'center', label: 'â¬¤ Mitte' },
  { value: 'bottom', label: 'â†“ Unten' },
]

// Text alignment options
export const TEXT_ALIGNS: { value: TextAlign; label: string }[] = [
  { value: 'left', label: 'â—€ Links' },
  { value: 'center', label: 'â¬¤ Mitte' },
  { value: 'right', label: 'â–¶ Rechts' },
]

// Style color configurations
export const STYLE_COLORS: Record<StyleId, { bg: string; accent: string; text: string }> = {
  industrial: { bg: '#000', accent: '#dc2626', text: '#fff' },
  minimal: { bg: '#0f0f0f', accent: '#fff', text: '#fff' },
  gradient: { bg: 'linear-gradient(135deg, #dc2626 0%, #8b5cf6 100%)', accent: '#f472b6', text: '#fff' },
  bold: { bg: '#000', accent: '#dc2626', text: '#fff' },
  neon: { bg: '#0a0a15', accent: '#ff073a', text: '#00f0ff' },
}

