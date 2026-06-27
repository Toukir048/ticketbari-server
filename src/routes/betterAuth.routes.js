import express from "express";
import { syncBetterAuthUser } from "../controllers/betterAuth.controller.js";

const router = express.Router();

router.get("/sync", syncBetterAuthUser);

export default router;