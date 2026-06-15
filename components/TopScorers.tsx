'use client'
// components/TopScorers.tsx

import { useEffect, useState, useCallback } from 'react'
import type { TopScorer } from '@/types/football'

export default function TopScorers() {
  const [scorers, setScorers] = useState<TopScorer[]>([])
  const [loading, setLoading] = useState(true)

  const fetchScorers = useCallback(async () => {
    try {
      const res  = await fetch('/api/scorers?limit=10')
      const json = await res.json()
      setScorers(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScorers()
    const id = setInterval(fetchScorers, 5 * 60_000)
    return () => clearInterval(id)
  }, [fetchScorers])

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--surface2)',
        padding: '8px 12px',
        fontFamily: 'var(--font-display)',
        fontSize: '12px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--gold)',
        borderBottom: '1px solid var(--border)',
      }}>
        ⚽ ดาวซัลโว
      </div>

      <div style={{ padding: '4px 8px' }}>
        {loading && (
          <div style={{ color: 'var(--muted)', fontSize: '11px', padding: '12px 0', textAlign: 'center' }}>
            กำลังโหลด...
          </div>
        )}

        {scorers.map((s, i) => (
          <div
            key={`${s.player.name}-${i}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '5px 4px',
              borderBottom: i < scorers.length - 1 ? '1px solid var(--border)' : 'none',
              gap: '8px',
            }}
          >
            {/* Rank */}
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '14px', fontWeight: 700,
              color: i < 2 ? 'var(--gold)' : 'var(--muted)',
              width: '16px', textAlign: 'center', flexShrink: 0,
            }}>
              {s.rank}
            </div>

            {/* Player info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '11px', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {s.player.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                {s.team.flag} {s.team.name}
              </div>
            </div>

            {/* Goals badge */}
            <div style={{
              background: 'var(--gold)', color: '#0a0e1a',
              fontFamily: 'var(--font-display)',
              fontSize: '14px', fontWeight: 700,
              padding: '2px 7px', borderRadius: '3px',
              flexShrink: 0,
            }}>
              {s.goals}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
