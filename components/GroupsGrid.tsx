'use client'
// components/GroupsGrid.tsx

import { useEffect, useState, useCallback } from 'react'
import type { Group } from '@/types/football'
import GroupTable from './GroupTable'
import SquadModal from './SquadModal'
import ThirdPlacePanel from './ThirdPlacePanel'

export default function GroupsGrid() {
  const [groups, setGroups]         = useState<Group[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // Squad modal state
  const [squadTeamId,   setSquadTeamId]   = useState<number | null>(null)
  const [squadTeamName, setSquadTeamName] = useState('')

  // Third-place panel state
  const [showThird, setShowThird] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/standings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setGroups(json.data)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGroups()
    // Refresh standings every 5 minutes
    const id = setInterval(fetchGroups, 5 * 60_000)
    return () => clearInterval(id)
  }, [fetchGroups])

  function openSquad(teamId: number, teamName: string) {
    setSquadTeamId(teamId)
    setSquadTeamName(teamName)
  }

  if (loading) return (
    <div style={{ color: 'var(--muted)', padding: '32px 0', textAlign: 'center' }}>
      กำลังโหลดตารางคะแนน...
    </div>
  )

  if (error) return (
    <div style={{ color: 'var(--red)', padding: '16px 0' }}>
      ⚠️ โหลดไม่ได้: {error}
    </div>
  )

  // Split 12 groups into 3 tiers of 4
  const tiers = [
    groups.slice(0, 4),
    groups.slice(4, 8),
    groups.slice(8, 12),
  ]

  return (
    <>
      {/* Section title */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '13px', fontWeight: 700,
        letterSpacing: '1px', color: 'var(--muted)',
        textTransform: 'uppercase',
        marginBottom: '6px',
      }}>
        ตารางคะแนนรอบแรก — {groups.length} กลุ่ม
      </div>

      {/* 3 tiers */}
      {tiers.map((tier, ti) => (
        <div key={ti} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          marginBottom: ti < 2 ? '8px' : '0',
        }}>
          {tier.map((group, gi) => (
            <GroupTable
              key={group.letter}
              group={group}
              index={gi}   // color cycles per row
              onTeamClick={openSquad}
            />
          ))}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '6px' }}>
        <LegendItem color="var(--green)" label="ผ่านเข้ารอบ (อันดับ 1–2)" />
        <LegendItem
          color="var(--blue)"
          label="อาจผ่าน (อันดับ 3 ที่ดีที่สุด 8 ทีม)"
          onClick={() => setShowThird(true)}
          isLink
        />
        <LegendItem color="var(--muted)" label="ตกรอบ" />
      </div>

      {/* Third place panel */}
      <ThirdPlacePanel open={showThird} onClose={() => setShowThird(false)} />

      {/* Squad modal */}
      <SquadModal
        teamId={squadTeamId}
        teamName={squadTeamName}
        onClose={() => setSquadTeamId(null)}
      />
    </>
  )
}

function LegendItem({
  color, label, onClick, isLink,
}: {
  color: string
  label: string
  onClick?: () => void
  isLink?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--muted)' }}>
      <div style={{ width: '8px', height: '12px', borderRadius: '1px', background: color, flexShrink: 0 }} />
      {isLink ? (
        <span
          onClick={onClick}
          style={{ color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--blue)')}
        >
          {label} →
        </span>
      ) : (
        <span>{label}</span>
      )}
    </div>
  )
}
