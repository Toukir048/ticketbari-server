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

export const completePayment = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { bookingId, transactionId, paymentIntentId } = req.body;

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

    const { bookingsCollection, ticketsCollection, paymentsCollection } =
      collections();

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

    if (booking.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already paid.",
      });
    }

    if (booking.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted bookings can be completed as paid.",
      });
    }

    const now = new Date();
    const departureDate = new Date(booking.departureDateTime);

    if (departureDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Payment cannot be completed because departure time has already passed.",
      });
    }

    if (isStripeConfigured && stripe && paymentIntentId) {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({
          success: false,
          message: "Stripe payment is not completed yet.",
          stripeStatus: paymentIntent.status,
        });
      }
    }

    const ticketUpdateResult = await ticketsCollection.updateOne(
      {
        _id: new ObjectId(booking.ticketId),
        quantity: { $gte: booking.bookingQuantity },
      },
      {
        $inc: {
          quantity: -booking.bookingQuantity,
          soldQuantity: booking.bookingQuantity,
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    if (ticketUpdateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets are available to complete this payment.",
      });
    }

    const finalTransactionId =
      transactionId ||
      paymentIntentId ||
      `mock_txn_${Date.now()}_${booking._id.toString()}`;

    await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId), userEmail },
      {
        $set: {
          status: "paid",
          paidAt: new Date(),
          transactionId: finalTransactionId,
          updatedAt: new Date(),
        },
      }
    );

    const paymentDoc = {
      transactionId: finalTransactionId,
      paymentIntentId: paymentIntentId || null,
      bookingId: new ObjectId(bookingId),
      ticketId: new ObjectId(booking.ticketId),
      ticketTitle: booking.ticketTitle,
      userEmail,
      vendorEmail: booking.vendorEmail,
      amount: booking.totalPrice,
      currency: process.env.STRIPE_CURRENCY || "usd",
      paymentDate: new Date(),
      paymentMethod: isStripeConfigured && paymentIntentId ? "stripe" : "development_mock",
      createdAt: new Date(),
    };

    await paymentsCollection.insertOne(paymentDoc);

    res.status(200).json({
      success: true,
      message: "Payment completed successfully.",
      transactionId: finalTransactionId,
      bookingStatus: "paid",
      reducedQuantity: booking.bookingQuantity,
      payment: paymentDoc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to complete payment.",
      error: error.message,
    });
  }
};

export const mockPaymentSuccess = async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Mock payment is disabled in production.",
      });
    }

    req.body.transactionId =
      req.body.transactionId || `mock_txn_${Date.now()}`;

    return completePayment(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Mock payment failed.",
      error: error.message,
    });
  }
};