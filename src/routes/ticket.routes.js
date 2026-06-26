import express from "express";
import {
  createTicket,
  deleteTicket,
  getMyAddedTickets,
  getTicketById,
  updateTicket,
} from "../controllers/ticket.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyVendor } from "../middlewares/verifyRole.js";

const router = express.Router();

router.post("/", verifyToken, verifyVendor, createTicket);

router.get("/my-tickets", verifyToken, verifyVendor, getMyAddedTickets);

router.get("/:id", verifyToken, getTicketById);

router.patch("/:id", verifyToken, verifyVendor, updateTicket);

router.delete("/:id", verifyToken, verifyVendor, deleteTicket);

export default router;