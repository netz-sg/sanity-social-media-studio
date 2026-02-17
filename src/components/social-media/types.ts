import type { ContentItem } from '../../lib/types'

// ============================================
// PLATFORM & ACCOUNT TYPES
// ============================================

export type Platform = 'instagram' | 'facebook' | 'threads' | 'twitter'
export type InstagramPostType = 'feed' | 'story' | 'reel' | 'carousel'
export type InstagramFormat = 'square' | 'portrait' | 'landscape'

export interface FormatDimensions {
  width: number
  height: number
  ratio: string
  label: string
}

export const INSTAGRAM_FORMATS: Record<InstagramFormat, FormatDimensions> = {
  square: {
    width: 1080,
    height: 1080,
    ratio: '1:1',
    label: 'Square (1:1)',
  },
  portrait: {
    width: 1080,
    height: 1350,
    ratio: '4:5',
    label: 'Portrait (4:5)',
  },
  landscape: {
    width: 1080,
    height: 566,
    ratio: '1.91:1',
    label: 'Landscape (1.91:1)',
  },
}

export interface SocialMediaAccount {
  accountId: string
  platform: Platform
  username: string
  isActive: boolean
}

// ============================================
// TEMPLATE TYPES
// ============================================

export interface SocialMediaTemplate {
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

// ============================================
// CONCERT TYPES
// ============================================

export interface Concert {
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

// ============================================
// POST STATE TYPES
// ============================================

export interface PostState {
  content: string
  hashtags: string
  photographer: string
  selectedPlatforms: Platform[]
  platformTexts: Record<Platform, string>
  platformFirstComments: Record<Platform, string> // NEW: First comment per platform
  instagramPostType: InstagramPostType
  instagramFormat: InstagramFormat
  scheduledFor: string | null
  publishNow: boolean
  selectedContent: ContentItem | null
  mediaUrls: string[]
  isUploading: boolean
  isPosting: boolean
}

// ============================================
// CSV IMPORT TYPES
// ============================================

export interface CSVDraft {
  id: string
  content: string
  hashtags: string
  platforms: Platform[]
  instagramPostType: InstagramPostType
  scheduledFor: string | null
  mediaUrl?: string
  firstComment?: string // NEW: First comment for post
  status: 'pending' | 'posted' | 'failed' | 'scheduled'
  error?: string
  originalRow: number
}

export interface BatchImageData {
  file: File
  preview: string
  caption: string
  firstComment?: string // NEW: First comment for post
  hashtags: string
  platforms: Platform[]
  instagramPostType: InstagramPostType
  instagramFormat: InstagramFormat
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  uploadedUrl?: string
  error?: string
}

// ============================================
// SCHEDULED POST TYPES
// ============================================

export interface ScheduledPost {
  _id: string
  content: string
  hashtags: string
  mediaUrls: string[]
  platforms: Platform[]
  instagramPostType?: InstagramPostType
  scheduledFor: string
  createdAt: string
  status: 'scheduled' | 'posted' | 'failed' | 'cancelled'
  error?: string
}

// ============================================
// LATE API TYPES
// ============================================

export interface LateAPIResponse {
  success: boolean
  data?: any
  error?: string
  message?: string
}

export interface LatePostPayload {
  text: string
  mediaUrls?: string[]
  platforms: Platform[]
  instagramPostType?: InstagramPostType
  scheduledFor?: string
}

