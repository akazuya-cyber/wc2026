'use client'
// components/Topbar.tsx

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'หน้าแรก',        href: '/' },
  { label: 'ผล / กำหนดการ',  href: '/schedule' },
  { label: 'รอบน็อคเอาท์',   href: '/knockout' },
]

export default function Topbar() {
  const pathname = usePathname()

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f1729, #1a2a4a 50%, #0f1729)',
      borderBottom: '2px solid var(--gold)',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '52px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: 900,
          letterSpacing: '1px',
          color: 'var(--gold)',
        }}>
          WC<span style={{ color: '#fff' }}>2026</span>
        </span>
      </Link>

      {/* Nav */}
      <nav style={{ display: 'flex', gap: '4px' }}>
        {NAV.map(({ label, href }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} style={{
              color: active ? 'var(--gold)' : 'var(--muted)',
              background: active ? 'rgba(245,200,66,.08)' : 'transparent',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
              padding: '6px 10px',
              borderRadius: '4px',
              transition: 'all .15s',
            }}>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Phase badge */}
      <span style={{
        background: 'var(--gold)',
        color: '#0a0e1a',
        fontSize: '10px',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: '20px',
        letterSpacing: '.5px',
      }}>
        🏆 GROUP STAGE
      </span>
    </header>
  )
}
