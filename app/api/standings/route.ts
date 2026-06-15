// app/api/standings/route.ts
import { NextResponse } from 'next/server'
import { fetchStandings, getCacheInfo } from '@/lib/football-api'
import type { ApiResponse } from '@/types/football'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await fetchStandings()
    const { cached, age } = getCacheInfo('standings')
    const body: ApiResponse<typeof data> = {
      data,
      updatedAt: new Date().toISOString(),
      cached,
    }
    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'X-Cache-Age': age !== null ? String(age) : 'miss',
      },
    })
  } catch (err) {
    console.error('[/api/standings]', err)
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
