'use client'
// components/ScheduleFilters.tsx

export type RoundFilter = 'all' | 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
export type StatusFilter = 'all' | 'upcoming' | 'live' | 'finished'

interface Props {
  round: RoundFilter
  status: StatusFilter
  onRoundChange: (r: RoundFilter) => void
  onStatusChange: (s: StatusFilter) => void
}

const ROUND_OPTIONS: { value: RoundFilter; label: string }[] = [
  { value: 'all',   label: 'ทั้งหมด' },
  { value: 'group', label: 'รอบแบ่งกลุ่ม' },
  { value: 'r32',   label: 'รอบ 32 ทีม' },
  { value: 'r16',   label: 'รอบ 16 ทีม' },
  { value: 'qf',    label: 'รอบ 8 ทีม' },
  { value: 'sf',    label: 'รอบรองชนะเลิศ' },
  { value: 'final', label: 'รอบชิงชนะเลิศ' },
]

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all',      label: 'ทั้งหมด' },
  { value: 'live',     label: '🔴 กำลังแข่ง' },
  { value: 'upcoming', label: '📅 ยังไม่แข่ง' },
  { value: 'finished', label: '✅ จบแล้ว' },
]

function FilterGroup<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {options.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                background: active ? 'rgba(245,200,66,.12)' : 'var(--surface2)',
                border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
                color: active ? 'var(--gold)' : 'var(--muted)',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ScheduleFilters({ round, status, onRoundChange, onStatusChange }: Props) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '6px',
      padding: '10px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <FilterGroup label="รอบ:" options={ROUND_OPTIONS} value={round} onChange={onRoundChange} />
      <FilterGroup label="สถานะ:" options={STATUS_OPTIONS} value={status} onChange={onStatusChange} />
    </div>
  )
}
