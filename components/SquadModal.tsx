'use client'
// components/SquadModal.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Squad, Position } from '@/types/football'

interface Props {
  teamId: number | null
  teamName: string
  onClose: () => void
}

const POS_LABELS: Record<Position, string> = {
  Goalkeeper: '🧤 ผู้รักษาประตู',
  Defender:   '🛡️ กองหลัง',
  Midfielder: '⚙️ กองกลาง',
  Attacker:   '⚡ กองหน้า',
}

const POS_ORDER: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

export default function SquadModal({ teamId, teamName, onClose }: Props) {
  const [squad, setSquad]   = useState<Squad | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const fetchSquad = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/squads?teamId=${id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setSquad(json.data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (teamId) fetchSquad(teamId)
    else setSquad(null)
  }, [teamId, fetchSquad])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = teamId ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [teamId])

  if (!teamId) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderTop: '3px solid var(--gold)',
        borderRadius: '8px',
        width: '640px', maxWidth: '95vw',
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,.6)',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--surface2)',
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px', fontWeight: 900,
              letterSpacing: '1px', color: 'var(--gold)',
            }}>
              {teamName}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>
              {!squad ? 'กำลังโหลด...'
                : squad.players.length === 0 ? 'ข้อมูลผู้เล่นยังไม่พร้อม'
                : `${squad.players.length} ผู้เล่น · เทรนเนอร์: ${squad.coach || 'TBA'}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', fontSize: '20px',
              cursor: 'pointer', padding: '2px 8px', borderRadius: '3px',
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '12px 16px', flex: 1 }}>
          {loading && (
            <div style={{ color: 'var(--muted)', padding: '24px 0', textAlign: 'center' }}>
              กำลังโหลดรายชื่อผู้เล่น...
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', padding: '16px 0' }}>
              ⚠️ โหลดไม่ได้: {error}
            </div>
          )}
          {squad && squad.players.length === 0 && (
            <div style={{
              color: 'var(--muted)', padding: '32px 0', textAlign: 'center',
              fontSize: '12px', lineHeight: 1.8,
            }}>
              📋 ยังไม่มีข้อมูลรายชื่อผู้เล่น 26 คนสุดท้าย<br />
              <span style={{ fontSize: '11px' }}>
                ข้อมูลแหล่งปัจจุบันยังไม่รองรับ squad list — จะอัปเดตเมื่อมีแหล่งข้อมูลที่รองรับ
              </span>
            </div>
          )}
          {squad && POS_ORDER.map(pos => {
            const players = squad.players.filter(p => p.position === pos)
            if (!players.length) return null
            return (
              <div key={pos} style={{ marginBottom: '14px' }}>
                {/* Position label */}
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  color: 'var(--muted)',
                  paddingBottom: '4px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '6px',
                }}>
                  {POS_LABELS[pos]} ({players.length})
                </div>

                {/* Player grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '4px',
                }}>
                  {players
                    .sort((a, b) => a.number - b.number)
                    .map(player => (
                      <div key={player.id} style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        transition: 'border-color .15s',
                      }}>
                        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
                          #{player.number}
                        </div>
                        <div style={{
                          fontSize: '11px', fontWeight: 600,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {player.name}
                        </div>
                        <div style={{
                          fontSize: '10px', color: 'var(--muted)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {player.club || 'Club TBA'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          fontSize: '10px', color: 'var(--muted)',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface2)',
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>ข้อมูลจาก API-Football</span>
          <span>กด Esc หรือคลิกนอก modal เพื่อปิด</span>
        </div>
      </div>
    </div>
  )
}
