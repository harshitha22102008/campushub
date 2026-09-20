import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const clubsRouter = Router();

clubsRouter.use(requireAuth);

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalDescription(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.slice(0, 500);
}

type ClubRow = {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { memberships: number; events: number };
  memberships: { role: string }[];
};

function publicClub(club: ClubRow, _userId: string) {
  const membership = club.memberships[0];
  return {
    id: club.id,
    name: club.name,
    description: club.description,
    creatorId: club.creatorId,
    memberCount: club._count.memberships,
    eventCount: club._count.events,
    joined: Boolean(membership),
    role: membership?.role ?? null,
    createdAt: club.createdAt,
    updatedAt: club.updatedAt,
  };
}

const clubInclude = (userId: string) => ({
  _count: { select: { memberships: true, events: true } },
  memberships: {
    where: { userId },
    select: { role: true },
    take: 1,
  },
});

/** GET /api/clubs — browse all clubs */
clubsRouter.get("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const clubs = await prisma.club.findMany({
      include: clubInclude(userId),
      orderBy: { createdAt: "desc" },
    });
    res.json({ clubs: clubs.map((c) => publicClub(c, userId)) });
  } catch (err) {
    console.error("list clubs failed", err);
    res.status(500).json({ error: "Failed to load clubs" });
  }
});

/** GET /api/clubs/mine — clubs the current user belongs to */
clubsRouter.get("/mine", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const memberships = await prisma.clubMembership.findMany({
      where: { userId },
      include: {
        club: { include: clubInclude(userId) },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      clubs: memberships.map((m) => publicClub(m.club, userId)),
    });
  } catch (err) {
    console.error("list my clubs failed", err);
    res.status(500).json({ error: "Failed to load your clubs" });
  }
});

/** GET /api/clubs/:id */
clubsRouter.get("/:id", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);
    const club = await prisma.club.findUnique({
      where: { id },
      include: clubInclude(userId),
    });
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }
    res.json({ club: publicClub(club, userId) });
  } catch (err) {
    console.error("get club failed", err);
    res.status(500).json({ error: "Failed to load club" });
  }
});

/** POST /api/clubs — create club; creator becomes admin */
clubsRouter.post("/", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name, description } = req.body ?? {};

    if (!isNonEmptyString(name)) {
      res.status(400).json({ error: "Club name is required" });
      return;
    }

    const club = await prisma.club.create({
      data: {
        name: name.trim().slice(0, 80),
        description: optionalDescription(description),
        creatorId: userId,
        memberships: {
          create: { userId, role: "admin" },
        },
      },
      include: clubInclude(userId),
    });

    res.status(201).json({ club: publicClub(club, userId) });
  } catch (err) {
    console.error("create club failed", err);
    res.status(500).json({ error: "Failed to create club" });
  }
});

/** POST /api/clubs/:id/join — join as member */
clubsRouter.post("/:id/join", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);

    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) {
      res.status(404).json({ error: "Club not found" });
      return;
    }

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: id } },
    });
    if (existing) {
      res.status(409).json({ error: "Already a member of this club" });
      return;
    }

    await prisma.clubMembership.create({
      data: { userId, clubId: id, role: "member" },
    });

    const updated = await prisma.club.findUniqueOrThrow({
      where: { id },
      include: clubInclude(userId),
    });
    res.status(201).json({ club: publicClub(updated, userId) });
  } catch (err) {
    console.error("join club failed", err);
    res.status(500).json({ error: "Failed to join club" });
  }
});

/** POST /api/clubs/:id/leave — leave club (admins cannot leave if sole admin) */
clubsRouter.post("/:id/leave", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = paramId(req.params.id);

    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: id } },
    });
    if (!membership) {
      res.status(404).json({ error: "Not a member of this club" });
      return;
    }

    if (membership.role === "admin") {
      const adminCount = await prisma.clubMembership.count({
        where: { clubId: id, role: "admin" },
      });
      if (adminCount <= 1) {
        res.status(400).json({
          error: "Sole admin cannot leave — transfer admin or delete the club",
        });
        return;
      }
    }

    await prisma.clubMembership.delete({
      where: { userId_clubId: { userId, clubId: id } },
    });

    res.status(204).send();
  } catch (err) {
    console.error("leave club failed", err);
    res.status(500).json({ error: "Failed to leave club" });
  }
});
