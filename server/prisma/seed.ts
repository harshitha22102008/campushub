/**
 * Demo seed — clubs, memberships, upcoming events for local demos.
 *
 * Credentials:
 *   email:    demo@campushub.local
 *   password: demo1234
 */
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@campushub.local";
const DEMO_PASSWORD = "demo1234";
const SALT_ROUNDS = 10;

function daysFromNow(days: number, hour = 17): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const demo = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      passwordHash,
      name: "Demo Student",
      bio: "Always at the bulletin board.",
      major: "B.Tech CSE",
    },
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Demo Student",
      bio: "Always at the bulletin board.",
      major: "B.Tech CSE",
    },
  });

  const peerHash = await bcrypt.hash("peer1234", SALT_ROUNDS);
  const peer = await prisma.user.upsert({
    where: { email: "peer@campushub.local" },
    update: { passwordHash: peerHash, name: "Peer Organizer" },
    create: {
      email: "peer@campushub.local",
      passwordHash: peerHash,
      name: "Peer Organizer",
      major: "Design",
    },
  });

  // Clear prior demo clubs owned by demo/peer (cascade cleans memberships/events)
  await prisma.club.deleteMany({
    where: { creatorId: { in: [demo.id, peer.id] } },
  });

  const coding = await prisma.club.create({
    data: {
      name: "Coding Club",
      description: "Hack nights, workshops, and open source sprints.",
      creatorId: demo.id,
      memberships: {
        create: [
          { userId: demo.id, role: "admin" },
          { userId: peer.id, role: "member" },
        ],
      },
    },
  });

  const drama = await prisma.club.create({
    data: {
      name: "Drama Society",
      description: "Auditions, open mics, and stagecraft.",
      creatorId: peer.id,
      memberships: {
        create: [
          { userId: peer.id, role: "admin" },
          { userId: demo.id, role: "member" },
        ],
      },
    },
  });

  const robotics = await prisma.club.create({
    data: {
      name: "Robotics",
      description: "Builders, sensors, and late-night soldering.",
      creatorId: peer.id,
      memberships: {
        create: [{ userId: peer.id, role: "admin" }],
      },
    },
  });

  const photo = await prisma.club.create({
    data: {
      name: "Photography",
      description: "Walks, darkroom tips, and campus stories.",
      creatorId: demo.id,
      memberships: {
        create: [{ userId: demo.id, role: "admin" }],
      },
    },
  });

  const events = [
    {
      title: "Hack night: REST APIs",
      description: "Build a tiny Express API together. Laptops welcome.",
      startsAt: daysFromNow(2, 18),
      location: "Lab 3",
      clubId: coding.id,
      createdById: demo.id,
    },
    {
      title: "Open mic auditions",
      description: "Two-minute slots. Sign up on arrival.",
      startsAt: daysFromNow(3, 15),
      location: "Auditorium",
      clubId: drama.id,
      createdById: peer.id,
    },
    {
      title: "Bot showcase",
      description: "Show your line-follower or bring a sketch.",
      startsAt: daysFromNow(5, 17),
      location: "Maker space",
      clubId: robotics.id,
      createdById: peer.id,
    },
    {
      title: "Golden hour walk",
      description: "Campus golden hour — any camera, any phone.",
      startsAt: daysFromNow(4, 17),
      location: "Main quad",
      clubId: photo.id,
      createdById: demo.id,
    },
    {
      title: "Git workshop",
      description: "Branching, PRs, and fixing merge drama.",
      startsAt: daysFromNow(7, 16),
      location: "CS seminar",
      clubId: coding.id,
      createdById: demo.id,
    },
    {
      title: "Improv circle",
      description: "Warm-ups and short-form games. No experience needed.",
      startsAt: daysFromNow(6, 19),
      location: "Studio B",
      clubId: drama.id,
      createdById: peer.id,
    },
  ];

  for (const ev of events) {
    await prisma.event.create({
      data: {
        ...ev,
        joins: {
          create: [{ userId: ev.createdById }],
        },
      },
    });
  }

  // Demo user RSVPs to drama open mic
  const openMic = await prisma.event.findFirst({
    where: { title: "Open mic auditions" },
  });
  if (openMic) {
    await prisma.eventJoin.upsert({
      where: {
        userId_eventId: { userId: demo.id, eventId: openMic.id },
      },
      update: {},
      create: { userId: demo.id, eventId: openMic.id },
    });
  }

  console.log("Seeded CampusHub demo data.");
  console.log(`  login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  clubs: ${coding.name}, ${drama.name}, ${robotics.name}, ${photo.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
