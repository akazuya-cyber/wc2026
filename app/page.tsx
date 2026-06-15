// app/page.tsx
import Topbar from '@/components/Topbar'
import TodayMatches from '@/components/TodayMatches'
import GroupsGrid from '@/components/GroupsGrid'
import TopScorers from '@/components/TopScorers'
import { KnockoutLinks } from '@/components/SidebarWidgets'

export default function HomePage() {
  return (
    <>
      <Topbar />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr 200px',
        gap: '12px',
        padding: '12px 16px',
        maxWidth: '1280px',
        margin: '0 auto',
      }}>
        {/* ── TODAY BANNER (full width) ── */}
        <TodayMatches />

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <TopScorers />
        </div>

        {/* ── MAIN CENTER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <KnockoutLinks />
          <GroupsGrid />
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <DataStatusWidget />
        </div>
      </div>
    </>
  )
}

function DataStatusWidget() {
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
        📡 สถานะข้อมูล
      </div>
      <div style={{ padding: '4px 8px' }}>
        {[
          { label: 'อัปเดตล่าสุด', value: '● Live',           color: 'var(--green)' },
          { label: 'แหล่งข้อมูล',  value: 'worldcup26.ir',    color: undefined },
          { label: 'Refresh ทุก',  value: '60 วินาที',        color: undefined },
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
