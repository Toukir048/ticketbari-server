import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";

import { auth } from "./config/betterAuth.js";
import { isOriginAllowed } from "./utils/allowedOrigins.js";

import jwtRoutes from "./routes/jwt.routes.js";
import userRoutes from "./routes/user.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import betterAuthRoutes from "./routes/betterAuth.routes.js";

import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TicketBari server is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server health is good",
    time: new Date(),
  });
});

app.use("/api/jwt", jwtRoutes);
app.use("/api/better-auth", betterAuthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vendor", vendorRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;