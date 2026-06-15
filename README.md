# WC2026 — FIFA World Cup 2026 Dashboard

Live scores · Group standings · Top scorers · Squad viewer

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.local.example .env.local
# → Edit .env.local and add your FOOTBALL_API_KEY

# 3. Run development server
npm run dev
# → Open http://localhost:3000
```

## Getting an API Key

1. Sign up at https://dashboard.api-football.com/register
2. Free tier: **100 requests/day** — enough for personal use
3. Copy your key into `.env.local` as `FOOTBALL_API_KEY`

## Project Structure

```
wc2026/
├── app/
│   ├── layout.tsx          Root layout (fonts, metadata)
│   ├── globals.css         CSS variables & resets
│   ├── page.tsx            Home page
│   ├── schedule/           Full match schedule page
│   ├── knockout/           Bracket page
│   └── api/
│       ├── standings/      GET /api/standings
│       ├── matches/        GET /api/matches[?date=&round=]
│       ├── scorers/        GET /api/scorers[?limit=]
│       └── squads/         GET /api/squads?teamId=
├── components/
│   ├── Topbar.tsx
│   ├── TodayMatches.tsx
│   ├── GroupTable.tsx
│   ├── GroupsGrid.tsx
│   ├── TopScorers.tsx
│   ├── ThirdPlacePanel.tsx
│   └── SquadModal.tsx
├── lib/
│   └── football-api.ts     API wrapper + in-memory cache
└── types/
    └── football.ts         Shared TypeScript types
```

## Architecture

```
Browser (React components)
    ↕  fetch every 30–300s
Next.js API Routes (/api/*)
    ↕  in-memory cache (TTL-based)
API-Football (api-sports.io)
    ↕  max 100 req/day on free tier
```

The cache layer in `lib/football-api.ts` ensures:
- Live match data refreshes every 60s max
- Standings refresh every 5 minutes
- Squad data cached for 24h (rarely changes)

## Deploy to Vercel

```bash
npm i -g vercel
vercel
# Add FOOTBALL_API_KEY in Vercel dashboard → Settings → Environment Variables
```

## Data Source

[API-Football](https://www.api-football.com/) via api-sports.io  
World Cup 2026: `league=1`, `season=2026`
