'use client'
// components/BracketView.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Match, MatchRound } from '@/types/football'
import BracketMatch from './BracketMatch'

const ROUND_LABELS: Record<MatchRound, string> = {
  'Group Stage':    'รอบแบ่งกลุ่ม',
  'Round of 32':    'รอบ 32 ทีม',
  'Round of 16':    'รอบ 16 ทีม',
  'Quarter-finals': 'รอบ 8 ทีม',
  'Semi-finals':    'รอบรองชนะเลิศ',
  '3rd Place Final':'ชิงที่ 3',
  'Final':          'ชิงชนะเลิศ',
}

const BRACKET_ROUNDS: MatchRound[] = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Final',
]

// Expected number of matches per round (WC2026 format: 32 → 16 → 8 → 4 → 2 → 1)
const ROUND_MATCH_COUNT: Record<MatchRound, number> = {
  'Group Stage': 72,
  'Round of 32': 16,
  'Round of 16': 8,
  'Quarter-finals': 4,
  'Semi-finals': 2,
  '3rd Place Final': 1,
  'Final': 1,
}

interface Props {
  initialRound?: MatchRound
}

export default function BracketView({ initialRound }: Props) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches?round=all')
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
    const id = setInterval(fetchMatches, 60_000)
    return () => clearInterval(id)
  }, [fetchMatches])

  if (loading) return (
    <div style={{ color: 'var(--muted)', padding: '32px 0', textAlign: 'center' }}>
      กำลังโหลด bracket...
    </div>
  )

  if (error) return (
    <div style={{ color: 'var(--red)', padding: '16px 0' }}>
      ⚠️ โหลดไม่ได้: {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Anchor nav for jumping to a round */}
      <RoundNav />

      {/* Scrollable bracket */}
      <div style={{
        display: 'flex',
        gap: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {BRACKET_ROUNDS.map(round => (
          <RoundColumn
            key={round}
            round={round}
            matches={matches.filter(m => m.round === round)}
          />
        ))}
      </div>

      {/* 3rd place match — shown separately since it's not part of the main bracket */}
      <ThirdPlaceMatch matches={matches.filter(m => m.round === '3rd Place Final')} />
    </div>
  )
}

function RoundNav() {
  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {BRACKET_ROUNDS.map(round => (
        <a
          key={round}
          href={`#round-${round.replace(/\s/g, '-')}`}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '4px',
            padding: '5px 10px',
            fontSize: '11px', fontWeight: 600,
            color: 'var(--muted)',
            textDecoration: 'none',
          }}
        >
          {ROUND_LABELS[round]}
        </a>
      ))}
    </div>
  )
}

function RoundColumn({ round, matches }: { round: MatchRound; matches: Match[] }) {
  const expectedCount = ROUND_MATCH_COUNT[round]
  const slots = Array.from({ length: expectedCount }, (_, i) => matches[i])

  // Vertical gap between matches doubles each round to align bracket lines
  const gapMap: Record<MatchRound, string> = {
    'Group Stage': '8px',
    'Round of 32': '12px',
    'Round of 16': '40px',
    'Quarter-finals': '104px',
    'Semi-finals': '232px',
    '3rd Place Final': '0px',
    'Final': '0px',
  }

  return (
    <div
      id={`round-${round.replace(/\s/g, '-')}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: gapMap[round],
        minWidth: '180px',
        flexShrink: 0,
        justifyContent: 'center',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--muted)',
        textAlign: 'center',
        marginBottom: '4px',
        position: 'sticky', top: 0,
      }}>
        {ROUND_LABELS[round]}
      </div>
      {slots.map((m, i) => (
        <BracketMatch
          key={m?.id ?? `${round}-${i}`}
          match={m}
          placeholderHome={`ผู้ชนะคู่ ${i * 2 + 1}`}
          placeholderAway={`ผู้ชนะคู่ ${i * 2 + 2}`}
        />
      ))}
    </div>
  )
}

function ThirdPlaceMatch({ matches }: { matches: Match[] }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--blue)',
      borderRadius: '6px',
      padding: '12px 14px',
      maxWidth: '320px',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '11px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--blue)',
        marginBottom: '6px',
      }}>
        🥉 นัดชิงอันดับ 3
      </div>
      <BracketMatch
        match={matches[0]}
        placeholderHome="ผู้แพ้ SF1"
        placeholderAway="ผู้แพ้ SF2"
      />
    </div>
  )
}
