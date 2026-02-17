# Social Media Posting

Post directly to multiple social media platforms from within Sanity Studio using the [Late](https://getlate.dev) scheduling backend.

---

## Supported Platforms

| Platform | Post Types | Max Characters |
|:---------|:-----------|:--------------:|
| Instagram | Feed, Story, Reel, Carousel | 2,200 |
| Facebook | Post | 63,206 |
| Threads | Post | 500 |
| X (Twitter) | Tweet | 280 |

---

## Features

### Multi-Platform Posting
Compose a single post and publish it to multiple platforms simultaneously. The plugin automatically validates character limits per platform.

### Scheduling
Schedule posts for later with full timezone support. Choose exact date and time for each post.

### Media Attachments
Attach images and media to your posts — including graphics created with the built-in [Graphics Studio](Graphics-Studio).

### Character Count
Real-time character counting per platform, so you never exceed the limit.

### Instagram Format Selector
Choose between Feed, Story, Reel, or Carousel formats when posting to Instagram.

### Device Mockup Preview
Preview how your post will look on a mobile device before publishing.

---

## Setup

### 1. Create a Late Account

Sign up at [getlate.dev](https://getlate.dev) and get your API key.

### 2. Configure API Routes

Set up the Late API proxy in your Next.js app. See **[API Routes Setup](API-Routes-Setup)** for details.

### 3. Enter API Key in Settings

Open the **Settings** tab in the Social Media Studio and enter your Late API key. It will be stored securely as a Sanity document — no environment variable needed.

### 4. Connect Accounts

Still in the **Settings** tab, click "Sync Accounts" to connect your social media accounts via Late.

---

## How It Works

1. **Compose** — Write your post content
2. **Select platforms** — Choose where to publish (Instagram, Facebook, Threads, X)
3. **Attach media** — Add images or graphics
4. **Schedule or post** — Publish immediately or schedule for later
5. **Track** — Monitor status in the [Post Calendar](Post-Calendar)

---

## Related

- **[Post Calendar](Post-Calendar)** — View and manage scheduled posts
- **[Templates & Drafts](Templates-and-Drafts)** — Save and reuse post content
- **[API Routes Setup](API-Routes-Setup)** — Backend proxy configuration
