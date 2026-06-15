// app/schedule/page.tsx
import Topbar from '@/components/Topbar'
import ScheduleView from '@/components/ScheduleView'

export const metadata = {
  title: 'ผล / กำหนดการ — WC2026',
}

export default function SchedulePage() {
  return (
    <>
      <Topbar />
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '16px',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px', fontWeight: 800,
          letterSpacing: '1px', color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '12px',
        }}>
          📅 ผลการแข่งขัน / กำหนดการ
        </h1>
        <ScheduleView />
      </div>
    </>
  )
}
