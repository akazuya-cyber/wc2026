'use client'
// components/SidebarWidgets.tsx
// Small sidebar widgets: tournament stats + knockout links

import Link from 'next/link'

// ── Tournament stats (could be fetched, keeping static for now) ───────────────

export function TournamentStats() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      overflow: 'hidden',
    }}>
      <div style={{
        background: 'var(--surface2)',
        padding: '8px 12px',
        fontFamily: 'var(--font-display)',
        fontSize: '12px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--gold)',
        borderBottom: '1px solid var(--border)',
      }}>
        📊 สถิติรวม
      </div>
      <div style={{ padding: '4px 8px' }}>
        {[
          { label: 'แมตช์ที่แล้ว', value: '—' },
          { label: 'ประตูทั้งหมด', value: '—', color: 'var(--green)' },
          { label: 'เฉลี่ย/แมตช์',  value: '—' },
          { label: 'ใบเหลือง',      value: '—' },
          { label: 'ใบแดง',         value: '—', color: 'var(--red)' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 4px',
            borderBottom: '1px solid var(--border)',
            fontSize: '11px',
          }}>
            <span style={{ color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Knockout round links ──────────────────────────────────────────────────────

const ROUNDS = [
  { label: '32 ทีม',   href: '/knockout#round-Round-of-32' },
  { label: '16 ทีม',   href: '/knockout#round-Round-of-16' },
  { label: '🏟 QF',    href: '/knockout#round-Quarter-finals' },
  { label: 'SF',       href: '/knockout#round-Semi-finals' },
  { label: '🏆 Final', href: '/knockout#round-Final' },
]

export function KnockoutLinks() {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '10px 14px',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '12px', fontWeight: 700,
        letterSpacing: '1px', textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: '8px',
      }}>
        รอบน็อคเอาท์
      </div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
        {ROUNDS.map(({ label, href }, i) => (
          <span key={href} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {i > 0 && <span style={{ color: 'var(--muted)', fontSize: '10px' }}>›</span>}
            <Link href={href} style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '5px 10px',
              fontSize: '11px', fontWeight: 600,
              color: 'var(--muted)',
              textDecoration: 'none',
              transition: 'all .15s',
              display: 'inline-block',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = 'var(--gold)'
              e.currentTarget.style.color = 'var(--gold)'
            }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--muted)'
            }}
            >
              {label}
            </Link>
          </span>
        ))}
      </div>
    </div>
  )
}
