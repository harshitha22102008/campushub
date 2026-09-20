# CampusHub

> Student campus platform for clubs and events — auth, membership, and User–Club–Event relationships.

**Author:** Harshitha  
**Stack:** React · TypeScript · Vite · Tailwind · Node/Express · Prisma · SQLite · JWT  
**Status:** In progress

## Problem

Students need a simple place to discover campus clubs, join communities, and sign up for club events without juggling chat groups and spreadsheets.

## Why this project

Learn roles (member vs club-admin), multi-entity relations (User–Club–Event), and protected routes on the program’s locked full-stack.

## Features (MVP)

- [x] Authentication (register / login)
- [ ] Browse and create clubs (creator = club admin)
- [ ] Create and join events under a club
- [ ] List “my clubs” and “my events”
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

### Server

```bash
cd server
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### Client

```bash
cd client
cp .env.example .env
npm run dev
```

Or from root: `npm run dev` (runs both).

Open http://localhost:5173.

## Repo

- GitHub: https://github.com/harshitha22102008/campushub
