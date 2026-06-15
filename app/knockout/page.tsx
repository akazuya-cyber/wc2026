'use client'
// app/knockout/page.tsx

import { useState } from 'react'
import Topbar from '@/components/Topbar'
import BracketView from '@/components/BracketView'
import KnockoutListView from '@/components/KnockoutListView'

type ViewMode = 'bracket' | 'list'

export default function KnockoutPage() {
  const [mode, setMode] = useState<ViewMode>('bracket')

  return (
    <>
      <Topbar />
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '16px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '12px', flexWrap: 'wrap', gap: '8px',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px', fontWeight: 800,
            letterSpacing: '1px', color: 'var(--gold)',
            textTransform: 'uppercase',
          }}>
            🏆 รอบน็อคเอาท์
          </h1>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <ToggleButton active={mode === 'bracket'} onClick={() => setMode('bracket')}>
              📊 Bracket
            </ToggleButton>
            <ToggleButton active={mode === 'list'} onClick={() => setMode('list')}>
              📋 รายการ
            </ToggleButton>
          </div>
        </div>

        {mode === 'bracket' ? <BracketView /> : <KnockoutListView />}
      </div>
    </>
  )
}

function ToggleButton({
  active, onClick, children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(245,200,66,.12)' : 'var(--surface2)',
        border: `1px solid ${active ? 'var(--gold)' : 'var(--border)'}`,
        color: active ? 'var(--gold)' : 'var(--muted)',
        borderRadius: '4px',
        padding: '6px 14px',
        fontSize: '12px', fontWeight: 600,
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  )
}
