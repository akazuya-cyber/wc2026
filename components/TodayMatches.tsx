'use client'
// components/TodayMatches.tsx

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Match, MatchStatus } from '@/types/football'
import { formatThaiTime, formatThaiDateShort, nowInTimeZone } from '@/lib/date-utils'

const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'P']

function isLive(status: MatchStatus) {
  return LIVE_STATUSES.includes(status)
}

function formatTime(dateStr: string): string {
  return formatThaiTime(dateStr)
}

function formatDate(dateStr: string): string {
  // dateStr is an ISO timestamp; render it as Bangkok wall-clock date
  const bangkokNow = nowInTimeZone('Asia/Bangkok')
  const utcDate = new Date(dateStr)
  // Shift the UTC instant into Bangkok wall-clock by re-using nowInTimeZone's
  // approach: format the given instant's date parts in Asia/Bangkok.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(utcDate)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? '1'
  const d = new Date(parseInt(get('year'), 10), parseInt(get('month'), 10) - 1, parseInt(get('day'), 10))
  return formatThaiDateShort(d)
}

function ScoreDisplay({ match }: { match: Match }) {
  const live = isLive(match.status)
  const finished = ['FT', 'AET', 'PEN'].includes(match.status)
  const hasPenalties =
    match.status === 'PEN' &&
    match.homePenaltyScore !== null &&
    match.awayPenaltyScore !== null

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        background: 'var(--bg)',
        padding: '2px 8px',
        borderRadius: '3px',
        fontFamily: 'var(--font-display)',
        fontSize: '16px',
        fontWeight: 700,
        letterSpacing: '2px',
        color: live ? 'var(--green)' : finished ? 'var(--text)' : 'var(--gold)',
        minWidth: '44px',
        textAlign: 'center',
      }}>
        {match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore} – ${match.awayScore}`
          : '– : –'}
      </div>
      {hasPenalties && (
        <div style={{ fontSize: '9px', color: 'var(--gold)', fontWeight: 600, marginTop: '1px' }}>
          ({match.homePenaltyScore}-{match.awayPenaltyScore} จุดโทษ)
        </div>
      )}
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const live = isLive(match.status)

  return (
    <div style={{
      background: 'var(--surface2)',
      border: `1px solid ${live ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: '5px',
      padding: '8px 12px',
      minWidth: '210px',
      flexShrink: 0,
      textAlign: 'center',
    }}>
      {/* Group + Venue */}
      <div style={{ fontSize: '9px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>
        {match.group ? `GROUP ${match.group}` : match.round} · {match.venue}
      </div>

      {/* Teams + Score */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: 600 }}>
        <span>{match.homeTeam.flag}</span>
        <span>{match.homeTeam.code}</span>
        <ScoreDisplay match={match} />
        <span>{match.awayTeam.code}</span>
        <span>{match.awayTeam.flag}</span>
      </div>

      {/* Time / Status */}
      <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '4px' }}>
        {live ? (
          <span>
            <span style={{
              display: 'inline-block', width: '6px', height: '6px',
              background: 'var(--green)', borderRadius: '50%', marginRight: '4px',
              animation: 'pulse 1s infinite',
            }} />
            {match.minute}'
          </span>
        ) : match.status === 'HT' ? (
          <span style={{ color: 'var(--gold)' }}>พักครึ่ง</span>
        ) : match.status === 'FT' ? (
          <span>จบแล้ว</span>
        ) : match.status === 'AET' ? (
          <span>จบ (ต่อเวลา)</span>
        ) : match.status === 'PEN' ? (
          <span>จบ (จุดโทษ)</span>
        ) : (
          formatTime(match.date)
        )}
      </div>
    </div>
  )
}

export default function TodayMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Render the date label only after mount so the server's render pass
  // (which has no "current time") doesn't disagree with the client's.
  const [todayLabel, setTodayLabel] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches')
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
    // Auto-refresh every 60s
    const id = setInterval(fetchMatches, 60_000)
    return () => clearInterval(id)
  }, [fetchMatches])

  useEffect(() => {
    setTodayLabel(formatDate(new Date().toISOString()))
  }, [])

  const hasLive = matches.some(m => isLive(m.status))

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold)',
      borderRadius: '6px',
      padding: '10px 14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '1px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          📅 วันนี้{todayLabel ? ` — ${todayLabel}` : ''}
          {hasLive && (
            <span style={{
              fontSize: '10px',
              background: 'rgba(34,197,94,.15)',
              color: 'var(--green)',
              border: '1px solid rgba(34,197,94,.3)',
              borderRadius: '10px',
              padding: '2px 8px',
              fontWeight: 600,
            }}>
              ● LIVE
            </span>
          )}
        </span>
        <Link href="/schedule" style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 500 }}>
          ดูกำหนดการทั้งหมด →
        </Link>
      </div>

      {/* Match cards */}
      {loading ? (
        <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '12px 0' }}>กำลังโหลด...</div>
      ) : error ? (
        <div style={{ color: 'var(--red)', fontSize: '12px', padding: '8px 0' }}>
          ⚠️ โหลดไม่ได้: {error}
        </div>
      ) : matches.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '8px 0' }}>
          ไม่มีแมตช์วันนี้
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {matches.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}
