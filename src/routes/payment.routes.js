import express from "express";
import {
  completePayment,
  createPaymentIntent,
  getMyTransactions,
  mockPaymentSuccess,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/create-payment-intent", verifyToken, createPaymentIntent);

router.post("/complete-payment", verifyToken, completePayment);

router.post("/mock-success", verifyToken, mockPaymentSuccess);

router.get("/my-transactions", verifyToken, getMyTransactions);

export default router;