'use client'
// components/MatchRow.tsx

import type { Match, MatchStatus, GoalEvent } from '@/types/football'

const LIVE_STATUSES: MatchStatus[] = ['1H', 'HT', '2H', 'ET', 'P']

function isLive(status: MatchStatus) {
  return LIVE_STATUSES.includes(status)
}

function isFinished(status: MatchStatus) {
  return ['FT', 'AET', 'PEN'].includes(status)
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('th-TH', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  }) + ' น.'
}

function statusLabel(match: Match): { text: string; color: string } {
  switch (match.status) {
    case 'NS':   return { text: formatTime(match.date), color: 'var(--muted)' }
    case 'HT':   return { text: 'พักครึ่ง', color: 'var(--gold)' }
    case '1H':
    case '2H':
    case 'ET':   return { text: `${match.minute}'`, color: 'var(--green)' }
    case 'P':    return { text: 'จุดโทษ', color: 'var(--green)' }
    case 'FT':   return { text: 'จบ', color: 'var(--muted)' }
    case 'AET':  return { text: 'จบ (ต่อเวลา)', color: 'var(--muted)' }
    case 'PEN':  return { text: 'จบ (จุดโทษ)', color: 'var(--muted)' }
    case 'PST':  return { text: 'เลื่อนการแข่ง', color: 'var(--red)' }
    case 'CANC': return { text: 'ยกเลิก', color: 'var(--red)' }
    default:     return { text: match.status, color: 'var(--muted)' }
  }
}

function ScorersList({ scorers, align }: { scorers: GoalEvent[]; align: 'left' | 'right' }) {
  if (!scorers.length) return null
  return (
    <div style={{
      fontSize: '10px', color: 'var(--muted)',
      textAlign: align, marginTop: '2px',
      lineHeight: 1.6,
    }}>
      {scorers
        .sort((a, b) => a.minute - b.minute)
        .map((s, i) => (
          <div key={i}>
            {align === 'right' && `${s.minute}' `}
            {s.player}{s.penalty ? ' (P)' : ''}{s.ownGoal ? ' (OG)' : ''}
            {align === 'left' && ` ${s.minute}'`}
          </div>
        ))}
    </div>
  )
}

export default function MatchRow({ match }: { match: Match }) {
  const live = isLive(match.status)
  const finished = isFinished(match.status)
  const { text: statusText, color: statusColor } = statusLabel(match)

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${live ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: '6px',
      padding: '10px 14px',
      display: 'grid',
      gridTemplateColumns: '70px 1fr auto 1fr',
      alignItems: 'center',
      gap: '10px',
    }}>
      {/* Status / Time */}
      <div style={{ textAlign: 'center' }}>
        {live && (
          <span style={{
            display: 'inline-block', width: '6px', height: '6px',
            background: 'var(--green)', borderRadius: '50%', marginRight: '4px',
            animation: 'pulse 1s infinite', verticalAlign: 'middle',
          }} />
        )}
        <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor }}>
          {statusText}
        </span>
        <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>
          {match.group ? `Group ${match.group}` : match.round}
        </div>
      </div>

      {/* Home team */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <span>{match.homeTeam.name}</span>
          <span style={{ fontSize: '16px' }}>{match.homeTeam.flag}</span>
        </div>
        <ScorersList scorers={match.homeScorers} align="right" />
      </div>

      {/* Score */}
      <div style={{
        background: 'var(--bg)',
        borderRadius: '4px',
        padding: '4px 14px',
        fontFamily: 'var(--font-display)',
        fontSize: '20px', fontWeight: 700,
        letterSpacing: '3px',
        color: live ? 'var(--green)' : finished ? 'var(--text)' : 'var(--gold)',
        minWidth: '64px', textAlign: 'center',
      }}>
        {match.homeScore !== null && match.awayScore !== null
          ? `${match.homeScore}–${match.awayScore}`
          : 'vs'}
      </div>

      {/* Away team */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600 }}>
          <span style={{ fontSize: '16px' }}>{match.awayTeam.flag}</span>
          <span>{match.awayTeam.name}</span>
        </div>
        <ScorersList scorers={match.awayScorers} align="left" />
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  )
}
