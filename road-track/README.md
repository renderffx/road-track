# Infrastructure Trace

Real-time road damage detection and reporting system.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Features

- **SCAN** - Upload photo → AI detects damage → Submit trace
- **MAP** - Dark Leaflet map with all traces → Click markers → View evidence
- **RADAR** - Spinning radar → Audio pings when near traces

## Setup (Real Backend)

### 1. Create Upstash Redis Database

1. Go to https://console.upstash.com
2. Click **Create Database**
3. Choose **Regional** (free tier)
4. Copy the **REST URL** and **REST Token**

### 2. Add Environment Variables

Create `.env.local` in the project root:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

### 3. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then add env vars in Vercel dashboard:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

## Without Env Vars

App works 100% locally with localStorage! All traces are saved to browser.

## Tech Stack

- Next.js 14 (App Router)
- Zustand (State)
- Leaflet + CartoDB (Maps - FREE)
- Upstash Redis (Cloud Sync)
- Web Audio API (Radar)

## Files

```
src/
├── app/
│   ├── page.tsx          # Main app
│   ├── api/traces/       # REAL API endpoint with Redis
│   └── globals.css       # Dark theme UI
├── components/
│   ├── Scanner.tsx       # Upload + AI + blur
│   ├── MapView.tsx       # Leaflet dark map
│   ├── Radar.tsx         # Sonic radar
│   ├── ModeSelector.tsx   # Mode tabs
│   ├── StatusBar.tsx      # Telemetry
│   └── EvidenceCard.tsx    # Evidence popup
├── store/index.ts        # Zustand state
└── types/index.ts        # TypeScript
```
