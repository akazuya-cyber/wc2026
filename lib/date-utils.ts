// lib/date-utils.ts
import type { Match, MatchDay } from '@/types/football'

// Manual Thai date formatting — avoids relying on Intl/toLocaleDateString,
// whose Buddhist-calendar year output can differ between Node (server) and
// browser (client) ICU implementations, causing hydration mismatches.

const TH_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

const TH_WEEKDAYS_FULL = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
]

/** Convert a Gregorian year to 2-digit Buddhist Era year, e.g. 2026 -> "69" */
export function toBuddhistYear2Digit(gregorianYear: number): string {
  const be = gregorianYear + 543
  return String(be % 100).padStart(2, '0')
}

/** Format a Date (already in the desired local time) as "17 มิ.ย. 69" */
export function formatThaiDateShort(d: Date): string {
  const day = d.getDate()
  const month = TH_MONTHS_SHORT[d.getMonth()]
  const year = toBuddhistYear2Digit(d.getFullYear())
  return `${day} ${month}. ${year}`.replace('..', '.')
}

/** Format a Date as "วันพุธ 17 มิถุนายน 2569" */
export function formatThaiDateFull(d: Date): string {
  const weekday = TH_WEEKDAYS_FULL[d.getDay()]
  const day = d.getDate()
  const month = TH_MONTHS_FULL[d.getMonth()]
  const year = d.getFullYear() + 543
  return `${weekday} ${day} ${month} ${year}`
}

/**
 * Get the YYYY-MM-DD date key in a given IANA timezone WITHOUT using
 * toLocaleDateString (whose output format can vary by ICU implementation).
 * Uses Intl.DateTimeFormat with explicit numeric parts instead, which is
 * stable across Node and browsers since it doesn't involve calendar-name
 * formatting — only digit extraction.
 */
export function dateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  return `${get('year')}-${get('month')}-${get('day')}`
}

/**
 * Get a Date object representing "now" shifted into a given timezone's
 * wall-clock time, so getDate()/getMonth()/getFullYear() reflect that zone.
 */
export function nowInTimeZone(timeZone: string): Date {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  const year = parseInt(get('year'), 10)
  const month = parseInt(get('month'), 10) - 1
  const day = parseInt(get('day'), 10)
  const hour = parseInt(get('hour'), 10) % 24
  const minute = parseInt(get('minute'), 10)
  const second = parseInt(get('second'), 10)

  return new Date(year, month, day, hour, minute, second)
}

/**
 * Format a match datetime (ISO string) as "23:00 น." in Asia/Bangkok time,
 * using manual digit extraction instead of toLocaleTimeString to avoid
 * locale-formatting differences between server and client.
 */
export function formatThaiTime(dateStr: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(dateStr))

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00'
  return `${get('hour')}:${get('minute')} น.`
}

/**
 * Group a flat list of matches into MatchDay[] sorted by date.
 * Each match.date is ISO; we bucket by the Asia/Bangkok calendar date
 * since that's the audience's timezone.
 */
export function groupMatchesByDate(matches: Match[]): MatchDay[] {
  const buckets = new Map<string, Match[]>()

  for (const m of matches) {
    const key = dateKeyInTimeZone(new Date(m.date), 'Asia/Bangkok') // "YYYY-MM-DD" format
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
  const today = dateKeyInTimeZone(new Date(), 'Asia/Bangkok')

  const label = formatThaiDateFull(d)

  return dateKey === today ? `${label} (วันนี้)` : label
}
