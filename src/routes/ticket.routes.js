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
  getTicketSeatMap,
  toggleAdvertiseTicket,
  updateTicket,
  updateTicketVerificationStatus,
} from "../controllers/ticket.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin, verifyVendor } from "../middlewares/verifyRole.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public ticket routes
|--------------------------------------------------------------------------
| এগুলো সবার আগে রাখতে হবে।
| না হলে /approved, /advertised, /latest route কে Express ভুল করে /:id ধরে ফেলবে।
*/
router.get("/approved", getApprovedTickets);

router.get("/advertised", getAdvertisedTickets);

router.get("/latest", getLatestTickets);

/*
|--------------------------------------------------------------------------
| Vendor ticket routes
|--------------------------------------------------------------------------
*/
router.post("/", verifyToken, verifyVendor, createTicket);

router.get("/my-tickets", verifyToken, verifyVendor, getMyAddedTickets);

/*
|--------------------------------------------------------------------------
| Admin ticket routes
|--------------------------------------------------------------------------
*/
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

/*
|--------------------------------------------------------------------------
| Protected ticket details / seat map routes
|--------------------------------------------------------------------------
| এই route গুলো dynamic /:id route এর আগে থাকবে।
*/
router.get("/:id/seats", verifyToken, getTicketSeatMap);

router.get("/:id", verifyToken, getTicketById);

router.patch("/:id", verifyToken, verifyVendor, updateTicket);

router.delete("/:id", verifyToken, verifyVendor, deleteTicket);

export default router;