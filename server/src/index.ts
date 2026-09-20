import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { clubsRouter } from "./routes/clubs.js";
import { eventsRouter } from "./routes/events.js";
import { healthRouter } from "./routes/health.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/clubs", clubsRouter);
app.use("/api/events", eventsRouter);

app.listen(PORT, () => {
  console.log(`CampusHub API listening on http://localhost:${PORT}`);
});
