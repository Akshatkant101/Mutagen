# Adaptive Boss AI Arena

Real-time co-op game (2-4 players) against one AI boss that learns from past battles and evolves counters to the tactics players overuse.

> Working title. Candidates: Evolvarena, Mutagen, Boss Remembers.

## How it works

1. Players join a room and fight the boss. The server runs the whole simulation.
2. Every damage, ability, death and boss action is logged.
3. After matches, an evolution job finds dominant tactics (e.g. 62% fire damage) and produces a new boss version (e.g. fire shield).
4. The next match loads the new version. A dashboard shows the boss timeline.

## Tech stack

| Layer | Tech |
|---|---|
| Game client | Phaser 4 + TypeScript |
| Web UI | Next.js 16 + React 19 + Tailwind |
| Game server | Node 22 + Colyseus 0.17 |
| Database | Postgres + Prisma 7 (pinned, do not use v8 RC) |
| Evolution | TypeScript job (rules first, LLM later, whitelisted modifiers) |
| Infra | Vercel (web), Fly.io/Railway (server), Neon/Supabase (db), GitHub Actions |

## Repo layout

```
apps/
  web/         Next.js: lobby, results, leaderboard, evolution dashboard, hosts Phaser
  server/      Colyseus rooms + HTTP routes. The only thing that talks to the DB
  evolution/   Script that reads events, writes the next BossVersion
packages/
  shared/      Types, constants, message names, boss config schema (zod)
  db/          Prisma schema + client
docs/          Architecture, workflow, step-by-step build files
```

## Quick start

```bash
pnpm install
cp .env.example .env        # DATABASE_URL, SERVER_URL
pnpm --filter db migrate
pnpm dev                    # web :3000, server :2567
```

## Build plan

See `docs/steps/`. Do them in order. Each step has a "done when" check.

1. Skeleton + movement
2. Boss + combat
3. Event logging
4. Results, lobby, leaderboard
5. Evolution loop + dashboard
6. Polish + deploy

## Docs

- `ARCHITECTURE.md`: how the system fits together
- `docs/frontend-backend-management.txt`: boundaries, contracts, workflow
