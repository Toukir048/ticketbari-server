import { ObjectId } from "mongodb";
import { collections, getDB } from "../config/db.js";
import { generateSeatLabels } from "../utils/seatMap.js";

const isValidObjectId = (id) => ObjectId.isValid(id);

const buildDateTime = (dateValue, timeValue) => {
  if (!dateValue) return "";

  const rawDate =
    dateValue instanceof Date ? dateValue.toISOString() : String(dateValue).trim();

  if (!timeValue) {
    return rawDate;
  }

  const datePart =
    dateValue instanceof Date ? dateValue.toISOString().slice(0, 10) : rawDate.split("T")[0];

  const timePart = String(timeValue).trim();

  return `${datePart}T${timePart}`;
};

const normalizeTicket = (ticket) => {
  if (!ticket) return ticket;

  const safeDepartureDateTime =
    ticket.departureDateTime ||
    buildDateTime(
      ticket.departureDate || ticket.journeyDate || ticket.travelDate || ticket.date,
      ticket.departureTime || ticket.time
    );

  const safeArrivalDateTime =
    ticket.arrivalDateTime || buildDateTime(ticket.arrivalDate, ticket.arrivalTime);

  const safeImage = ticket.image || ticket.imageURL || ticket.imageUrl || "";

  const safeFacilities = Array.isArray(ticket.facilities)
    ? ticket.facilities
    : Array.isArray(ticket.perks)
    ? ticket.perks
    : [];

  return {
    ...ticket,
    departureDateTime: safeDepartureDateTime,
    arrivalDateTime: safeArrivalDateTime,
    image: safeImage,
    imageURL: ticket.imageURL || safeImage,
    availableQuantity: Number(ticket.availableQuantity ?? ticket.quantity ?? 0),
    facilities: safeFacilities,
    perks: safeFacilities,
  };
};

export const createTicket = async (req, res, next) => {
  try {
    const db = getDB();
    const ticketsCollection = db.collection("tickets");

    const {
      title,
      ticketTitle,
      transportType,
      from,
      to,
      departureDate,
      departureTime,
      departureDateTime,
      arrivalDate,
      arrivalTime,
      arrivalDateTime,
      price,
      quantity,
      availableQuantity,
      image,
      imageURL,
      imageUrl,
      description,
      facilities,
      perks,
      vendorName,
      vendorEmail,
    } = req.body;

    const finalTitle = title || ticketTitle;
    const finalTransportType = transportType || "";
    const finalImage = image || imageURL || imageUrl;
    const finalQuantity = Number(quantity);
    const finalPrice = Number(price);

    const finalDepartureDateTime =
      departureDateTime || buildDateTime(departureDate, departureTime);

    const finalArrivalDateTime =
      arrivalDateTime || buildDateTime(arrivalDate, arrivalTime);

    const finalVendorEmail = vendorEmail || req.user?.email;
    const finalVendorName = vendorName || req.user?.name || "TicketBari Vendor";

    if (
      !finalTitle ||
      !finalTransportType ||
      !from ||
      !to ||
      !finalDepartureDateTime ||
      !Number.isFinite(finalPrice) ||
      finalPrice <= 0 ||
      !Number.isFinite(finalQuantity) ||
      finalQuantity <= 0 ||
      !finalImage ||
      !finalVendorEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "All required ticket fields must be provided.",
        missingFields: {
          title: !finalTitle,
          transportType: !finalTransportType,
          from: !from,
          to: !to,
          departureDateTime: !finalDepartureDateTime,
          price: !Number.isFinite(finalPrice) || finalPrice <= 0,
          quantity: !Number.isFinite(finalQuantity) || finalQuantity <= 0,
          image: !finalImage,
          vendorEmail: !finalVendorEmail,
        },
      });
    }

    const finalFacilities = Array.isArray(facilities)
      ? facilities
      : Array.isArray(perks)
      ? perks
      : [];

    const ticket = {
      title: finalTitle.trim(),
      transportType: finalTransportType,
      from: from.trim(),
      to: to.trim(),

      departureDate: departureDate || "",
      departureTime: departureTime || "",
      departureDateTime: finalDepartureDateTime,

      arrivalDate: arrivalDate || "",
      arrivalTime: arrivalTime || "",
      arrivalDateTime: finalArrivalDateTime,

      price: finalPrice,
      quantity: finalQuantity,
      availableQuantity: Number(availableQuantity) || finalQuantity,
      totalSeats: finalQuantity,
      soldQuantity: 0,
      seatLayout: finalTransportType === "Bus" ? generateSeatLabels(finalQuantity) : [],

      image: finalImage,
      imageURL: finalImage,

      description: description || "",
      facilities: finalFacilities,
      perks: finalFacilities,

      vendorName: finalVendorName,
      vendorEmail: finalVendorEmail,

      verificationStatus: "pending",
      isAdvertised: false,
      isHidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await ticketsCollection.insertOne(ticket);

    res.status(201).json({
      success: true,
      message: "Ticket added successfully and waiting for admin approval.",
      insertedId: result.insertedId,
      ticket: normalizeTicket(ticket),
    });
  } catch (error) {
    next(error);
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
      tickets: tickets.map(normalizeTicket),
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
      isHidden: { $ne: true },
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
      ticket: normalizeTicket(ticket),
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
      availableQuantity,
      departureDate,
      departureTime,
      departureDateTime,
      arrivalDate,
      arrivalTime,
      arrivalDateTime,
      facilities,
      perks,
      image,
      imageURL,
      imageUrl,
      description,
    } = req.body;

    const finalDepartureDateTime =
      departureDateTime ||
      buildDateTime(
        departureDate || existingTicket.departureDate,
        departureTime || existingTicket.departureTime
      );

    const finalArrivalDateTime =
      arrivalDateTime ||
      buildDateTime(
        arrivalDate || existingTicket.arrivalDate,
        arrivalTime || existingTicket.arrivalTime
      );

    const finalImage = image || imageURL || imageUrl;
    const finalQuantity =
      quantity !== undefined && quantity !== "" ? Number(quantity) : null;
    const finalPrice = price !== undefined && price !== "" ? Number(price) : null;
    const finalAvailableQuantity =
      availableQuantity !== undefined && availableQuantity !== ""
        ? Number(availableQuantity)
        : null;

    const updateFields = {
      ...(title && { title }),
      ...(from && { from }),
      ...(to && { to }),
      ...(transportType && { transportType }),
      ...(Number.isFinite(finalPrice) && { price: finalPrice }),
      ...(Number.isFinite(finalQuantity) && {
        quantity: finalQuantity,
        totalSeats: finalQuantity,
        ...(transportType === "Bus" || existingTicket.transportType === "Bus"
          ? { seatLayout: generateSeatLabels(finalQuantity) }
          : {}),
      }),
      ...(Number.isFinite(finalAvailableQuantity) && {
        availableQuantity: finalAvailableQuantity,
      }),

      ...(departureDate && { departureDate }),
      ...(departureTime && { departureTime }),
      ...(finalDepartureDateTime && { departureDateTime: finalDepartureDateTime }),

      ...(arrivalDate && { arrivalDate }),
      ...(arrivalTime && { arrivalTime }),
      ...(finalArrivalDateTime && { arrivalDateTime: finalArrivalDateTime }),

      ...(description && { description }),
      ...(Array.isArray(facilities) && { facilities, perks: facilities }),
      ...(Array.isArray(perks) && { perks, facilities: perks }),
      ...(finalImage && { image: finalImage, imageURL: finalImage }),

      updatedAt: new Date(),
    };

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id), vendorEmail },
      { $set: updateFields }
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

export const getAllTicketsForAdmin = async (req, res) => {
  try {
    const { ticketsCollection } = collections();

    const tickets = await ticketsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "All tickets loaded for admin successfully.",
      tickets: tickets.map(normalizeTicket),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load tickets for admin.",
      error: error.message,
    });
  }
};

export const updateTicketVerificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const allowedStatuses = ["approved", "rejected"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be approved or rejected.",
      });
    }

    const { ticketsCollection } = collections();

    const updateDoc = {
      $set: {
        verificationStatus: status,
        updatedAt: new Date(),
      },
    };

    if (status === "rejected") {
      updateDoc.$set.isAdvertised = false;
    }

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Ticket ${status} successfully.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update ticket verification status.",
      error: error.message,
    });
  }
};

export const getApprovedTicketsForAdvertisement = async (req, res) => {
  try {
    const { ticketsCollection } = collections();

    const tickets = await ticketsCollection
      .find({
        verificationStatus: "approved",
        isHidden: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Approved tickets loaded for advertisement successfully.",
      tickets: tickets.map(normalizeTicket),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load approved tickets for advertisement.",
      error: error.message,
    });
  }
};

export const toggleAdvertiseTicket = async (req, res) => {
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
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (ticket.verificationStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved tickets can be advertised.",
      });
    }

    if (ticket.isHidden) {
      return res.status(400).json({
        success: false,
        message: "Hidden tickets cannot be advertised.",
      });
    }

    const nextAdvertiseStatus = !ticket.isAdvertised;

    if (nextAdvertiseStatus) {
      const advertisedCount = await ticketsCollection.countDocuments({
        isAdvertised: true,
        verificationStatus: "approved",
        isHidden: { $ne: true },
      });

      if (advertisedCount >= 6) {
        return res.status(400).json({
          success: false,
          message: "You cannot advertise more than 6 tickets at a time.",
        });
      }
    }

    const result = await ticketsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isAdvertised: nextAdvertiseStatus,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: nextAdvertiseStatus
        ? "Ticket advertised successfully."
        : "Ticket unadvertised successfully.",
      isAdvertised: nextAdvertiseStatus,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle advertisement status.",
      error: error.message,
    });
  }
};

export const getApprovedTickets = async (req, res) => {
  try {
    const { from, to, transportType, sort, page = 1, limit = 6 } = req.query;

    const currentPage = Math.max(Number(page), 1);
    const perPage = Math.min(Math.max(Number(limit), 6), 9);
    const skip = (currentPage - 1) * perPage;

    const query = {
      verificationStatus: "approved",
      isHidden: { $ne: true },
    };

    if (from) {
      query.from = { $regex: from, $options: "i" };
    }

    if (to) {
      query.to = { $regex: to, $options: "i" };
    }

    if (transportType && transportType !== "All") {
      query.transportType = transportType;
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price-asc") {
      sortOption = { price: 1 };
    }

    if (sort === "price-desc") {
      sortOption = { price: -1 };
    }

    const { ticketsCollection } = collections();

    const totalTickets = await ticketsCollection.countDocuments(query);

    const tickets = await ticketsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(perPage)
      .toArray();

    res.status(200).json({
      success: true,
      message: "Approved tickets loaded successfully.",
      tickets: tickets.map(normalizeTicket),
      pagination: {
        totalTickets,
        currentPage,
        perPage,
        totalPages: Math.ceil(totalTickets / perPage),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load approved tickets.",
      error: error.message,
    });
  }
};

export const getAdvertisedTickets = async (req, res) => {
  try {
    const { ticketsCollection } = collections();

    const tickets = await ticketsCollection
      .find({
        verificationStatus: "approved",
        isAdvertised: true,
        isHidden: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      message: "Advertised tickets loaded successfully.",
      tickets: tickets.map(normalizeTicket),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load advertised tickets.",
      error: error.message,
    });
  }
};

export const getLatestTickets = async (req, res) => {
  try {
    const { ticketsCollection } = collections();

    const tickets = await ticketsCollection
      .find({
        verificationStatus: "approved",
        isHidden: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray();

    res.status(200).json({
      success: true,
      message: "Latest tickets loaded successfully.",
      tickets: tickets.map(normalizeTicket),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load latest tickets.",
      error: error.message,
    });
  }
};

export const getTicketSeatMap = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ticket ID.",
      });
    }

    const { ticketsCollection, bookingsCollection } = collections();

    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(id),
      isHidden: { $ne: true },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found.",
      });
    }

    if (ticket.transportType !== "Bus") {
      return res.status(400).json({
        success: false,
        message: "Seat map is currently available only for bus tickets.",
      });
    }

    const totalSeats =
      Number(ticket.totalSeats) ||
      Number(ticket.quantity) + Number(ticket.soldQuantity || 0);

    const seatLabels =
      Array.isArray(ticket.seatLayout) && ticket.seatLayout.length > 0
        ? ticket.seatLayout
        : generateSeatLabels(totalSeats);

    const activeBookings = await bookingsCollection
      .find({
        ticketId: new ObjectId(id),
        status: { $in: ["pending", "accepted", "paid"] },
      })
      .toArray();

    const unavailableSeats = activeBookings.flatMap(
      (booking) => booking.selectedSeats || []
    );

    const seats = seatLabels.map((seat) => ({
      seat,
      status: unavailableSeats.includes(seat) ? "booked" : "available",
    }));

    res.status(200).json({
      success: true,
      message: "Seat map loaded successfully.",
      ticketId: id,
      transportType: ticket.transportType,
      totalSeats,
      seats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load seat map.",
      error: error.message,
    });
  }
};