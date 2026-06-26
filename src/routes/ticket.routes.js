import express from "express";
import {
  createTicket,
  deleteTicket,
  getAdvertisedTickets,
  getAllTicketsForAdmin,
  getApprovedTickets,
  getApprovedTicketsForAdvertisement,
  getLatestTickets,
  getMyAddedTickets,
  getTicketById,
  toggleAdvertiseTicket,
  updateTicket,
  updateTicketVerificationStatus,
} from "../controllers/ticket.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin, verifyVendor } from "../middlewares/verifyRole.js";

const router = express.Router();

// public routes first
router.get("/approved", getApprovedTickets);
router.get("/advertised", getAdvertisedTickets);
router.get("/latest", getLatestTickets);

// vendor routes
router.post("/", verifyToken, verifyVendor, createTicket);
router.get("/my-tickets", verifyToken, verifyVendor, getMyAddedTickets);

// admin routes
router.get("/admin/all", verifyToken, verifyAdmin, getAllTicketsForAdmin);

router.patch(
  "/admin/:id/status",
  verifyToken,
  verifyAdmin,
  updateTicketVerificationStatus
);

router.get(
  "/admin/advertisement",
  verifyToken,
  verifyAdmin,
  getApprovedTicketsForAdvertisement
);

router.patch(
  "/admin/:id/advertise",
  verifyToken,
  verifyAdmin,
  toggleAdvertiseTicket
);

// dynamic id route must stay at the bottom
router.get("/:id", verifyToken, getTicketById);
router.patch("/:id", verifyToken, verifyVendor, updateTicket);
router.delete("/:id", verifyToken, verifyVendor, deleteTicket);

export default router;