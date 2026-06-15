// app/api/scorers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { fetchTopScorers } from '@/lib/football-api'
import type { ApiResponse } from '@/types/football'

export const dynamic = 'force-dynamic'

// GET /api/scorers          → top 10
// GET /api/scorers?limit=20 → top N
export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 10)
    const data  = await fetchTopScorers(limit)
    const body: ApiResponse<typeof data> = {
      data,
      updatedAt: new Date().toISOString(),
      cached: false,
    }
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('[/api/scorers]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
