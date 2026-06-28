import express from "express";
import { createToken, cookieOptions, clearCookieOptions } from "../utils/jwt.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

const extractEmail = (value) => {
  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  if (value && typeof value.email === "string") {
    return value.email.trim().toLowerCase();
  }

  return "";
};

router.post("/create", async (req, res) => {
  try {
    const email = extractEmail(req.body?.email || req.body);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required to create JWT.",
      });
    }

    const token = createToken(email);

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "JWT token created successfully.",
      email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create JWT token.",
      error: error.message,
    });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("token", clearCookieOptions);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to logout.",
      error: error.message,
    });
  }
});

export default router;