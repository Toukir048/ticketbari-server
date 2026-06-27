import { fromNodeHeaders } from "better-auth/node";

import { auth } from "../config/betterAuth.js";
import { getDB } from "../config/db.js";
import { createToken, cookieOptions } from "../utils/jwt.js";

export const syncBetterAuthUser = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        message: "Better Auth session not found.",
      });
    }

    const db = getDB();
    const usersCollection = db.collection("users");

    const betterAuthUser = session.user;
    const email = betterAuthUser.email.toLowerCase();

    const existingUser = await usersCollection.findOne({
      email,
    });

    const userPayload = {
      name: betterAuthUser.name || existingUser?.name || "Google User",
      email,
      photoURL: betterAuthUser.image || existingUser?.photoURL || "",
      updatedAt: new Date(),
    };

    await usersCollection.updateOne(
      { email },
      {
        $set: userPayload,
        $setOnInsert: {
          role: "user",
          isFraud: false,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const dbUser = await usersCollection.findOne({
      email,
    });

    const token = createToken(dbUser.email);

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Better Auth user synced successfully.",
      user: dbUser,
      role: dbUser.role || "user",
    });
  } catch (error) {
    next(error);
  }
};