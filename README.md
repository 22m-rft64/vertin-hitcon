<h1 align="center">Vertin — HITCON CTF Bot</h1>

<p align="center">
  <em>"I am the one who records. The beginnings and endings of eras... and now, your team's CTFs as well."</em>
</p>

---

## Overview

Global coalition CTF team bot, scoped to HITCON CTF (Jeopardy). Manages CTF operations, challenge tracking, and real-time translation across Korean, English, Japanese, and Finnish.

## Quick Start

```bash
yarn install
yarn start
```

### Environment Variables

| Variable | Description |
|---|---|
| `DISCORD_TOKEN` | Bot token |
| `GUILD_ID` | Server ID |
| `CLIENT_ID` | Bot client ID |
| `MONGODB_URI` | MongoDB connection string |
| `CTF_NOTICE_CHANNEL` | CTF announcement channel ID |
| `ANTHROPIC_API_KEY` | Anthropic API key (translation) |
| `LOG_LEVEL` | `info` / `debug` |
| `HITCON_USER_AGENT` | Optional. Browser UA matching the `cf_clearance` cookie |

## Features

### CTF Management
1. `/ctf assign` — Create a new CTF (manual setup)
2. Auto-creates channels, roles, and scheduled events
3. Announcement with join button

### CTF Config (`/ctf config`)
- **CTF Management** — Rename, delete
- **Player Management** — Role changes, add members
- **Credentials** — URL + credential registration
- **Settings** — Flag format, start/end time, Event ID, channel sync

### Challenge Tracking
- `/ctf workon` — Join a challenge thread
- `/ctf solve` — Register a solve with contributors and flag
- `/ctf createchallenge` / `deletechallenge` / `renamechallenge`
- `/ctf status` — Current progress overview

### HITCON Platform Sync
- `/ctf pull` — Fetch challenges + scoreboard from the HITCON dashboard (`autopull` polls every 2 minutes)
- `/ctf scoreboard` — Cached scoreboard, live fetch on miss
- Auth: paste the browser session cookie (`session=...; cf_clearance=...`) into the credentials Token field

### Translation (Context Menu)
Right-click any message → Apps:
- **Translate** — Single message translation
- **Translate (Context)** — Surrounding conversation (5 messages above/below)
- **Translate (User)** — Consecutive messages from that person (block-based)

Powered by Anthropic API (Claude Haiku 4.5). Auto-detects user language from Discord client settings.

### i18n
- Supported: Korean, English, Japanese, Finnish
- Ephemeral responses follow user's Discord language
- Public messages default to English
- Command descriptions localized via `setDescriptionLocalizations`

## Architecture

```
src/
  commands/         Slash commands + context menu commands
  core/             Domain models, services, ports
  adapters/         MongoDB repositories, Discord integrations
  events/           Discord event handlers
  handlers/         Command, component, event, schedule handlers
  i18n/             Localization (ko, en, ja, fi)
  utils/            Shared utilities, components, CTF helpers
```

## Development

```bash
yarn check    # Type check
yarn test     # Run tests
```

---
