# data/squads.json — Squad Roster Data

Static, manually-maintained file with the final 26-player squads for all
48 World Cup 2026 teams. `worldcup26.ir` (our live data source) doesn't
provide a squads endpoint, so this fills the gap.

## Format

Keyed by `team_id` (1–48), matching the IDs used by `worldcup26.ir`.
The `_team_name` field is a reference comment only — not read by the app.

```json
{
  "33": {
    "_team_name": "France",
    "coach": "Didier Deschamps",
    "players": [
      { "number": 1,  "name": "Mike Maignan",  "position": "Goalkeeper", "club": "AC Milan" },
      { "number": 10, "name": "Kylian Mbappé", "position": "Attacker",   "club": "Real Madrid" }
    ]
  }
}
```

## Fields

| Field      | Type   | Notes                                                              |
| ---------- | ------ | ------------------------------------------------------------------ |
| `number`   | number | Squad/jersey number                                                |
| `name`     | string | Player's display name                                              |
| `position` | string | Must be exactly one of: `"Goalkeeper"`, `"Defender"`, `"Midfielder"`, `"Attacker"` |
| `club`     | string | Current club, e.g. `"Real Madrid"`. Leave `""` if unknown          |

`position` is case-sensitive and must match one of the 4 values exactly —
anything else falls back to `"Midfielder"` in the UI.

## Status

- **France (team_id 33)** is filled in as a complete example (26 players).
- All other 47 teams have `"players": []` — the squad modal will show
  "ข้อมูลผู้เล่นยังไม่พร้อม" (squad data not yet available) until filled.

## team_id → Country reference

```
1  Mexico              13 United States        25 Belgium            37 Argentina
2  South Africa        14 Paraguay             26 Egypt              38 Algeria
3  South Korea         15 Australia            27 Iran               39 Austria
4  Czech Republic      16 Turkey               28 New Zealand        40 Jordan
5  Canada              17 Germany              29 Spain              41 Portugal
6  Bosnia & Herz.      18 Curaçao              30 Cape Verde         42 DR Congo
7  Qatar               19 Ivory Coast           31 Saudi Arabia       43 Uzbekistan
8  Switzerland         20 Ecuador              32 Uruguay            44 Colombia
9  Brazil              21 Netherlands          33 France             45 England
10 Morocco             22 Japan                34 Senegal            46 Croatia
11 Haiti               23 Sweden               35 Iraq               47 Ghana
12 Scotland            24 Tunisia              36 Norway             48 Panama
```

## Filling in a team

1. Find the `team_id` from the table above.
2. Replace `"coach": ""` with the head coach's name.
3. Replace `"players": []` with an array of 26 player objects (see France
   for the exact shape).
4. Goalkeepers are usually numbered 1, 12, 23 (3 GKs in a 26-man squad).
5. Order within the array doesn't matter — the UI groups and sorts by
   position and jersey number automatically.

No code changes needed — the app reads this file directly via
`lib/football-api.ts → fetchSquad()`.
