'use client'
// components/ThirdPlacePanel.tsx

import { useEffect, useState, useCallback } from 'react'
import type { ThirdPlaceEntry } from '@/types/football'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ThirdPlacePanel({ open, onClose }: Props) {
  const [entries, setEntries] = useState<ThirdPlaceEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchThirds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Reuse standings API and derive third-place on client
      const res  = await fetch('/api/standings')
      const json = await res.json()

      if (!res.ok || !Array.isArray(json.data)) {
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }

      const groups = json.data as Array<{ letter: string; entries: any[] }>

      // Take rank-3 from each group
      const thirds: ThirdPlaceEntry[] = groups
        .filter(g => g.entries.length >= 3)
        .map(g => ({ ...g.entries[2], group: g.letter, qualifies: false }))

      // Sort: pts → goalDiff → goalsFor
      thirds.sort((a, b) => {
        if (b.points   !== a.points)   return b.points   - a.points
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
        return b.goalsFor - a.goalsFor
      })

      thirds.forEach((t, i) => { t.qualifies = i < 8 })
      setEntries(thirds)
      setUpdatedAt(json.updatedAt)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchThirds()
      const id = setInterval(fetchThirds, 60_000)
      return () => clearInterval(id)
    }
  }, [open, fetchThirds])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: '3px solid var(--blue)',
        borderRadius: '8px',
        width: '560px', maxWidth: '95vw',
        boxShadow: '0 24px 60px rgba(0,0,0,.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface2)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px', fontWeight: 800,
              letterSpacing: '1px', color: 'var(--blue)',
              textTransform: 'uppercase',
            }}>
              🔵 อันดับ 3 ที่ดีที่สุด
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
              ทีมอันดับ 3 ทั้ง 12 กลุ่ม · 8 ทีมแรกผ่านเข้า Round of 32
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {updatedAt && (
              <span style={{ fontSize: '10px', color: 'var(--green)', fontWeight: 600 }}>
                ● Live
              </span>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none',
                color: 'var(--muted)', fontSize: '18px',
                cursor: 'pointer', padding: '2px 6px', borderRadius: '3px',
              }}
            >✕</button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1fr 30px 30px 30px 38px 38px',
          padding: '5px 16px',
          fontSize: '9px', color: 'var(--muted)',
          textTransform: 'uppercase', letterSpacing: '.5px',
          borderBottom: '1px solid var(--border)',
          gap: '4px',
        }}>
          <span>#</span>
          <span>ทีม</span>
          <span style={{ textAlign: 'center' }}>W</span>
          <span style={{ textAlign: 'center' }}>D</span>
          <span style={{ textAlign: 'center' }}>L</span>
          <span style={{ textAlign: 'center' }}>GD</span>
          <span style={{ textAlign: 'center' }}>Pts</span>
        </div>

        {/* Rows */}
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ color: 'var(--muted)', padding: '24px 0', textAlign: 'center' }}>
              กำลังโหลด...
            </div>
          )}
          {error && !loading && (
            <div style={{ color: 'var(--red)', padding: '24px 16px', textAlign: 'center', fontSize: '12px' }}>
              ⚠️ โหลดไม่ได้: {error}
            </div>
          )}
          {!loading && !error && entries.map((entry, i) => (
            <div
              key={entry.team.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '24px 1fr 30px 30px 30px 38px 38px',
                padding: '7px 16px',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,.04)',
                borderLeft: entry.qualifies ? '2px solid var(--blue)' : '2px solid transparent',
                gap: '4px',
                transition: 'background .1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Rank */}
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px', fontWeight: 700,
                color: entry.qualifies ? 'var(--blue)' : 'var(--muted)',
                textAlign: 'center',
              }}>
                {i + 1}
              </div>

              {/* Team */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
                <span>{entry.team.flag}</span>
                <span>{entry.team.name}</span>
                <span style={{
                  fontSize: '9px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '2px',
                  padding: '1px 4px',
                  color: 'var(--muted)',
                  fontWeight: 700,
                }}>
                  {entry.group}
                </span>
              </div>

              <span style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>{entry.won}</span>
              <span style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>{entry.drawn}</span>
              <span style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>{entry.lost}</span>

              {/* Goal diff */}
              <span style={{
                textAlign: 'center', fontSize: '12px',
                color: entry.goalDiff > 0 ? 'var(--green)' : entry.goalDiff < 0 ? 'var(--red)' : 'var(--muted)',
              }}>
                {entry.goalDiff > 0 ? '+' : ''}{entry.goalDiff}
              </span>

              {/* Points */}
              <span style={{
                textAlign: 'center', fontSize: '13px', fontWeight: 700,
                color: entry.qualifies ? 'var(--green)' : 'var(--text)',
              }}>
                {entry.points}
              </span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          padding: '8px 16px',
          fontSize: '10px', color: 'var(--muted)',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface2)',
        }}>
          เกณฑ์การตัดสิน: คะแนน → ผลต่างประตู → ประตูที่ทำได้ · อัปเดตทุก 60 วินาที
        </div>
      </div>
    </div>
  )
}
