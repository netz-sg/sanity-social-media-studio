import { DocumentActionComponent } from 'sanity'
import { ImageIcon } from '@sanity/icons'

/**
 * Custom Action: Social Media Graphics Generator for Aftershow Stories
 * Generates Instagram Story Graphics (1080x1920) for aftershow stories
 */
export const generateAfterShowSocialGraphicsAction: DocumentActionComponent = (props) => {
  const { id, type, draft, published } = props

  // Only show for aftershowStory documents
  if (type !== 'aftershowStory') {
    return null
  }

  const doc = published || draft

  if (!doc) {
    return null
  }

  return {
    label: 'Generate Social Graphics',
    icon: ImageIcon,
    onHandle: async () => {
      const locale = (doc as any).language || 'de'

      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      const storyUrl = `${baseUrl}/api/og/aftershow-story?id=${id}&locale=${locale}`
      const feedUrl = `${baseUrl}/api/og/aftershow-feed?id=${id}&locale=${locale}`

      try {
        const storyTab = window.open(storyUrl, '_blank')

        setTimeout(() => {
          const feedTab = window.open(feedUrl, '_blank')

          if (!storyTab || !feedTab) {
            alert('⚠️ Popup blocker active!\n\nPlease allow pop-ups for this site and try again.\n\nOr open the links manually:\n\nStory: ' + storyUrl + '\n\nFeed: ' + feedUrl)
          }
        }, 800)

        console.log('✅ Social Graphics are being generated...')
        console.log('Story (1080x1920):', storyUrl)
        console.log('Feed (1080x1080):', feedUrl)
      } catch (error) {
        console.error('❌ Error generating social graphics:', error)
        alert('❌ Error generating social graphics.\n\nPlease try again or open the links manually:\n\nStory: ' + storyUrl + '\n\nFeed: ' + feedUrl)
      }
    },
  }
}
