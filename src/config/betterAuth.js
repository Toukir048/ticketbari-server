import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { getDB } from "./db.js";
import { getAllowedOrigins } from "../utils/allowedOrigins.js";

const betterAuthDB = getDB();

const cleanBaseUrl = (url = "") => {
  return url.trim().replace(/\/+$/, "");
};

export const auth = betterAuth({
  appName: "TicketBari",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: cleanBaseUrl(process.env.BETTER_AUTH_URL || "http://localhost:5000"),

  trustedOrigins: getAllowedOrigins(),

  database: mongodbAdapter(betterAuthDB),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  advanced: {
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
});