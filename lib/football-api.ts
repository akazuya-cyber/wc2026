// ─────────────────────────────────────────────────────────────────────────────
// lib/football-api.ts
//
// Data source: worldcup26.ir — free, open, no API key required.
//   GET https://worldcup26.ir/get/games    → all 104 fixtures (group + knockout)
//   GET https://worldcup26.ir/get/groups   → 12 group standings tables
//
// This file wraps the upstream API with:
//   - In-memory cache (avoids hammering the upstream)
//   - Type-safe mapping to our own types in types/football.ts
//   - Derived data (team names, third-place ranking, group standings fallback)
//
// NOTE: worldcup26.ir does not provide top-scorers or squad endpoints.
// fetchTopScorers() and fetchSquad() are computed/best-effort:
//   - Top scorers are derived from goal events in /get/games (home_scorers /
//     away_scorers fields), which is accurate once matches have been played.
//   - Squads are NOT available from this source; fetchSquad() returns an
//     empty squad with a note. Swap in a squads-capable source later if needed.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Group,
  GroupEntry,
  Match,
  MatchStatus,
  MatchRound,
  TopScorer,
  Squad,
  Player,
  Position,
  ThirdPlaceEntry,
  Team,
  GoalEvent,
} from '@/types/football'

// Static squad data (community-maintained — see data/squads.json)
import squadsData from '@/data/squads.json'

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = 'https://worldcup26.ir'

// Cache TTLs in milliseconds
const TTL = {
  live:      (Number(process.env.CACHE_TTL_LIVE)      || 60)    * 1000,
  standings: (Number(process.env.CACHE_TTL_STANDINGS) || 300)   * 1000,
  squads:    (Number(process.env.CACHE_TTL_SQUADS)    || 86400) * 1000,
}

// ── In-memory cache ───────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  fetchedAt: number
  ttl: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>()

function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.fetchedAt > entry.ttl) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttl: number): void {
  cache.set(key, { data, fetchedAt: Date.now(), ttl })
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new Error(`worldcup26.ir error ${res.status}: ${res.statusText} — ${url}`)
  }
  return (await res.json()) as T
}

// ── Raw upstream shapes ───────────────────────────────────────────────────────

interface RawGame {
  _id: string
  id: string
  home_team_id: string
  away_team_id: string
  home_score: string
  away_score: string
  home_scorers: string   // e.g. `{"J. Quiñones 9'","R. Jiménez 67'"}` or "null"
  away_scorers: string
  group: string           // "A".."L" for group stage, or "R32"/"R16"/"QF"/"SF"/"3RD"/"FINAL"
  matchday: string
  local_date: string      // "06/11/2026 13:00" (M/D/YYYY HH:mm, US Eastern-ish)
  persian_date: string
  stadium_id: string
  finished: string        // "TRUE" / "FALSE"
  time_elapsed: string     // "finished" / "notstarted" / live minute, etc.
  type: string             // "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final"
  home_team_name_en?: string
  home_team_name_fa?: string
  away_team_name_en?: string
  away_team_name_fa?: string
  home_team_label?: string  // for knockout placeholders, e.g. "Winner Group A"
  away_team_label?: string
}

interface RawGroupTeamRow {
  team_id: string
  mp: string
  w: string
  l: string
  d: string
  pts: string
  gf: string
  ga: string
  gd: string
  _id: string
}

interface RawGroup {
  _id: string
  name: string  // "A".."L"
  teams: RawGroupTeamRow[]
  createdAt: string
}

// ── Country code / flag mapping ──────────────────────────────────────────────

const FLAG_MAP: Record<string, string> = {
  'United States': '🇺🇸', 'Mexico': '🇲🇽', 'Canada': '🇨🇦',
  'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Uruguay': '🇺🇾', 'Colombia': '🇨🇴',
  'Ecuador': '🇪🇨', 'Paraguay': '🇵🇾',
  'France': '🇫🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Germany': '🇩🇪', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Sweden': '🇸🇪', 'Norway': '🇳🇴',
  'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Turkey': '🇹🇷', 'Czech Republic': '🇨🇿',
  'Bosnia and Herzegovina': '🇧🇦',
  'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Australia': '🇦🇺', 'Iran': '🇮🇷',
  'Saudi Arabia': '🇸🇦', 'Qatar': '🇶🇦', 'Iraq': '🇮🇶', 'Jordan': '🇯🇴',
  'Uzbekistan': '🇺🇿', 'New Zealand': '🇳🇿', 'Curaçao': '🇨🇼', 'Panama': '🇵🇦',
  'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Ghana': '🇬🇭', 'Nigeria': '🇳🇬',
  'Ivory Coast': '🇨🇮', "Côte d'Ivoire": '🇨🇮', 'Cameroon': '🇨🇲',
  'Egypt': '🇪🇬', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳', 'South Africa': '🇿🇦',
  'Cape Verde': '🇨🇻', 'Haiti': '🇭🇹',
  'Democratic Republic of the Congo': '🇨🇩',
}

function teamFlag(name: string): string {
  return FLAG_MAP[name] ?? '🏳️'
}

// 3-letter codes for teams that don't auto-derive cleanly from their name
const CODE_OVERRIDES: Record<string, string> = {
  'United States': 'USA',
  'South Korea': 'KOR',
  'South Africa': 'RSA',
  'Czech Republic': 'CZE',
  'Bosnia and Herzegovina': 'BIH',
  'Ivory Coast': 'CIV',
  "Côte d'Ivoire": 'CIV',
  'Saudi Arabia': 'KSA',
  'New Zealand': 'NZL',
  'Democratic Republic of the Congo': 'COD',
  'Cape Verde': 'CPV',
  'Netherlands': 'NED',
  'Switzerland': 'SUI',
  'Uruguay': 'URY',
  'Morocco': 'MAR',
  'Curaçao': 'CUW',
  'England': 'ENG',
  'Scotland': 'SCO',
}

function teamCode(name: string): string {
  return CODE_OVERRIDES[name] ?? name.slice(0, 3).toUpperCase()
}

function makeTeam(id: string, name: string): Team {
  return {
    id: Number(id),
    name,
    code: teamCode(name),
    flag: teamFlag(name),
  }
}

// ── Status / round mappers ────────────────────────────────────────────────────

function mapStatus(game: RawGame): MatchStatus {
  if (game.finished === 'TRUE') return 'FT'
  const elapsed = (game.time_elapsed ?? '').toLowerCase().trim()
  if (elapsed === 'notstarted' || elapsed === '') return 'NS'
  if (elapsed === 'ht' || elapsed === 'halftime') return 'HT'
  // Live minute strings may look like "67" or "45+2"
  const minuteMatch = elapsed.match(/^(\d+)/)
  if (minuteMatch) {
    const minute = parseInt(minuteMatch[1], 10)
    return minute > 90 ? 'ET' : minute > 45 ? '2H' : '1H'
  }
  return 'NS'
}

function mapMinute(game: RawGame): number | undefined {
  const elapsed = (game.time_elapsed ?? '').toLowerCase().trim()
  const minuteMatch = elapsed.match(/^(\d+)/)
  return minuteMatch ? parseInt(minuteMatch[1], 10) : undefined
}

function mapRound(group: string): MatchRound {
  switch (group) {
    case 'R32':   return 'Round of 32'
    case 'R16':   return 'Round of 16'
    case 'QF':    return 'Quarter-finals'
    case 'SF':    return 'Semi-finals'
    case '3RD':   return '3rd Place Final'
    case 'FINAL': return 'Final'
    default:      return 'Group Stage'   // "A".."L"
  }
}

// ── Date parsing ──────────────────────────────────────────────────────────────

/**
 * worldcup26.ir local_date format: "MM/DD/YYYY HH:mm" (24h).
 * The tournament is hosted across US/Mexico/Canada timezones, but the source
 * doesn't specify which — we treat it as US Eastern Time (UTC-4 during June/July,
 * which is when the tournament runs, EDT) since most listed times align with
 * Eastern kickoff slots. This is an approximation; exact venue-local times may
 * differ by a few hours, which only affects the displayed kickoff time, not
 * scores/standings.
 */
function parseLocalDate(localDate: string): string {
  const [datePart, timePart] = localDate.split(' ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hour, minute] = (timePart ?? '00:00').split(':').map(Number)

  // Construct as if UTC-4 (EDT), then convert to a true UTC ISO string.
  const utcMs = Date.UTC(year, month - 1, day, hour + 4, minute)
  return new Date(utcMs).toISOString()
}

// ── Goal scorer parsing ───────────────────────────────────────────────────────

/**
 * worldcup26.ir stores scorers as a stringified pseudo-array, e.g.:
 *   `{"I.B. Hwang 67'","H.G. Oh 80'"}`  or  `null`
 * (Note: curly braces, not square brackets — looks like a Postgres array literal.)
 */
function parseScorers(raw: string): GoalEvent[] {
  if (!raw || raw === 'null') return []

  // worldcup26.ir sends scorer strings as Postgres array literals, e.g.:
  //   {"F. Balogun 31'","F. Balogun 45'+5'","G. Reyna 90'+8'"}
  //   {"K. Havertz 45'+5'(p)","Breel Embolo 17' (p)"}
  //   {"D. Bobadilla 7'(OG)"}
  //
  // Splitting on `","` breaks because the apostrophe in "45'" is adjacent
  // to the delimiter, making boundaries ambiguous. Instead we use a regex
  // to extract each "name minute'[+addl'][(flag)]" token directly.

  // worldcup26.ir uses two injury-time formats inconsistently:
  //   "45'+5'"  — quote after base minute, then +addl'
  //   "90+5'"   — no quote after base minute, just +addl'
  // TOKEN handles both: \d+(?:'\s*\+\d+|\+\d+)?'
  const TOKEN = /([^{",\n]+?)\s+(\d+)(?:'\s*\+\d+|\+\d+)?'\s*(?:\(\s*(p|og)\s*\))?/gi

  const results: GoalEvent[] = []
  let m: RegExpExecArray | null
  while ((m = TOKEN.exec(raw)) !== null) {
    const player = m[1].trim()
    const minute = parseInt(m[2], 10)
    const flag = (m[3] ?? '').toLowerCase()
    if (!player) continue
    results.push({
      player,
      minute,
      penalty: flag === 'p',
      ownGoal: flag === 'og',
    })
  }
  return results
}

// ── Fixture mapping ───────────────────────────────────────────────────────────

function mapFixture(g: RawGame): Match {
  const isPlaceholder = g.home_team_id === '0' || g.away_team_id === '0'

  const homeTeam: Team = isPlaceholder
    ? { id: 0, name: g.home_team_label ?? 'TBD', code: 'TBD', flag: '🏳️' }
    : makeTeam(g.home_team_id, g.home_team_name_en ?? `Team ${g.home_team_id}`)

  const awayTeam: Team = isPlaceholder
    ? { id: 0, name: g.away_team_label ?? 'TBD', code: 'TBD', flag: '🏳️' }
    : makeTeam(g.away_team_id, g.away_team_name_en ?? `Team ${g.away_team_id}`)

  const round = mapRound(g.group)

  return {
    id:          Number(g.id),
    date:        parseLocalDate(g.local_date),
    status:      mapStatus(g),
    minute:      mapMinute(g),
    round,
    group:       round === 'Group Stage' ? g.group : undefined,
    venue:       `Stadium ${g.stadium_id}`,   // worldcup26.ir doesn't expose venue names in /get/games
    homeTeam,
    awayTeam,
    homeScore:   mapStatus(g) === 'NS' ? null : Number(g.home_score),
    awayScore:   mapStatus(g) === 'NS' ? null : Number(g.away_score),
    homeScorers: parseScorers(g.home_scorers),
    awayScorers: parseScorers(g.away_scorers),
  }
}

// ── Core fetch: all games (cached) ───────────────────────────────────────────

async function fetchAllGames(): Promise<RawGame[]> {
  const cacheKey = 'raw-games'
  const cached = getCache<RawGame[]>(cacheKey)
  if (cached) return cached

  const json = await apiFetch<{ games: RawGame[] }>('/get/games')
  const games = json.games ?? []

  setCache(cacheKey, games, TTL.live)
  return games
}

/**
 * Build a team_id → Team lookup from the games payload.
 * (worldcup26.ir's /get/groups only returns team_id, not names — so we
 * cross-reference with /get/games which has both id and name.)
 */
async function buildTeamLookup(): Promise<Map<number, Team>> {
  const cacheKey = 'team-lookup'
  const cached = getCache<Map<number, Team>>(cacheKey)
  if (cached) return cached

  const games = await fetchAllGames()
  const lookup = new Map<number, Team>()

  for (const g of games) {
    if (g.home_team_id !== '0' && g.home_team_name_en) {
      lookup.set(Number(g.home_team_id), makeTeam(g.home_team_id, g.home_team_name_en))
    }
    if (g.away_team_id !== '0' && g.away_team_name_en) {
      lookup.set(Number(g.away_team_id), makeTeam(g.away_team_id, g.away_team_name_en))
    }
  }

  // Team lookup is effectively static for the tournament — cache for 24h
  setCache(cacheKey, lookup, TTL.squads)
  return lookup
}

// ── Public API: Standings ─────────────────────────────────────────────────────

export async function fetchStandings(): Promise<Group[]> {
  const cacheKey = 'standings'
  const cached = getCache<Group[]>(cacheKey)
  if (cached) return cached

  const [groupsJson, teamLookup] = await Promise.all([
    apiFetch<{ groups: RawGroup[] }>('/get/groups'),
    buildTeamLookup(),
  ])

  const groups: Group[] = (groupsJson.groups ?? [])
    .map(g => {
      const entries: GroupEntry[] = g.teams.map(t => ({
        rank:         0,   // computed below
        team:         teamLookup.get(Number(t.team_id)) ?? makeTeam(t.team_id, `Team ${t.team_id}`),
        played:       Number(t.mp),
        won:          Number(t.w),
        drawn:        Number(t.d),
        lost:         Number(t.l),
        goalsFor:     Number(t.gf),
        goalsAgainst: Number(t.ga),
        goalDiff:     Number(t.gd),
        points:       Number(t.pts),
      }))

      // Sort: points → goalDiff → goalsFor (standard FIFA tiebreakers)
      entries.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
        return b.goalsFor - a.goalsFor
      })
      entries.forEach((e, i) => { e.rank = i + 1 })

      return { name: `Group ${g.name}`, letter: g.name, entries }
    })
    .sort((a, b) => a.letter.localeCompare(b.letter))

  setCache(cacheKey, groups, TTL.standings)
  return groups
}

/**
 * Compute third-place table from current standings.
 */
export async function fetchThirdPlaceRanking(): Promise<ThirdPlaceEntry[]> {
  const groups = await fetchStandings()

  const thirds: ThirdPlaceEntry[] = groups
    .filter(g => g.entries.length >= 3)
    .map(g => ({
      ...g.entries[2],
      group: g.letter,
      qualifies: false,
    }))

  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    return b.goalsFor - a.goalsFor
  })

  thirds.forEach((t, i) => { t.qualifies = i < 8 })

  return thirds
}

// ── Public API: Matches ────────────────────────────────────────────────────────

export async function fetchTodayMatches(): Promise<Match[]> {
  const games = await fetchAllGames()
  const matches = games.map(mapFixture)

  // "Today" in Asia/Bangkok, matched against each fixture's UTC date
  const todayBangkok = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })

  return matches.filter(m => {
    const matchDateBangkok = new Date(m.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    return matchDateBangkok === todayBangkok
  })
}

export async function fetchAllMatches(round?: string): Promise<Match[]> {
  const games = await fetchAllGames()
  let matches = games.map(mapFixture)

  if (round && round !== 'all') {
    // Allow filtering by either our MatchRound labels or raw group codes
    matches = matches.filter(m => m.round === round || m.group === round)
  }

  return matches
}

export async function fetchMatchesByDate(date: string): Promise<Match[]> {
  const games = await fetchAllGames()
  const matches = games.map(mapFixture)

  return matches.filter(m => {
    const matchDate = new Date(m.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    return matchDate === date
  })
}

/**
 * Normalize a player name for deduplication across games.
 * worldcup26.ir inconsistently uses "K. Mbappé" in some games and
 * "Kylian Mbappé" in others. We reduce to lowercase last-word (surname)
 * which is almost always stable, then use the longest/most-complete name
 * seen as the display name.
 *
 * Strategy: key = lowercase of the last space-separated token (surname).
 * For compound surnames this can collide, but in practice WC squads have
 * unique surnames per team — and we also include team_id in the key.
 */
function normalizePlayerKey(name: string, teamId: number): string {
  const cleaned = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics: é→e, ú→u, etc.
    .trim()

  // Take the last word as surname key
  const parts = cleaned.split(/\s+/)
  const surname = parts[parts.length - 1]

  return `${teamId}:${surname}`
}

// ── Public API: Top Scorers ───────────────────────────────────────────────────

/**
 * Derived from goal events across all played fixtures.
 * Accurate for goals; assists are not tracked by this data source (always 0).
 */
export async function fetchTopScorers(limit = 10): Promise<TopScorer[]> {
  const cacheKey = `scorers-${limit}`
  const cached = getCache<TopScorer[]>(cacheKey)
  if (cached) return cached

  const [games, teamLookup] = await Promise.all([fetchAllGames(), buildTeamLookup()])

  // Tally goals per player — keyed by normalizePlayerKey to merge
  // "K. Mbappé" and "Kylian Mbappé" (same surname, same team) into one entry.
  // We keep the longest name seen as the display name.
  const tally = new Map<string, { goals: number; team: Team; appearances: Set<number>; displayName: string }>()

  for (const g of games) {
    if (g.finished !== 'TRUE') continue

    const homeTeam = teamLookup.get(Number(g.home_team_id))
    const awayTeam = teamLookup.get(Number(g.away_team_id))

    for (const scorer of parseScorers(g.home_scorers)) {
      if (scorer.ownGoal || !homeTeam) continue
      const key = normalizePlayerKey(scorer.player, Number(g.home_team_id))
      const entry = tally.get(key) ?? { goals: 0, team: homeTeam, appearances: new Set(), displayName: scorer.player }
      entry.goals += 1
      entry.appearances.add(Number(g.id))
      // Prefer the longer/more-complete name as display name
      if (scorer.player.length > entry.displayName.length) entry.displayName = scorer.player
      tally.set(key, entry)
    }
    for (const scorer of parseScorers(g.away_scorers)) {
      if (scorer.ownGoal || !awayTeam) continue
      const key = normalizePlayerKey(scorer.player, Number(g.away_team_id))
      const entry = tally.get(key) ?? { goals: 0, team: awayTeam, appearances: new Set(), displayName: scorer.player }
      entry.goals += 1
      entry.appearances.add(Number(g.id))
      if (scorer.player.length > entry.displayName.length) entry.displayName = scorer.player
      tally.set(key, entry)
    }
  }

  const scorers: TopScorer[] = Array.from(tally.entries())
    .map(([, info]) => ({
      rank: 0,
      player: { id: 0, name: info.displayName },
      team: info.team,
      goals: info.goals,
      assists: 0,
      appearances: info.appearances.size,
      penaltyGoals: 0,
    }))
    .sort((a, b) => b.goals - a.goals)

  scorers.forEach((s, i) => { s.rank = i + 1 })

  const result = scorers.slice(0, limit)
  setCache(cacheKey, result, TTL.standings)
  return result
}

// ── Public API: Squads ────────────────────────────────────────────────────────

/**
 * Squad data is loaded from data/squads.json — a static, manually
 * maintained file (worldcup26.ir doesn't provide a squads endpoint).
 * Returns an empty squad if the team_id isn't present or has no players yet.
 */
export async function fetchSquad(teamId: number): Promise<Squad> {
  const teamLookup = await buildTeamLookup()
  const team = teamLookup.get(teamId) ?? { id: teamId, name: 'Unknown', code: '???', flag: '🏳️' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (squadsData as Record<string, any>)[String(teamId)]

  if (!raw || !Array.isArray(raw.players)) {
    return { team, coach: '', players: [] }
  }

  const VALID_POSITIONS: Position[] = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players: Player[] = raw.players.map((p: any, i: number) => ({
    id:       i + 1,   // squads.json doesn't carry player IDs — index is fine as a React key source
    number:   Number(p.number) || 0,
    name:     p.name ?? 'Unknown',
    position: VALID_POSITIONS.includes(p.position) ? p.position : 'Midfielder',
    club:     p.club ?? '',
  }))

  return {
    team,
    coach: raw.coach ?? '',
    players,
  }
}

// ── Cache utilities ────────────────────────────────────────────────────────────

export function getCacheInfo(key: string): { cached: boolean; age: number | null } {
  const entry = cache.get(key)
  if (!entry) return { cached: false, age: null }
  return { cached: true, age: Math.floor((Date.now() - entry.fetchedAt) / 1000) }
}

export function clearCache(key?: string): void {
  if (key) cache.delete(key)
  else cache.clear()
}
