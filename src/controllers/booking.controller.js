import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

const isValidObjectId = (id) => ObjectId.isValid(id);

export const createBooking = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { ticketId, bookingQuantity } = req.body;

    if (!ticketId || !bookingQuantity) {
      return res.status(400).json({
        success: false,
        message: "Ticket ID and booking quantity are required.",
      });
    }

    if (!isValidObjectId(ticketId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const requestedQuantity = Number(bookingQuantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Booking quantity must be a positive whole number.",
      });
    }

    const { usersCollection, ticketsCollection, bookingsCollection } =
      collections();

    const user = await usersCollection.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(ticketId),
      verificationStatus: "approved",
      isHidden: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Approved ticket not found.",
      });
    }

    const now = new Date();
    const departureDate = new Date(ticket.departureDateTime);

    if (departureDate <= now) {
      return res.status(400).json({
        success: false,
        message: "Booking is closed because departure time has already passed.",
      });
    }

    if (Number(ticket.quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "No tickets are available for booking.",
      });
    }

    if (requestedQuantity > Number(ticket.quantity)) {
      return res.status(400).json({
        success: false,
        message: "Booking quantity cannot be greater than available ticket quantity.",
      });
    }

    const unitPrice = Number(ticket.price);
    const totalPrice = unitPrice * requestedQuantity;

    const newBooking = {
      ticketId: new ObjectId(ticketId),
      ticketTitle: ticket.title,
      image: ticket.image,
      userName: user.name || "Unknown User",
      userEmail,
      vendorEmail: ticket.vendorEmail,
      bookingQuantity: requestedQuantity,
      unitPrice,
      totalPrice,
      from: ticket.from,
      to: ticket.to,
      transportType: ticket.transportType,
      departureDateTime: ticket.departureDateTime,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await bookingsCollection.insertOne(newBooking);

    res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      insertedId: result.insertedId,
      booking: newBooking,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create booking request.",
      error: error.message,
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userEmail = req.user?.email;
    const { bookingsCollection } = collections();

    const bookings = await bookingsCollection
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "User booked tickets loaded successfully.",
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load user booked tickets.",
      error: error.message,
    });
  }
};

export const getVendorRequestedBookings = async (req, res) => {
  try {
    const vendorEmail = req.user?.email;
    const { bookingsCollection } = collections();

    const bookings = await bookingsCollection
      .find({ vendorEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Vendor requested bookings loaded successfully.",
      bookings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load requested bookings.",
      error: error.message,
    });
  }
};

export const cancelPendingBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const { bookingsCollection } = collections();

    const booking = await bookingsCollection.findOne({
      _id: new ObjectId(id),
      userEmail,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you are not the owner.",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending bookings can be cancelled.",
      });
    }

    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(id), userEmail },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel booking.",
      error: error.message,
    });
  }
};