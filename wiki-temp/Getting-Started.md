# Getting Started

This guide walks you through installing and configuring **Sanity Social Media Studio** in your project.

---

## Prerequisites

- **Node.js** 18+
- **Sanity Studio** v3 or later
- **React** 18 or 19
- **@sanity/ui** v2+ and **@sanity/icons** v3+

### Optional

- **@napi-rs/canvas** — for server-side graphics rendering
- **[Late](https://getlate.dev) account** — for social media scheduling & posting

---

## Installation

```bash
npm install sanity-social-media-studio
```

---

## Setup

### 1. Register the plugin

```ts
// sanity.config.ts
import { defineConfig } from 'sanity'
import { socialMediaStudioTool } from 'sanity-social-media-studio'

export default defineConfig({
  // ...your config
  plugins: [
    socialMediaStudioTool(),
  ],
})
```

### 2. Add the schemas

```ts
import {
  socialMediaTemplateType,
  lateApiSettingsType,
} from 'sanity-social-media-studio'

export default defineConfig({
  // ...
  schema: {
    types: [
      socialMediaTemplateType,
      lateApiSettingsType,
    ],
  },
})
```

### 3. Add document actions *(optional)*

This enables one-click graphic generation from your document editor:

```ts
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

### 4. Set up API routes

See the **[API Routes Setup](API-Routes-Setup)** page for Next.js backend configuration.

### 5. Environment variables

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

> **Note:** The Late API key is configured directly in the plugin's **Settings tab** inside Sanity Studio — no environment variable needed.

---

## Next Steps

- **[Graphics Studio](Graphics-Studio)** — Create your first social media graphic
- **[Social Media Posting](Social-Media-Posting)** — Connect your accounts and start posting
- **[Templates & Drafts](Templates-and-Drafts)** — Set up reusable content templates
