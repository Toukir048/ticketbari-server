import express from "express";
import {
  createOrUpdateUser,
  getAllUsers,
  getMyProfile,
  getUserRole,
  markVendorAsFraud,
  updateUserRole,
} from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = express.Router();

router.post("/", createOrUpdateUser);

router.get("/me", verifyToken, getMyProfile);

router.get("/role", verifyToken, getUserRole);

router.get("/", verifyToken, verifyAdmin, getAllUsers);

router.patch("/:email/role", verifyToken, verifyAdmin, updateUserRole);

router.patch("/:email/fraud", verifyToken, verifyAdmin, markVendorAsFraud);

export default router;