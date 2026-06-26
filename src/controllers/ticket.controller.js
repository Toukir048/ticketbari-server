import { ObjectId } from "mongodb";
import { collections } from "../config/db.js";

const isValidObjectId = (id) => ObjectId.isValid(id);

export const createTicket = async (req, res) => {
  try {
    const vendorEmail = req.user?.email;

    const {
      title,
      from,
      to,
      transportType,
      price,
      quantity,
      departureDateTime,
      perks,
      image,
    } = req.body;

    if (
      !title ||
      !from ||
      !to ||
      !transportType ||
      !price ||
      !quantity ||
      !departureDateTime ||
      !image
    ) {
      return res.status(400).json({
        success: false,
        message: "All required ticket fields must be provided.",
      });
    }

    const allowedTransportTypes = ["Bus", "Train", "Launch", "Plane"];

    if (!allowedTransportTypes.includes(transportType)) {
      return res.status(400).json({
        success: false,
        message: "Transport type must be Bus, Train, Launch, or Plane.",
      });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0.",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Ticket quantity must be greater than 0.",
      });
    }

    const { usersCollection, ticketsCollection } = collections();

    const vendor = await usersCollection.findOne({ email: vendorEmail });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found.",
      });
    }

    if (vendor.isFraud) {
      return res.status(403).json({
        success: false,
        message: "Fraud vendors cannot add tickets.",
      });
    }

    const newTicket = {
      title,
      from,
      to,
      transportType,
      price: Number(price),
      quantity: Number(quantity),
      soldQuantity: 0,
      departureDateTime: new Date(departureDateTime),
      perks: Array.isArray(perks) ? perks : [],
      image,
      vendorName: vendor.name || "Unknown Vendor",
      vendorEmail,
      verificationStatus: "pending",
      isAdvertised: false,
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ticketsCollection.insertOne(newTicket);

    res.status(201).json({
      success: true,
      message: "Ticket added successfully and waiting for admin approval.",
      insertedId: result.insertedId,
      ticket: newTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add ticket.",
      error: error.message,
    });
  }
};

export const getMyAddedTickets = async (req, res) => {
  try {
    const vendorEmail = req.user?.email;
    const { ticketsCollection } = collections();

    const tickets = await ticketsCollection
      .find({ vendorEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Vendor tickets loaded successfully.",
      tickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load vendor tickets.",
      error: error.message,
    });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const { ticketsCollection } = collections();

    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(id),
      isHidden: false,
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket details loaded successfully.",
      ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load ticket details.",
      error: error.message,
    });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorEmail = req.user?.email;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const { ticketsCollection } = collections();

    const existingTicket = await ticketsCollection.findOne({
      _id: new ObjectId(id),
      vendorEmail,
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found or you are not the owner.",
      });
    }

    if (existingTicket.verificationStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Rejected tickets cannot be updated.",
      });
    }

    const {
      title,
      from,
      to,
      transportType,
      price,
      quantity,
      departureDateTime,
      perks,
      image,
    } = req.body;

    const updateDoc = {
      $set: {
        ...(title && { title }),
        ...(from && { from }),
        ...(to && { to }),
        ...(transportType && { transportType }),
        ...(price && { price: Number(price) }),
        ...(quantity && { quantity: Number(quantity) }),
        ...(departureDateTime && {
          departureDateTime: new Date(departureDateTime),
        }),
        ...(Array.isArray(perks) && { perks }),
        ...(image && { image }),
        updatedAt: new Date(),
      },
    };

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id), vendorEmail },
      updateDoc
    );

    res.status(200).json({
      success: true,
      message: "Ticket updated successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update ticket.",
      error: error.message,
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorEmail = req.user?.email;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const { ticketsCollection } = collections();

    const existingTicket = await ticketsCollection.findOne({
      _id: new ObjectId(id),
      vendorEmail,
    });

    if (!existingTicket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found or you are not the owner.",
      });
    }

    if (existingTicket.verificationStatus === "rejected") {
      return res.status(403).json({
        success: false,
        message: "Rejected tickets cannot be deleted.",
      });
    }

    const result = await ticketsCollection.deleteOne({
      _id: new ObjectId(id),
      vendorEmail,
    });

    res.status(200).json({
      success: true,
      message: "Ticket deleted successfully.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete ticket.",
      error: error.message,
    });
  }
};