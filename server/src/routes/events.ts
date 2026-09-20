import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const eventsRouter = Router();

eventsRouter.use(requireAuth);

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalText(value: unknown, maxLen: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, maxLen);
}

function parseStartsAt(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  location: string | null;
  clubId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  club: { id: string; name: string };
  _count: { joins: number };
  joins: { id: string }[];
};

function publicEvent(event: EventRow) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    startsAt: event.startsAt,
    location: event.location,
    clubId: event.clubId,
    clubName: event.club.name,
    createdById: event.createdById,
    joinCount: event._count.joins,
    joined: event.joins.length > 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

const eventInclude = (userId: string) => ({
  club: { select: { id: true, name: true } },
  _count: { select: { joins: true } },
  joins: {
    where: { userId },
    select: { id: true },
    take: 1,
  },
});

/** GET /api/events — upcoming campus events feed */
eventsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clubIdRaw = req.query.clubId;
    const clubId =
      typeof clubIdRaw === "string" && clubIdRaw.length > 0
        ? clubIdRaw
        : undefined;

    const events = await prisma.event.findMany({
      where: {
        ...(clubId ? { clubId } : {}),
        startsAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      include: eventInclude(userId),
      orderBy: { startsAt: "asc" },
      take: 50,
    });
    res.json({ events: events.map(publicEvent) });
  } catch (err) {
    console.error("list events failed", err);
    res.status(500).json({ error: "Failed to load events" });
  }
});

/** GET /api/events/mine — events the user registered for */
eventsRouter.get("/mine", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const joins = await prisma.eventJoin.findMany({
      where: { userId },
      include: {
        event: { include: eventInclude(userId) },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      events: joins.map((j) => publicEvent(j.event)),
    });
  } catch (err) {
    console.error("list my events failed", err);
    res.status(500).json({ error: "Failed to load your events" });
  }
});

/** GET /api/events/:id */
eventsRouter.get("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      include: eventInclude(userId),
    });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ event: publicEvent(event) });
  } catch (err) {
    console.error("get event failed", err);
    res.status(500).json({ error: "Failed to load event" });
  }
});

/** POST /api/events — create event under a club (club admin only) */
eventsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { title, description, startsAt, location, clubId } = req.body ?? {};

    if (!isNonEmptyString(title)) {
      res.status(400).json({ error: "Event title is required" });
      return;
    }
    if (!isNonEmptyString(clubId)) {
      res.status(400).json({ error: "clubId is required" });
      return;
    }
    const when = parseStartsAt(startsAt);
    if (!when) {
      res.status(400).json({ error: "Valid startsAt datetime is required" });
      return;
    }

    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: clubId.trim() } },
    });
    if (!membership || membership.role !== "admin") {
      res.status(403).json({ error: "Only club admins can create events" });
      return;
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim().slice(0, 120),
        description: optionalText(description, 800),
        startsAt: when,
        location: optionalText(location, 120),
        clubId: clubId.trim(),
        createdById: userId,
        joins: {
          create: { userId },
        },
      },
      include: eventInclude(userId),
    });

    res.status(201).json({ event: publicEvent(event) });
  } catch (err) {
    console.error("create event failed", err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

/** POST /api/events/:id/join — register for event */
eventsRouter.post("/:id/join", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const existing = await prisma.eventJoin.findUnique({
      where: { userId_eventId: { userId, eventId: id } },
    });
    if (existing) {
      res.status(409).json({ error: "Already registered for this event" });
      return;
    }

    await prisma.eventJoin.create({
      data: { userId, eventId: id },
    });

    const updated = await prisma.event.findUniqueOrThrow({
      where: { id },
      include: eventInclude(userId),
    });
    res.status(201).json({ event: publicEvent(updated) });
  } catch (err) {
    console.error("join event failed", err);
    res.status(500).json({ error: "Failed to register for event" });
  }
});

/** POST /api/events/:id/leave — unregister */
eventsRouter.post("/:id/leave", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);

    const existing = await prisma.eventJoin.findUnique({
      where: { userId_eventId: { userId, eventId: id } },
    });
    if (!existing) {
      res.status(404).json({ error: "Not registered for this event" });
      return;
    }

    await prisma.eventJoin.delete({
      where: { userId_eventId: { userId, eventId: id } },
    });

    res.status(204).send();
  } catch (err) {
    console.error("leave event failed", err);
    res.status(500).json({ error: "Failed to leave event" });
  }
});
