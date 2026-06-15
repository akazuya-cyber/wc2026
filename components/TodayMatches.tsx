'use client'
// components/TodayMatches.tsx

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { Match, MatchStatus } from '@/types/football'

const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'P']

function isLive(status: MatchStatus) {
  return LIVE_STATUSES.includes(status)
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  }) + ' น.'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    timeZone: 'Asia/Bangkok',
  })
}

function ScoreDisplay({ match }: { match: Match }) {
  const live = isLive(match.status)
  const finished = ['FT', 'AET', 'PEN'].includes(match.status)

  return (
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

  const today = new Date()
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
          📅 วันนี้ — {formatDate(today.toISOString())}
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
