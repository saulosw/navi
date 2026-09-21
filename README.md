# Navi

A private desktop place to hang out with a small group of friends.

Navi is a personal project: an Electron desktop client and a Node API, built to
learn and to be used by a handful of people who already know each other. There is
no public registration, no server directory, and no monetization. Accounts are
created by whoever administers the deployment.

## Status

Navi is early. This is what the code actually does today:

**Working**

- Password authentication for accounts created in advance by an administrator.
- Passwords stored as salted scrypt derivations, never in plaintext.
- Sessions that expire, can be revoked, and are invalidated by a password reset
  or a deactivation.
- Attempt limiting per account and per address.
- Optional "keep me signed in", using the operating system's secure storage when
  it is available.
- A command line tool for creating accounts, resetting passwords and deactivating
  accounts.
- A member directory showing the other people on the server.

**Not working yet**

- **Messages are not delivered or stored.** The chat and channel screens are a
  local preview: whatever you type stays in the window and is gone on reload. The
  interface says so wherever it applies.
- Voice, video, screen sharing, presence and attachments are not implemented.

## Requirements

- Node.js 24 (see `.nvmrc`) and npm 11.
- Docker, to run PostgreSQL locally.

## Setup

```bash
npm ci
npm run setup:env     # writes .env from .env.example
npm run db:up         # starts PostgreSQL in Docker
npm run db:migrate
```

Create an account before trying to sign in — there is no registration screen:

```bash
npm run admin -- create
```

The tool asks for a username, a display name and a password, and never echoes the
password. Passwords must be at least 15 characters. `reset-password` and
`deactivate` take the same form and both revoke that account's active sessions.

Then start the API and the desktop client together:

```bash
npm run dev
```

## Commands

| Command                             | Purpose                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                       | API and desktop client together                                          |
| `npm run check`                     | Formatting, lint, architecture rules, types and tests with coverage      |
| `npm test`                          | Tests only                                                               |
| `npm run build`                     | Type check and build the desktop app                                     |
| `npm run package:desktop`           | Build local installers, without publishing                               |
| `npm run db:up` / `npm run db:down` | Start or stop PostgreSQL                                                 |
| `npm run db:migrate`                | Apply pending migrations                                                 |
| `npm run test:integration`          | Database smoke test                                                      |
| `npm run test:auth-integration`     | Authentication against a disposable database (needs `TEST_DATABASE_URL`) |
| `npm run admin -- <action>`         | `create`, `reset-password` or `deactivate`                               |

## Layout

```text
apps/api          Node API — domain, application, adapters, infrastructure, main
apps/desktop      Electron main and preload, plus the React renderer
packages/contracts  Types shared between the API and the desktop client
```

The API follows Clean Architecture: the domain has no framework knowledge, the
application layer defines ports, infrastructure implements them, and only `main`
wires concrete dependencies together. The boundaries are enforced automatically by
`npm run check`, which fails on an inward-pointing violation or a dependency cycle.

In the desktop client, the renderer is unprivileged. It runs sandboxed with context
isolation, has no Node access, and never talks to the API directly — every request
goes through a small, typed, validated IPC surface in the main process. Session
tokens stay in the main process and are never exposed to the renderer.

## Configuration

`.env` holds local settings only; it is not committed. `.env.example` lists every
variable with development defaults. The API endpoint used by the desktop client is
a public address, not a secret, but it must be HTTPS unless it points at your own
machine during development.

Do not commit real credentials, and do not put secrets in any `VITE_`-prefixed
variable — those become part of the build output.
