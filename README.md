# Sanity Social Media Studio

A comprehensive social media management plugin for [Sanity Studio](https://www.sanity.io/). Create graphics, schedule posts across multiple platforms, manage templates, import from CSV, and more — all from within your Sanity Studio.

![Sanity v3+](https://img.shields.io/badge/Sanity-v3+-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

---

## Features

### 🎨 Graphics Studio
- **5 built-in styles**: Industrial, Minimal, Gradient, Bold, Neon
- **Multiple formats**: Instagram Story (1080×1920), Feed Square (1080×1080), Feed Portrait (1080×1440), Facebook, Twitter/X
- **Live preview** with real-time editing
- **Custom watermark & logo** support
- **Content selection** from Sanity documents (posts, concerts, etc.)
- **Server-side rendering** with `@napi-rs/canvas`

### 📱 Social Media Posting
- **Multi-platform posting**: Instagram, Facebook, Threads, X (Twitter)
- **Schedule posts** with timezone support
- **Attach images/media** to posts
- **Draft & template system** for reusable content
- **Character count** per platform

### 📅 Post Calendar
- **Monthly calendar view** of scheduled posts
- **Visual status indicators** (scheduled, published, failed)
- **Quick actions** from calendar entries

### 📋 CSV Import
- **Bulk import** social media posts from CSV
- **Template mapping** with placeholders
- **Preview before import**

### 🖼️ Batch Images
- **Bulk image generation** for multiple posts
- **Consistent branding** across all generated images

### 📝 Drafts & Templates
- **Save post drafts** for later
- **Reusable templates** with placeholders: `{title}`, `{date}`, `{location}`, `{band}`, `{url}`, `{venue}`, `{price}`
- **Template categories**: Concert, News, Giveaway, Tour, Aftershow, Release, Video, General

### ⚡ Document Actions
- **One-click graphics generation** from concert, news, and aftershow story documents
- Opens Story + Feed format in new tabs

---

## Installation

```bash
npm install sanity-social-media-studio
```

## Setup

### 1. Add the plugin to your Sanity config

```ts
// sanity.config.ts
import { defineConfig } from 'sanity'
import { socialMediaStudioTool } from 'sanity-social-media-studio'

export default defineConfig({
  // ...your config
  plugins: [
    socialMediaStudioTool(),
    // ...other plugins
  ],
})
```

### 2. Register the schemas

```ts
// sanity.config.ts (or your schema index)
import {
  socialMediaTemplateType,
  lateApiSettingsType,
} from 'sanity-social-media-studio'

export default defineConfig({
  // ...
  schema: {
    types: [
      // ...your types
      socialMediaTemplateType,
      lateApiSettingsType,
    ],
  },
})
```

### 3. Add document actions (optional)

```ts
// sanity.config.ts
import {
  generateSocialGraphicsAction,
  generateNewsSocialGraphicsAction,
  generateAfterShowSocialGraphicsAction,
} from 'sanity-social-media-studio'

export default defineConfig({
  // ...
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'concert') {
        return [...prev, generateSocialGraphicsAction]
      }
      if (context.schemaType === 'post') {
        return [...prev, generateNewsSocialGraphicsAction]
      }
      if (context.schemaType === 'aftershowStory') {
        return [...prev, generateAfterShowSocialGraphicsAction]
      }
      return prev
    },
  },
})
```

### 4. Set up API routes (Next.js)

The plugin expects the following API endpoints on your Next.js frontend for full functionality:

#### Social Graphics Generation

```ts
// app/api/social-graphics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderSocialGraphic } from 'sanity-social-media-studio/lib'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const buffer = await renderSocialGraphic(body)
  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'image/png' },
  })
}
```

#### Late API Proxy (Social Media Posting)

The posting feature uses [Late](https://getlate.dev) as the social media scheduling backend. You need a proxy API route:

```ts
// app/api/late/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const apiKey = process.env.LATE_API_KEY
  const path = params.path.join('/')

  const response = await fetch(`https://api.getlate.dev/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(await req.json()),
  })

  const data = await response.json()
  return NextResponse.json(data)
}
```

### 5. Environment Variables

```env
# Required for social media posting (Late API)
LATE_API_KEY=sk_your_api_key_here

# Required for Sanity client
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

---

## Configuration

### Graphics Styles

The plugin ships with 5 built-in styles:

| Style | Description |
|-------|-------------|
| **Industrial** | Bold, dark, high-contrast with industrial textures |
| **Minimal** | Clean, minimalist with subtle typography |
| **Gradient** | Vibrant gradient backgrounds with modern feel |
| **Bold** | Large, impactful text with strong colors |
| **Neon** | Glowing neon effects on dark backgrounds |

### Supported Platforms

| Platform | Post Types | Max Characters |
|----------|-----------|---------------|
| Instagram | Feed, Story, Reel, Carousel | 2,200 |
| Facebook | Post | 63,206 |
| Threads | Post | 500 |
| X (Twitter) | Tweet | 280 |

### Template Placeholders

Use these placeholders in your templates:

- `{title}` - Content title
- `{date}` - Event date
- `{location}` - Event location/city
- `{band}` - Band/artist name
- `{url}` - Link URL
- `{time}` - Event time
- `{venue}` - Venue name
- `{price}` - Ticket price

---

## Architecture

```
src/
├── index.ts                    # Plugin entry point (definePlugin)
├── lib/
│   ├── types.ts               # Core types (formats, styles, options)
│   ├── styles.ts              # 5 built-in graphic styles
│   ├── renderer.ts            # Server-side canvas renderer (@napi-rs/canvas)
│   └── index.ts               # Lib barrel export
├── tools/
│   ├── SocialMediaStudioToolV2.tsx  # Main plugin UI (6 tabs)
│   ├── SocialMediaStudioTool.tsx    # Graphics Studio tab component
│   └── ConcertDayGenerator.tsx      # Concert day graphics generator
├── components/
│   ├── studio/                # Graphics Studio UI components
│   │   ├── ContentSelectionPanel.tsx
│   │   ├── FormatStylePanel.tsx
│   │   ├── TextContentPanel.tsx
│   │   ├── DesignSettingsPanel.tsx
│   │   ├── LogoSettingsPanel.tsx
│   │   ├── PreviewActionsPanel.tsx
│   │   ├── PreviewCanvas.tsx
│   │   ├── StyleThumbnail.tsx
│   │   ├── Slider.tsx
│   │   └── constants.ts
│   └── social-media/          # Social media posting components
│       ├── types.ts
│       ├── InstagramFormatSelector.tsx
│       ├── DeviceMockup.tsx
│       ├── SettingsTab.tsx
│       └── DraftsTemplatesTab.tsx
├── schemas/
│   ├── socialMediaTemplate.ts # Template document schema
│   ├── lateApiSettings.ts     # API settings singleton schema
│   └── index.ts
└── actions/
    ├── generateSocialGraphicsAction.ts
    ├── generateNewsSocialGraphicsAction.ts
    ├── generateAfterShowSocialGraphicsAction.ts
    └── index.ts
```

---

## Requirements

- **Sanity Studio** v3 or later
- **React** 18 or 19
- **@sanity/ui** v2+
- **@sanity/icons** v3+
- **@napi-rs/canvas** (optional, for server-side graphics rendering)
- **[Late](https://getlate.dev)** account (optional, for social media posting/scheduling)

---

## Development

```bash
# Clone the repo
git clone https://github.com/netz-sg/sanity-social-media-studio.git
cd sanity-social-media-studio

# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE) © netz-sg

---

## Credits

- Built with [Sanity](https://www.sanity.io/)
- Social media scheduling powered by [Late](https://getlate.dev)
- Server-side rendering with [@napi-rs/canvas](https://github.com/nicolo-ribaudo/canvas)
