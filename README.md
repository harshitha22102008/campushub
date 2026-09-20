# CampusHub

> Student campus platform for clubs and events — auth, membership roles, and User–Club–Event relationships.

**Author:** Harshitha  
**Stack:** React · TypeScript · Vite · Tailwind · Node/Express · Prisma · SQLite · JWT  
**Status:** MVP complete  
**Identity:** Syne + Figtree · rose `#e11d48` · ice blue support · packed event grid ([UI_IDENTITIES.md](../harshitha-portfolio/docs/program/UI_IDENTITIES.md) §4)

## Problem

Students need a simple place to discover campus clubs, join communities, and sign up for club events without juggling chat groups and spreadsheets.

## Why this project

Learn roles (member vs club-admin), multi-entity relations (User–Club–Event), and protected routes on the program’s locked full-stack.

## Features (MVP)

- [x] Authentication (register / login)
- [x] Browse and create clubs (creator = club admin)
- [x] Create and join events under a club
- [x] List “my clubs” and “my events”
- [x] Basic student profile

## Features (Future)

- Messaging / DMs
- Admin moderation console
- Push notifications / email invites
- File uploads / RSVP waitlists

## Architecture

```
client (React) --JWT--> server (Express) --> Prisma --> SQLite
```

## APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/health | No | Health check |
| POST | /api/auth/register | No | Create account, return JWT |
| POST | /api/auth/login | No | Login, return JWT |
| GET | /api/auth/me | Yes | Current user |
| PATCH | /api/auth/me | Yes | Update name / bio / major |
| GET | /api/clubs | Yes | Browse clubs |
| GET | /api/clubs/mine | Yes | Clubs you belong to |
| POST | /api/clubs | Yes | Create club (you become admin) |
| POST | /api/clubs/:id/join | Yes | Join as member |
| POST | /api/clubs/:id/leave | Yes | Leave club |
| GET | /api/events | Yes | Upcoming events feed |
| GET | /api/events/mine | Yes | Events you registered for |
| POST | /api/events | Yes | Create event (club admin) |
| POST | /api/events/:id/join | Yes | RSVP / register |
| POST | /api/events/:id/leave | Yes | Unregister |

## Database

- User — email, passwordHash, name, bio, major
- Club — name, description, creatorId
- ClubMembership — userId, clubId, role (`admin` \| `member`)
- Event — title, description, startsAt, location, clubId, createdById
- EventJoin — userId, eventId

## Setup (local)

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm run install:all
```

### Env

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Database + seed

```bash
cd server
npx prisma migrate dev
npm run prisma:seed
```

Demo login: `demo@campushub.local` / `demo1234`

### Run

From repo root:

```bash
npm run dev
```

- Client: http://localhost:5173  
- API: http://localhost:5000  

## Repo

- GitHub: https://github.com/harshitha22102008/campushub
