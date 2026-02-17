# API Routes Setup

The plugin requires backend API routes for server-side graphics rendering and social media posting via the Late API. This guide covers the Next.js setup.

---

## Required Routes

| Route | Purpose |
|:------|:--------|
| `/api/social-graphics` | Server-side graphic rendering |
| `/api/late/[...path]` | Late API proxy for social media posting |

---

## 1. Social Graphics Endpoint

This route receives graphic configuration from the plugin and returns a rendered PNG image using `@napi-rs/canvas`.

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

### Dependencies

Make sure `@napi-rs/canvas` is installed in your Next.js project:

```bash
npm install @napi-rs/canvas
```

---

## 2. Late API Proxy

The posting and scheduling features use [Late](https://getlate.dev) as the backend. The API key is configured directly in the plugin's **Settings tab** inside Sanity Studio and stored as a Sanity document — no environment variable needed.

This proxy route reads the key from Sanity and forwards requests to the Late API:

```ts
// app/api/late/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
})

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const settings = await sanityClient.fetch(
    `*[_type == "lateApiSettings"][0]{ apiKey }`
  )
  const path = params.path.join('/')

  const response = await fetch(`https://api.getlate.dev/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(await req.json()),
  })

  const data = await response.json()
  return NextResponse.json(data)
}
```

### Why a Proxy?

The proxy route keeps things secure by:
- Never exposing the Late API key to the client
- Reading the key from Sanity server-side and forwarding requests

> **Note:** The Late API key is managed within the plugin's **Settings tab** in Sanity Studio — not via environment variables.

---

## Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
```

---

## Related

- **[Getting Started](Getting-Started)** — Full setup guide
- **[Graphics Studio](Graphics-Studio)** — Uses the social graphics endpoint
- **[Social Media Posting](Social-Media-Posting)** — Uses the Late API proxy
