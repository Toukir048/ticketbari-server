import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";
import { isStripeConfigured, stripe } from "../config/stripe.js";

const isValidObjectId = (id) => ObjectId.isValid(id);

export const createPaymentIntent = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required.",
      });
    }

    if (!isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const { bookingsCollection } = collections();

    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(bookingId),
      userEmail,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you are not the owner.",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be paid.",
      });
    }

    const now = new Date();
    const departureDate = new Date(booking.departureDateTime);

    if (departureDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Payment is closed because departure time has already passed.",
      });
    }

    const amount = Math.round(Number(booking.totalPrice) * 100);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    if (!isStripeConfigured || !stripe) {
      return res.status(503).json({
        success: false,
        message:
          "Stripe test key is not configured. Add STRIPE_SECRET_KEY to use real Stripe payment.",
        fallbackAvailable: process.env.NODE_ENV !== "production",
      });
    }

    const currency = process.env.STRIPE_CURRENCY || "usd";

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingId: booking._id.toString(),
        ticketId: booking.ticketId.toString(),
        userEmail: booking.userEmail,
        ticketTitle: booking.ticketTitle,
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment intent created successfully.",
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: booking.totalPrice,
      currency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent.",
      error: error.message,
    });
  }
};

export const getMyTransactions = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { paymentsCollection } = collections();

    const transactions = await paymentsCollection
      .find({ userEmail })
      .sort({ paymentDate: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Transaction history loaded successfully.",
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load transaction history.",
      error: error.message,
    });
  }
};