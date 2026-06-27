import express from "express";
import {
  createPaymentIntent,
  getMyTransactions,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/create-payment-intent", verifyToken, createPaymentIntent);

router.get("/my-transactions", verifyToken, getMyTransactions);

export default router;