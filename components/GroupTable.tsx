'use client'
// components/GroupTable.tsx

import type { Group, GroupEntry } from '@/types/football'

// Color cycle: A=gold, B=blue, C=red, D=purple, then repeats
const GROUP_COLORS = ['var(--gold)', 'var(--blue)', 'var(--red)', 'var(--purple)']
const GROUP_TEXT   = ['#0a0e1a',    '#fff',        '#fff',       '#fff']

interface Props {
  group: Group
  index: number   // 0-based index for color cycle
  onTeamClick: (teamId: number, teamName: string) => void
}

function entryQualifyClass(entry: GroupEntry): 'qualify' | 'qualify3' | 'none' {
  if (entry.rank <= 2) return 'qualify'
  if (entry.rank === 3) return 'qualify3'
  return 'none'
}

export default function GroupTable({ group, index, onTeamClick }: Props) {
  const color    = GROUP_COLORS[index % 4]
  const textCol  = GROUP_TEXT[index % 4]

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
        padding: '5px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <div style={{
          width: '20px', height: '20px',
          borderRadius: '3px',
          background: color, color: textCol,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 900,
          fontFamily: 'var(--font-display)',
          flexShrink: 0,
        }}>
          {group.letter}
        </div>
        <span style={{
          fontSize: '10px', color: 'var(--muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {group.entries.map(e => e.team.code).join(' · ')}
        </span>
      </div>

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 18px 18px 18px 22px',
        padding: '3px 8px',
        fontSize: '9px', color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '.5px',
        borderBottom: '1px solid var(--border)',
        gap: '2px',
      }}>
        <span>ทีม</span>
        <span style={{ textAlign: 'center' }}>W</span>
        <span style={{ textAlign: 'center' }}>D</span>
        <span style={{ textAlign: 'center' }}>L</span>
        <span style={{ textAlign: 'center' }}>Pts</span>
      </div>

      {/* Team rows */}
      {group.entries.map(entry => {
        const q = entryQualifyClass(entry)
        return (
          <div
            key={entry.team.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 18px 18px 18px 22px',
              padding: '4px 8px',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,.04)',
              borderLeft: q === 'qualify' ? '2px solid var(--green)'
                        : q === 'qualify3' ? '2px solid var(--blue)'
                        : '2px solid transparent',
              gap: '2px',
              transition: 'background .1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Team name cell */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
              <span style={{ fontSize: '12px', flexShrink: 0 }}>{entry.team.flag}</span>
              <span
                onClick={() => onTeamClick(entry.team.id, `${entry.team.flag} ${entry.team.name}`)}
                style={{
                  fontSize: '11px', fontWeight: 500,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  cursor: 'pointer', color: 'inherit',
                  transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'inherit')}
                title={`ดูรายชื่อผู้เล่น ${entry.team.name}`}
              >
                {entry.team.code}
              </span>
            </div>
            <span style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)' }}>{entry.won}</span>
            <span style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)' }}>{entry.drawn}</span>
            <span style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)' }}>{entry.lost}</span>
            <span style={{ textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>{entry.points}</span>
          </div>
        )
      })}
    </div>
  )
}
