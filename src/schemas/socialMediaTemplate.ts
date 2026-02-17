import { defineType, defineField } from 'sanity'
import { RocketIcon } from '@sanity/icons'

export const socialMediaTemplateType = defineType({
  name: 'socialMediaTemplate',
  title: 'Social Media Template',
  type: 'document',
  icon: RocketIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Template Name',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(100),
      description: 'Internal name for the template (e.g. "Concert Announcement")',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: '🎸 Concert Announcement', value: 'concert' },
          { title: '📰 News Update', value: 'news' },
          { title: '🎁 Giveaway', value: 'giveaway' },
          { title: '🗺️ Tour Date', value: 'tour' },
          { title: '📸 Aftershow Story', value: 'aftershow' },
          { title: '💿 Album/Release', value: 'release' },
          { title: '🎬 Video Release', value: 'video' },
          { title: '✨ General', value: 'general' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Template Text',
      type: 'text',
      rows: 8,
      validation: (Rule) => Rule.required().min(10).max(2200),
      description: 'Use placeholders: {title}, {date}, {location}, {band}, {url}, {time}, {venue}, {price}',
    }),
    defineField({
      name: 'hashtags',
      title: 'Default Hashtags',
      type: 'string',
      description: 'Hashtags separated by spaces (e.g. #YourBrand #Concert #Live)',
    }),
    defineField({
      name: 'platforms',
      title: 'Recommended Platforms',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: '📸 Instagram', value: 'instagram' },
          { title: '👥 Facebook', value: 'facebook' },
          { title: '🧵 Threads', value: 'threads' },
          { title: '🐦 X (Twitter)', value: 'twitter' },
        ],
      },
      description: 'Which platforms is this template best suited for?',
    }),
    defineField({
      name: 'instagramPostType',
      title: 'Instagram Post Type',
      type: 'string',
      options: {
        list: [
          { title: '📰 Feed', value: 'feed' },
          { title: '📖 Story', value: 'story' },
          { title: '🎬 Reel', value: 'reel' },
          { title: '🎠 Carousel', value: 'carousel' },
        ],
        layout: 'dropdown',
      },
      hidden: ({ parent }) => !parent?.platforms?.includes('instagram'),
    }),
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: '🇩🇪 Deutsch', value: 'de' },
          { title: '🇬🇧 English', value: 'en' },
        ],
        layout: 'radio',
      },
      initialValue: 'de',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'What is this template used for? When should it be used?',
    }),
    defineField({
      name: 'exampleData',
      title: 'Example Data',
      type: 'object',
      description: 'Example values for the placeholders (for preview)',
      fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'date', title: 'Date', type: 'string' },
        { name: 'location', title: 'Location', type: 'string' },
        { name: 'venue', title: 'Venue', type: 'string' },
        { name: 'time', title: 'Time', type: 'string' },
        { name: 'price', title: 'Price', type: 'string' },
        { name: 'url', title: 'URL', type: 'string' },
      ],
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
      description: 'Inactive templates are not shown in the selection',
    }),
    defineField({
      name: 'usageCount',
      title: 'Usage Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      description: 'How often has this template been used?',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      language: 'language',
      isActive: 'isActive',
      content: 'content',
    },
    prepare({ title, category, language, isActive, content }) {
      const categoryIcons: Record<string, string> = {
        concert: '🎸',
        news: '📰',
        giveaway: '🎁',
        tour: '🗺️',
        aftershow: '📸',
        release: '💿',
        video: '🎬',
        general: '✨',
      }
      
      const icon = categoryIcons[category as string] || '📝'
      const langFlag = language === 'de' ? '🇩🇪' : '🇬🇧'
      const status = isActive ? '✓' : '⏸'
      
      return {
        title: `${icon} ${title} ${langFlag}`,
        subtitle: `${status} ${content?.substring(0, 60)}...`,
      }
    },
  },
})
