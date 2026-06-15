'use client'
// components/BracketMatch.tsx

import type { Match } from '@/types/football'

interface Props {
  match?: Match
  // Fallback labels when match data isn't available yet (e.g. teams TBD)
  placeholderHome?: string
  placeholderAway?: string
}

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P']

function TeamLine({
  flag, name, score, winner, isLive,
}: {
  flag?: string
  name: string
  score: number | null | undefined
  winner: boolean
  isLive: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '4px 8px',
      background: winner ? 'rgba(245,200,66,.08)' : 'transparent',
      borderRadius: '3px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontSize: '11px',
        fontWeight: winner ? 700 : 500,
        color: winner ? 'var(--gold)' : 'var(--text)',
        minWidth: 0,
        overflow: 'hidden',
      }}>
        {flag && <span style={{ flexShrink: 0 }}>{flag}</span>}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </span>
      </div>
      {score !== undefined && (
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '13px', fontWeight: 700,
          color: isLive ? 'var(--green)' : winner ? 'var(--gold)' : 'var(--muted)',
          flexShrink: 0, marginLeft: '6px',
        }}>
          {score ?? '–'}
        </span>
      )}
    </div>
  )
}

export default function BracketMatch({ match, placeholderHome, placeholderAway }: Props) {
  if (!match) {
    return (
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '5px',
        padding: '4px',
        opacity: 0.5,
      }}>
        <TeamLine flag={undefined} name={placeholderHome ?? 'TBD'} score={undefined} winner={false} isLive={false} />
        <div style={{ height: '1px', background: 'var(--border)' }} />
        <TeamLine flag={undefined} name={placeholderAway ?? 'TBD'} score={undefined} winner={false} isLive={false} />
      </div>
    )
  }

  const live = LIVE_STATUSES.includes(match.status)
  const finished = ['FT', 'AET', 'PEN'].includes(match.status)
  const homeWin = finished && (match.homeScore ?? 0) > (match.awayScore ?? 0)
  const awayWin = finished && (match.awayScore ?? 0) > (match.homeScore ?? 0)

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${live ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: '5px',
      padding: '4px',
      position: 'relative',
    }}>
      {live && (
        <div style={{
          position: 'absolute', top: '-6px', right: '6px',
          fontSize: '8px', fontWeight: 700, color: 'var(--green)',
          background: 'var(--bg)', padding: '0 4px', borderRadius: '4px',
        }}>
          ● {match.minute}'
        </div>
      )}
      <TeamLine
        flag={match.homeTeam.flag} name={match.homeTeam.name}
        score={match.homeScore} winner={homeWin} isLive={live}
      />
      <div style={{ height: '1px', background: 'var(--border)' }} />
      <TeamLine
        flag={match.awayTeam.flag} name={match.awayTeam.name}
        score={match.awayScore} winner={awayWin} isLive={live}
      />
      {/* Date/time below */}
      <div style={{ fontSize: '9px', color: 'var(--muted)', textAlign: 'center', marginTop: '3px' }}>
        {finished ? 'จบแล้ว' : new Date(match.date).toLocaleString('th-TH', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          timeZone: 'Asia/Bangkok',
        })}
      </div>
    </div>
  )
}
