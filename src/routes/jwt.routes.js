import express from "express";
import { createJwtToken, getCookieOptions } from "../utils/jwt.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required to create JWT token.",
      });
    }

    const token = createJwtToken({ email });

    res
      .cookie("token", token, getCookieOptions())
      .status(200)
      .json({
        success: true,
        message: "JWT token created successfully.",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create JWT token.",
      error: error.message,
    });
  }
});

router.post("/logout", (req, res) => {
  res
    .clearCookie("token", {
      ...getCookieOptions(),
      maxAge: 0,
    })
    .status(200)
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected user data loaded successfully.",
    user: req.user,
  });
});

export default router;