import express from "express";
import {
  cancelPendingBooking,
  createBooking,
  getMyBookings,
  getVendorRequestedBookings,
  updateBookingStatusByVendor,
} from "../controllers/booking.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyVendor } from "../middlewares/verifyRole.js";

const router = express.Router();

router.post("/", verifyToken, createBooking);

router.get("/my-bookings", verifyToken, getMyBookings);

router.get(
  "/vendor-requests",
  verifyToken,
  verifyVendor,
  getVendorRequestedBookings
);

router.patch(
  "/vendor/:id/status",
  verifyToken,
  verifyVendor,
  updateBookingStatusByVendor
);

router.patch("/:id/cancel", verifyToken, cancelPendingBooking);

export default router;