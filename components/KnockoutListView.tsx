'use client'
// components/KnockoutListView.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Match, MatchRound } from '@/types/football'
import MatchRow from './MatchRow'

const ROUND_LABELS: Record<MatchRound, string> = {
  'Group Stage':     'รอบแบ่งกลุ่ม',
  'Round of 32':     'รอบ 32 ทีม',
  'Round of 16':     'รอบ 16 ทีม',
  'Quarter-finals':  'รอบ 8 ทีม (QF)',
  'Semi-finals':     'รอบรองชนะเลิศ (SF)',
  '3rd Place Final': 'นัดชิงอันดับ 3',
  'Final':           'นัดชิงชนะเลิศ',
}

const KNOCKOUT_ROUNDS: MatchRound[] = [
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  '3rd Place Final',
  'Final',
]

export default function KnockoutListView() {
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
      กำลังโหลด...
    </div>
  )

  if (error) return (
    <div style={{ color: 'var(--red)', padding: '16px 0' }}>
      ⚠️ โหลดไม่ได้: {error}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {KNOCKOUT_ROUNDS.map(round => {
        const roundMatches = matches
          .filter(m => m.round === round)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (roundMatches.length === 0) {
          return (
            <div key={round}>
              <RoundHeader round={round} count={0} />
              <div style={{ color: 'var(--muted)', fontSize: '11px', padding: '8px 0' }}>
                ยังไม่มีคู่แข่งขัน — รอผลจากรอบก่อนหน้า
              </div>
            </div>
          )
        }

        return (
          <div key={round}>
            <RoundHeader round={round} count={roundMatches.length} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {roundMatches.map(m => <MatchRow key={m.id} match={m} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function RoundHeader({ round, count }: { round: MatchRound; count: number }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)',
      fontSize: '13px', fontWeight: 700,
      letterSpacing: '1px', color: 'var(--gold)',
      textTransform: 'uppercase',
      marginBottom: '6px',
      paddingBottom: '4px',
      borderBottom: '1px solid var(--border)',
    }}>
      {ROUND_LABELS[round]}
      {count > 0 && (
        <span style={{ color: 'var(--muted)', fontWeight: 500, marginLeft: '8px', fontSize: '11px' }}>
          ({count} แมตช์)
        </span>
      )}
    </div>
  )
}
