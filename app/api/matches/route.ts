// app/api/matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchTodayMatches, fetchMatchesByDate, fetchAllMatches } from '@/lib/football-api'
import type { ApiResponse } from '@/types/football'

export const dynamic = 'force-dynamic'

// GET /api/matches              → today's matches
// GET /api/matches?date=YYYY-MM-DD  → specific date
// GET /api/matches?round=Group+Stage → by round
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const date  = searchParams.get('date')
    const round = searchParams.get('round')

    let data
    if (date) {
      data = await fetchMatchesByDate(date)
    } else if (round === 'all') {
      data = await fetchAllMatches()
    } else if (round) {
      data = await fetchAllMatches(round)
    } else {
      data = await fetchTodayMatches()
    }

    const body: ApiResponse<typeof data> = {
      data,
      updatedAt: new Date().toISOString(),
      cached: false,
    }

    // Live matches: short cache; schedule: longer
    const hasLive = data.some(m => ['1H','HT','2H','ET','P'].includes(m.status))
    const maxAge = hasLive ? 30 : 300

    return NextResponse.json(body, {
      headers: { 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=15` },
    })
  } catch (err) {
    console.error('[/api/matches]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
