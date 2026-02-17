import { DocumentActionComponent } from 'sanity'
import { ImageIcon } from '@sanity/icons'

/**
 * Custom Action: News Social Graphics Generator
 * Powered by @napi-rs/canvas for advanced rendering
 *
 * Generates professional social media graphics for news posts:
 * - Instagram Story (1080x1920) - Portrait
 * - Instagram Feed (1080x1440) - Portrait
 */
export const generateNewsSocialGraphicsAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published } = props

  // Only show for post documents
  if (type !== 'post') {
    return null
  }

  const doc = published || draft

  if (!doc) {
    return null
  }

  return {
    label: 'Generate News Social Graphics',
    icon: ImageIcon,
    onHandle: async () => {
      const locale = (doc as any).language || 'de'

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      const timestamp = Date.now()
      const storyUrl = `${baseUrl}/api/news-graphics/story?id=${id}&locale=${locale}&t=${timestamp}`
      const feedUrl = `${baseUrl}/api/news-graphics/feed?id=${id}&locale=${locale}&t=${timestamp}`

      try {
        const storyTab = window.open(storyUrl, '_blank')

        setTimeout(() => {
          const feedTab = window.open(feedUrl, '_blank')

          if (!storyTab || !feedTab) {
            alert('⚠️ Popup blocker active!\n\nPlease allow pop-ups for this site and try again.\n\nOr open the links manually:\n\nStory: ' + storyUrl + '\n\nFeed: ' + feedUrl)
          }
        }, 800)

        console.log('✅ News Social Graphics are being generated...')
        console.log('Story (1080x1920):', storyUrl)
        console.log('Feed (1080x1440):', feedUrl)
      } catch (error) {
        console.error('❌ Error generating news social graphics:', error)
        alert('❌ Error generating social graphics.\n\nPlease try again or open the links manually:\n\nStory: ' + storyUrl + '\n\nFeed: ' + feedUrl)
      }
    },
  }
}
