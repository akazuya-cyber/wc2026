'use client'
// components/ScheduleView.tsx

import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Match, MatchRound, MatchStatus } from '@/types/football'
import { groupMatchesByDate, formatDateLabel } from '@/lib/date-utils'
import MatchRow from './MatchRow'
import ScheduleFilters, { RoundFilter, StatusFilter } from './ScheduleFilters'

const ROUND_MAP: Record<RoundFilter, MatchRound | null> = {
  all:   null,
  group: 'Group Stage',
  r32:   'Round of 32',
  r16:   'Round of 16',
  qf:    'Quarter-finals',
  sf:    'Semi-finals',
  final: 'Final',
}

const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'P']
const FINISHED_STATUSES: MatchStatus[] = ['FT', 'AET', 'PEN']

export default function ScheduleView() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [round, setRound]     = useState<RoundFilter>('all')
  const [status, setStatus]   = useState<StatusFilter>('all')

  const fetchMatches = useCallback(async () => {
    try {
      const res  = await fetch('/api/matches?round=all')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setMatches(json.data)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMatches()
    // Refresh every 60s to pick up live score changes
    const id = setInterval(fetchMatches, 60_000)
    return () => clearInterval(id)
  }, [fetchMatches])

  // Apply filters
  const filtered = useMemo(() => {
    return matches.filter(m => {
      // Round filter
      if (round !== 'all') {
        const target = ROUND_MAP[round]
        if (target && m.round !== target) return false
      }
      // Status filter
      if (status === 'live' && !LIVE_STATUSES.includes(m.status)) return false
      if (status === 'finished' && !FINISHED_STATUSES.includes(m.status)) return false
      if (status === 'upcoming' && m.status !== 'NS') return false
      return true
    })
  }, [matches, round, status])

  const grouped = useMemo(() => groupMatchesByDate(filtered), [filtered])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <ScheduleFilters
        round={round}
        status={status}
        onRoundChange={setRound}
        onStatusChange={setStatus}
      />

      {loading && (
        <div style={{ color: 'var(--muted)', padding: '32px 0', textAlign: 'center' }}>
          กำลังโหลดกำหนดการ...
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--red)', padding: '16px 0' }}>
          ⚠️ โหลดไม่ได้: {error}
        </div>
      )}

      {!loading && !error && grouped.length === 0 && (
        <div style={{ color: 'var(--muted)', padding: '32px 0', textAlign: 'center' }}>
          ไม่พบแมตช์ตามตัวกรองที่เลือก
        </div>
      )}

      {grouped.map(day => (
        <div key={day.date}>
          {/* Date header */}
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px', fontWeight: 700,
            letterSpacing: '1px', color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '6px',
            paddingBottom: '4px',
            borderBottom: '1px solid var(--border)',
          }}>
            {formatDateLabel(day.date)}
            <span style={{ color: 'var(--muted)', fontWeight: 500, marginLeft: '8px', fontSize: '11px' }}>
              ({day.matches.length} แมตช์)
            </span>
          </div>

          {/* Matches for this day */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            {day.matches.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
