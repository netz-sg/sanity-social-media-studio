/**
 * Sanity Social Media Studio Plugin
 *
 * A comprehensive social media management tool for Sanity Studio.
 * Create graphics, schedule posts, manage templates, CSV import, and more.
 */

import { definePlugin } from 'sanity'
import { ImageIcon } from '@sanity/icons'
import { SocialMediaStudioToolV2 } from './tools/SocialMediaStudioToolV2'

export const socialMediaStudioTool = definePlugin({
  name: 'social-media-studio-tool',
  tools: [
    {
      name: 'social-media-studio',
      title: 'Social Media Studio',
      icon: ImageIcon,
      component: SocialMediaStudioToolV2,
    },
  ],
})

// Re-export everything consumers might need
export { SocialMediaStudioToolV2 } from './tools/SocialMediaStudioToolV2'
export { SocialMediaStudioTool as GraphicsStudio } from './tools/SocialMediaStudioTool'
export { socialMediaTemplateType } from './schemas/socialMediaTemplate'
export { lateApiSettingsType } from './schemas/lateApiSettings'
export { generateSocialGraphicsAction } from './actions/generateSocialGraphicsAction'
export { generateNewsSocialGraphicsAction } from './actions/generateNewsSocialGraphicsAction'
export { generateAfterShowSocialGraphicsAction } from './actions/generateAfterShowSocialGraphicsAction'

// Types
export type * from './lib/types'
export type * from './components/social-media/types'
