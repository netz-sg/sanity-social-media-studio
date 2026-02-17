import { defineType, defineField } from 'sanity'
import { RocketIcon } from '@sanity/icons'

export const lateApiSettingsType = defineType({
  name: 'lateApiSettings',
  title: 'Late API Settings',
  type: 'document',
  icon: RocketIcon,
  description: 'Configuration for social media posting via getlate.dev API',
  fields: [
    defineField({
      name: 'apiKey',
      title: 'Late API Key',
      type: 'string',
      description: 'Your API key from getlate.dev (starts with sk_)',
      validation: (Rule) =>
        Rule.required()
          .regex(/^sk_[a-zA-Z0-9]{64}$/, {
            name: 'Late API Key',
            invert: false,
          })
          .error('API Key must start with sk_ and be 64 characters long'),
    }),

    defineField({
      name: 'profileId',
      title: 'Profile ID',
      type: 'string',
      description: 'Your Late Profile ID (e.g. 6966bd7f1ce5907c15880fd6 or prof_...)',
      validation: (Rule) =>
        Rule.required()
          .min(20)
          .error('Profile ID is required (minimum 20 characters)'),
    }),

    defineField({
      name: 'connectedAccounts',
      title: 'Connected Accounts',
      type: 'array',
      description: 'Your connected social media accounts (synced automatically)',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'accountId',
              title: 'Account ID',
              type: 'string',
            },
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Threads', value: 'threads' },
                  { title: 'X (Twitter)', value: 'twitter' },
                ],
              },
            },
            {
              name: 'username',
              title: 'Username',
              type: 'string',
            },
            {
              name: 'isActive',
              title: 'Active',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'connectedAt',
              title: 'Connected At',
              type: 'datetime',
            },
          ],
          preview: {
            select: {
              platform: 'platform',
              username: 'username',
              isActive: 'isActive',
            },
            prepare({ platform, username, isActive }) {
              const platformEmojis: Record<string, string> = {
                instagram: '📸',
                facebook: '👥',
                threads: '🧵',
                twitter: '🐦',
              }
              const emoji = platformEmojis[platform] || '📱'
              const status = isActive ? '✅' : '⏸️'
              
              return {
                title: `${emoji} ${platform} - @${username}`,
                subtitle: status + (isActive ? ' Active' : ' Paused'),
              }
            },
          },
        },
      ],
    }),

    defineField({
      name: 'defaultTimezone',
      title: 'Default Timezone',
      type: 'string',
      description: 'Timezone for scheduled posts',
      initialValue: 'Europe/Berlin',
      options: {
        list: [
          { title: 'Berlin/Europe (Europe/Berlin)', value: 'Europe/Berlin' },
          { title: 'London (Europe/London)', value: 'Europe/London' },
          { title: 'New York (America/New_York)', value: 'America/New_York' },
          { title: 'Los Angeles (America/Los_Angeles)', value: 'America/Los_Angeles' },
          { title: 'UTC', value: 'UTC' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'autoPublish',
      title: 'Auto-Publish',
      type: 'boolean',
      description: 'Automatically post to social media when content is published',
      initialValue: false,
    }),

    defineField({
      name: 'lastSync',
      title: 'Last Sync',
      type: 'datetime',
      description: 'When were the accounts last synchronized',
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      profileId: 'profileId',
      accountCount: 'connectedAccounts',
      lastSync: 'lastSync',
    },
    prepare({ accountCount, lastSync }) {
      const count = accountCount?.length || 0
      const syncDate = lastSync ? new Date(lastSync).toLocaleDateString() : 'Never'
      
      return {
        title: '🚀 Late API Settings',
        subtitle: `${count} account(s) connected | Last sync: ${syncDate}`,
        media: RocketIcon,
      }
    },
  },
})
