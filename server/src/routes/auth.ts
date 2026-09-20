import bcrypt from "bcrypt";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();

const SALT_ROUNDS = 10;

type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  major: string | null;
};

function signToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

function publicUser(user: {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  major: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    major: user.major,
  };
}

function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  );
}

function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 6;
}

function optionalTrimmed(value: unknown, maxLen: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, maxLen);
}

/** POST /api/auth/register — create user, return JWT + public user */
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body ?? {};

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "Valid email is required" });
      return;
    }
    if (!isValidPassword(password)) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name:
          typeof name === "string" && name.trim().length > 0
            ? name.trim().slice(0, 80)
            : null,
      },
    });

    const token = signToken(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("register failed", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/** POST /api/auth/login — verify credentials, return JWT + public user */
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!isValidEmail(email) || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("login failed", err);
    res.status(500).json({ error: "Login failed" });
  }
});

/** GET /api/auth/me — current user (requires Bearer token) */
authRouter.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        major: true,
      },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ user });
  } catch (err) {
    console.error("me failed", err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

/** PATCH /api/auth/me — update basic student profile fields */
authRouter.patch("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const name = optionalTrimmed(req.body?.name, 80);
    const bio = optionalTrimmed(req.body?.bio, 500);
    const major = optionalTrimmed(req.body?.major, 80);

    if (name === undefined && bio === undefined && major === undefined) {
      res.status(400).json({ error: "Provide name, bio, and/or major to update" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(major !== undefined ? { major } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        major: true,
      },
    });

    res.json({ user });
  } catch (err) {
    console.error("profile update failed", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
