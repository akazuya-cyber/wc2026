// ─────────────────────────────────────────────────────────────────────────────
// types/football.ts
// Central type definitions — all components and API routes import from here
// ─────────────────────────────────────────────────────────────────────────────

// ── Teams ─────────────────────────────────────────────────────────────────────

export interface Team {
  id: number
  name: string        // Full name e.g. "France"
  code: string        // 3-letter e.g. "FRA"
  flag: string        // emoji flag e.g. "🇫🇷"
  logo?: string       // URL from API (optional)
}

// ── Group Stage ───────────────────────────────────────────────────────────────

export interface GroupEntry {
  rank: number        // 1–4 within group
  team: Team
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
  form?: string[]     // e.g. ['W','D','L'] — last N results
}

export interface Group {
  name: string        // e.g. "Group A"
  letter: string      // e.g. "A"
  entries: GroupEntry[]
}

// Third-place ranking entry (computed from all 12 groups)
export interface ThirdPlaceEntry extends GroupEntry {
  group: string       // which group they came from e.g. "A"
  qualifies: boolean  // top 8 third-placed teams advance
}

// ── Matches ───────────────────────────────────────────────────────────────────

export type MatchStatus =
  | 'NS'    // Not Started
  | '1H'    // First Half
  | 'HT'    // Half Time
  | '2H'    // Second Half
  | 'ET'    // Extra Time
  | 'P'     // Penalty Shootout
  | 'FT'    // Full Time
  | 'AET'   // After Extra Time
  | 'PEN'   // After Penalties
  | 'PST'   // Postponed
  | 'CANC'  // Cancelled

export type MatchRound =
  | 'Group Stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | '3rd Place Final'
  | 'Final'

export interface GoalEvent {
  player: string
  minute: number
  penalty: boolean
  ownGoal: boolean
}

export interface Match {
  id: number
  date: string          // ISO 8601 e.g. "2026-06-11T19:00:00-04:00"
  status: MatchStatus
  minute?: number       // current match minute if live
  round: MatchRound
  group?: string        // e.g. "A" — only for Group Stage
  venue: string
  homeTeam: Team
  awayTeam: Team
  homeScore: number | null
  awayScore: number | null
  homeScorers: GoalEvent[]
  awayScorers: GoalEvent[]
  // Penalty shootout result (knockout stages only) — set when the match
  // was decided on penalties after a draw in normal/extra time.
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
}

// Matches grouped by date for schedule view
export interface MatchDay {
  date: string          // "2026-06-11"
  matches: Match[]
}

// ── Top Scorers ───────────────────────────────────────────────────────────────

export interface TopScorer {
  rank: number
  player: {
    id: number
    name: string
    photo?: string
  }
  team: Team
  goals: number
  assists: number
  appearances: number
  penaltyGoals: number
}

// ── Squads ────────────────────────────────────────────────────────────────────

export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker'

export interface Player {
  id: number
  number: number
  name: string
  position: Position
  club: string
  clubLogo?: string
  age?: number
  caps?: number
}

export interface Squad {
  team: Team
  coach: string
  players: Player[]
}

// ── API Response wrappers ─────────────────────────────────────────────────────

// Generic wrapper for all internal API routes
export interface ApiResponse<T> {
  data: T
  updatedAt: string   // ISO timestamp of last fetch from upstream
  cached: boolean     // true if served from cache
}

export interface ApiError {
  error: string
  code?: number
}
