/**
 * Social Media Graphics Studio - Style Definitions
 *
 * 5 professional styles for social media graphics
 */

import { GraphicStyle, StyleId } from './types'

// ============================================
// STYLE 1: INDUSTRIAL (Default)
// Dark with red accents, bracket corners, dramatic
// ============================================
const industrialStyle: GraphicStyle = {
  id: 'industrial',
  name: 'Industrial',
  nameDE: 'Industrial',
  description: 'Dark theme with red accents and bracket corners',
  descriptionDE: 'Dunkles Design mit roten Akzenten und Klammer-Ecken',
  background: {
    baseColor: '#000000',
    overlayOpacity: 0.82,
    blur: 0,
    gradientType: 'radial',
    gradientColors: [
      'rgba(0,0,0,0.75)',
      'rgba(0,0,0,0.88)',
      'rgba(0,0,0,0.96)',
    ],
  },
  typography: {
    titleSize: { feed: 68, story: 85 },
    titleWeight: '900',
    titleColor: '#ffffff',
    titleShadow: true,
    subtitleSize: { feed: 34, story: 40 },
    subtitleWeight: '600',
    subtitleColor: '#dc2626',
    excerptSize: { feed: 28, story: 32 },
    excerptColor: 'rgba(255,255,255,0.75)',
    dateSize: { feed: 24, story: 28 },
    dateColor: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  accent: {
    primaryColor: '#dc2626',
    badgeStyle: 'filled',
    cornerAccents: true,
    cornerStyle: 'brackets',
  },
  effects: {
    glow: false,
    noise: false,
    scanlines: false,
    vignette: true,
    vignetteIntensity: 0.65,
  },
}

// ============================================
// STYLE 2: MINIMAL
// ============================================
const minimalStyle: GraphicStyle = {
  id: 'minimal',
  name: 'Minimal',
  nameDE: 'Minimal',
  description: 'Clean and elegant with subtle typography',
  descriptionDE: 'Clean und elegant mit dezenter Typografie',
  background: {
    baseColor: '#0f0f0f',
    overlayOpacity: 0.65,
    blur: 25,
    gradientType: 'linear',
    gradientColors: [
      'rgba(15,15,15,0.92)',
      'rgba(25,25,25,0.88)',
    ],
  },
  typography: {
    titleSize: { feed: 54, story: 68 },
    titleWeight: '500',
    titleColor: '#ffffff',
    titleShadow: false,
    subtitleSize: { feed: 28, story: 34 },
    subtitleWeight: '300',
    subtitleColor: 'rgba(255,255,255,0.7)',
    excerptSize: { feed: 24, story: 28 },
    excerptColor: 'rgba(255,255,255,0.55)',
    dateSize: { feed: 20, story: 24 },
    dateColor: 'rgba(255,255,255,0.45)',
    textTransform: 'none',
  },
  accent: {
    primaryColor: '#ffffff',
    badgeStyle: 'outline',
    cornerAccents: false,
    cornerStyle: 'none',
  },
  effects: {
    glow: false,
    noise: false,
    scanlines: false,
    vignette: false,
  },
}

// ============================================
// STYLE 3: GRADIENT
// ============================================
const gradientStyle: GraphicStyle = {
  id: 'gradient',
  name: 'Gradient',
  nameDE: 'Gradient',
  description: 'Dynamic color gradients with modern vibes',
  descriptionDE: 'Dynamische Farbverläufe mit modernem Look',
  background: {
    baseColor: '#1a1a2e',
    overlayOpacity: 0.55,
    blur: 35,
    gradientType: 'linear',
    gradientColors: [
      'rgba(220,38,38,0.7)',
      'rgba(147,51,234,0.65)',
      'rgba(30,30,50,0.92)',
    ],
  },
  typography: {
    titleSize: { feed: 64, story: 80 },
    titleWeight: '800',
    titleColor: '#ffffff',
    titleShadow: true,
    subtitleSize: { feed: 32, story: 38 },
    subtitleWeight: '500',
    subtitleColor: '#fbbf24',
    excerptSize: { feed: 26, story: 30 },
    excerptColor: 'rgba(255,255,255,0.8)',
    dateSize: { feed: 22, story: 26 },
    dateColor: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
  },
  accent: {
    primaryColor: '#f472b6',
    secondaryColor: '#8b5cf6',
    badgeStyle: 'filled',
    cornerAccents: false,
    cornerStyle: 'none',
  },
  effects: {
    glow: true,
    glowColor: '#f472b6',
    glowIntensity: 0.45,
    noise: false,
    scanlines: false,
    vignette: true,
    vignetteIntensity: 0.45,
  },
}

// ============================================
// STYLE 4: BOLD
// ============================================
const boldStyle: GraphicStyle = {
  id: 'bold',
  name: 'Bold',
  nameDE: 'Bold',
  description: 'Maximum impact with huge typography',
  descriptionDE: 'Maximaler Impact mit riesiger Schrift',
  background: {
    baseColor: '#000000',
    overlayOpacity: 0.88,
    blur: 5,
    gradientType: 'radial',
    gradientColors: [
      'rgba(0,0,0,0.65)',
      'rgba(0,0,0,0.92)',
    ],
  },
  typography: {
    titleSize: { feed: 82, story: 105 },
    titleWeight: '900',
    titleColor: '#ffffff',
    titleShadow: true,
    subtitleSize: { feed: 38, story: 46 },
    subtitleWeight: '800',
    subtitleColor: '#dc2626',
    excerptSize: { feed: 28, story: 34 },
    excerptColor: 'rgba(255,255,255,0.7)',
    dateSize: { feed: 26, story: 32 },
    dateColor: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
  },
  accent: {
    primaryColor: '#dc2626',
    badgeStyle: 'filled',
    cornerAccents: true,
    cornerStyle: 'lines',
  },
  effects: {
    glow: false,
    noise: false,
    scanlines: false,
    vignette: true,
    vignetteIntensity: 0.75,
  },
}

// ============================================
// STYLE 5: NEON
// ============================================
const neonStyle: GraphicStyle = {
  id: 'neon',
  name: 'Neon',
  nameDE: 'Neon',
  description: 'Cyberpunk aesthetics with glowing text',
  descriptionDE: 'Cyberpunk-Ästhetik mit leuchtenden Effekten',
  background: {
    baseColor: '#0a0a15',
    overlayOpacity: 0.72,
    blur: 18,
    gradientType: 'radial',
    gradientColors: [
      'rgba(10,10,21,0.65)',
      'rgba(0,0,0,0.92)',
    ],
  },
  typography: {
    titleSize: { feed: 66, story: 82 },
    titleWeight: '800',
    titleColor: '#ff073a',
    titleShadow: true,
    subtitleSize: { feed: 32, story: 38 },
    subtitleWeight: '500',
    subtitleColor: '#00f0ff',
    excerptSize: { feed: 26, story: 30 },
    excerptColor: 'rgba(0,240,255,0.7)',
    dateSize: { feed: 22, story: 26 },
    dateColor: 'rgba(0,240,255,0.6)',
    textTransform: 'uppercase',
  },
  accent: {
    primaryColor: '#ff073a',
    secondaryColor: '#00f0ff',
    badgeStyle: 'glow',
    cornerAccents: true,
    cornerStyle: 'brackets',
  },
  effects: {
    glow: true,
    glowColor: '#ff073a',
    glowIntensity: 0.85,
    noise: true,
    noiseOpacity: 0.04,
    scanlines: true,
    vignette: true,
    vignetteIntensity: 0.68,
  },
}

// ============================================
// EXPORT ALL STYLES
// ============================================

export const STYLES: GraphicStyle[] = [
  industrialStyle,
  minimalStyle,
  gradientStyle,
  boldStyle,
  neonStyle,
]

export const STYLES_MAP: Record<StyleId, GraphicStyle> = {
  industrial: industrialStyle,
  minimal: minimalStyle,
  gradient: gradientStyle,
  bold: boldStyle,
  neon: neonStyle,
}

export const getStyle = (id: StyleId): GraphicStyle => {
  return STYLES_MAP[id] || industrialStyle
}

export const getStyleNames = (): { id: StyleId; name: string; nameDE: string }[] => {
  return STYLES.map((s) => ({ id: s.id, name: s.name, nameDE: s.nameDE }))
}
