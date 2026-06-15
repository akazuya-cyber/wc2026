// lib/date-utils.ts
import type { Match, MatchDay } from '@/types/football'

/**
 * Group a flat list of matches into MatchDay[] sorted by date.
 * Each match.date is ISO; we bucket by the Asia/Bangkok calendar date
 * since that's the audience's timezone.
 */
export function groupMatchesByDate(matches: Match[]): MatchDay[] {
  const buckets = new Map<string, Match[]>()

  for (const m of matches) {
    const key = new Date(m.date).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Bangkok',
    }) // "YYYY-MM-DD" format
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(m)
  }

  // Sort matches within each day by kickoff time
  for (const dayMatches of buckets.values()) {
    dayMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return Array.from(buckets.entries())
    .map(([date, matches]) => ({ date, matches }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Format a "YYYY-MM-DD" date string into a readable Thai date label.
 */
export function formatDateLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`)
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

  const label = d.toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return dateKey === today ? `${label} (วันนี้)` : label
}
