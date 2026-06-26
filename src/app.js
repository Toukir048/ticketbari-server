import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getDB } from "./config/db.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("TicketBari server is running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TicketBari server health is okay",
  });
});

app.get("/db-health", async (req, res) => {
  try {
    const db = getDB();
    await db.command({ ping: 1 });

    res.status(200).json({
      success: true,
      message: "MongoDB connection is okay",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "MongoDB connection failed",
      error: error.message,
    });
  }
});

export default app;