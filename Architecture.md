# Architecture

## Overview

```
Browser: Next.js (menus) + Phaser (game canvas)
   | inputs                         ^ state diffs (20/s)
   v                                |
Colyseus server: ArenaRoom (authoritative simulation) + HTTP routes
   | match end: batch insert events
   v
Postgres <--- Evolution job reads events, inserts new BossVersion
   ^
   | latest BossVersion loaded at match start
Colyseus server
```

## Principles

1. **Server authority.** Clients send inputs (move direction, ability id). The server computes positions, damage, deaths. Clients only render.
2. **Fixed tick.** Simulation runs at 20 Hz (50 ms) with a fixed timestep. Same input, same result.
3. **Data-driven boss.** All boss numbers and abilities come from a versioned JSON config. Evolution = producing the next config.
4. **One backend.** Only `apps/server` touches the database. Web reads via server HTTP routes.
5. **Whitelisted evolution.** The evolution step can only pick from known modifiers with capped values, so every boss version is valid and beatable.

## Components

### apps/server (Colyseus)
- `ArenaRoom`: lifecycle (join, leave, start, end), tick loop, input handling.
- State schema: `Player` (id, name, x, y, hp, cooldowns), `Boss` (x, y, hp, state, version), `Projectile`, `Hazard` (telegraphed zones).
- Systems run each tick: input, movement, boss AI, combat resolution, win/lose check.
- Event recorder: buffers events in memory, writes once at match end.
- HTTP routes: guest session, leaderboard, match results, boss versions.

### apps/web (Next.js + Phaser)
- Pages: lobby, room, results, leaderboard, evolution dashboard.
- `GameCanvas` client-only component mounts the Phaser game and joins the Colyseus room.
- Phaser scene: reads synced state, interpolates between updates, sends inputs. No game rules here.

### apps/evolution
- Battle Analyzer: aggregate last N matches into features.
- Pattern Detector: find dominant tactics.
- Boss Evolution: map patterns to whitelisted modifiers.
- Balance check: target 40-60% win rate, hard caps on resistances and cooldowns.
- Output: new `BossVersion` row with a human-readable `changes` summary.

### packages/shared
- Message names and payload types, game constants (tick rate, arena size), boss config zod schema, modifier whitelist with caps.

### packages/db
- Prisma schema and generated client (Prisma 7).

## Boss config (example)

```json
{
  "version": 7,
  "baseHp": 12000,
  "resistances": { "fire": 0.4, "ice": 0, "physical": 0.1 },
  "abilities": ["slam", "fire_shield", "aoe_pulse"],
  "behavior": { "aggroSwitchSec": 8, "enrageBelowHp": 0.25 }
}
```

## Evolution loop

1. Record events during the match.
2. Aggregate: damage share by element, skill usage, player spread, distance to boss, deaths by cause.
3. Detect dominant tactics.
4. Map to modifiers (fire heavy -> fire resist/shield; grouped -> AoE; kiting -> dash/projectile).
5. Balance check against the recent win rate.
6. Insert new BossVersion. Next match loads it.

## Data model

- **User**: id, username, email (nullable for guests)
- **Match**: id, startedAt, endedAt, result, bossVersionId
- **MatchPlayer**: id, userId, matchId, damageDealt, deaths, survivalSec
- **BossVersion**: id, version, config (JSONB), changes, createdAt
- **BattleEvent**: id, matchId, type, tMs, payload (JSONB)

Index BattleEvent on (matchId, type).

## Networking

- Tick 20 Hz, patch rate 20 Hz.
- Client interpolates remote entities (render ~100 ms behind). Own-player prediction only if movement feels laggy.
- Rate limit inputs per client. Validate every input server-side (direction is normalized, ability is off cooldown, etc).

## Deployment

- Web on Vercel. Server on Fly.io/Railway (persistent WebSocket process, single instance first). Postgres on Neon/Supabase.
- Scaling past one server instance needs Redis (presence + matchmaking). Not needed for MVP.

## Risks

- Phaser 4 is new; most tutorials target v3. Fallback: latest v3.
- Colyseus is solo-maintained; pin versions.
- Prisma `latest` is v8 RC; pin v7.
- Boss feels unfair: enforce caps and the balance check.
