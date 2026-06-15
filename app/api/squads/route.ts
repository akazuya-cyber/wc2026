// app/api/squads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchSquad } from '@/lib/football-api'
import type { ApiResponse } from '@/types/football'

export const dynamic = 'force-dynamic'

// GET /api/squads?teamId=2 → squad for team ID 2 (France on api-football)
export async function GET(req: NextRequest) {
  try {
    const teamId = Number(req.nextUrl.searchParams.get('teamId'))
    if (!teamId || isNaN(teamId)) {
      return NextResponse.json({ error: 'teamId query param required' }, { status: 400 })
    }
    const data = await fetchSquad(teamId)
    const body: ApiResponse<typeof data> = {
      data,
      updatedAt: new Date().toISOString(),
      cached: false,
    }
    // Squads are stable — cache for 24h
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[/api/squads]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
