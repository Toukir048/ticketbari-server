import express from "express";
import { getVendorRevenueOverview } from "../controllers/vendor.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyVendor } from "../middlewares/verifyRole.js";

const router = express.Router();

router.get("/revenue-overview", verifyToken, verifyVendor, getVendorRevenueOverview);

export default router;