import { collections } from "../config/db.js";

export const getVendorRevenueOverview = async (req, res) => {
  try {
    const vendorEmail = req.user?.email;

    const { ticketsCollection, bookingsCollection, paymentsCollection } =
      collections();

    const totalTickets = await ticketsCollection.countDocuments({
      vendorEmail,
    });

    const pendingRequests = await bookingsCollection.countDocuments({
      vendorEmail,
      status: "pending",
    });

    const acceptedBookings = await bookingsCollection.countDocuments({
      vendorEmail,
      status: "accepted",
    });

    const rejectedBookings = await bookingsCollection.countDocuments({
      vendorEmail,
      status: "rejected",
    });

    const paidBookings = await bookingsCollection.countDocuments({
      vendorEmail,
      status: "paid",
    });

    const [revenueSummary] = await paymentsCollection
      .aggregate([
        {
          $match: {
            vendorEmail,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const [ticketQuantitySummary] = await ticketsCollection
      .aggregate([
        {
          $match: {
            vendorEmail,
          },
        },
        {
          $group: {
            _id: null,
            totalSoldQuantity: {
              $sum: { $ifNull: ["$soldQuantity", 0] },
            },
            totalAvailableQuantity: {
              $sum: { $ifNull: ["$quantity", 0] },
            },
          },
        },
      ])
      .toArray();

    const revenueByTicket = await paymentsCollection
      .aggregate([
        {
          $match: {
            vendorEmail,
          },
        },
        {
          $group: {
            _id: "$ticketTitle",
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            ticketTitle: "$_id",
            totalRevenue: 1,
            totalTransactions: 1,
          },
        },
        {
          $sort: {
            totalRevenue: -1,
          },
        },
      ])
      .toArray();

    const bookingStatusChart = await bookingsCollection
      .aggregate([
        {
          $match: {
            vendorEmail,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            status: "$_id",
            count: 1,
          },
        },
      ])
      .toArray();

    const monthlyRevenue = await paymentsCollection
      .aggregate([
        {
          $match: {
            vendorEmail,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$paymentDate" },
              month: { $month: "$paymentDate" },
            },
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            label: {
              $concat: [
                { $toString: "$_id.year" },
                "-",
                {
                  $cond: [
                    { $lt: ["$_id.month", 10] },
                    { $concat: ["0", { $toString: "$_id.month" }] },
                    { $toString: "$_id.month" },
                  ],
                },
              ],
            },
            totalRevenue: 1,
            totalTransactions: 1,
          },
        },
      ])
      .toArray();

    const recentTransactions = await paymentsCollection
      .find({ vendorEmail })
      .sort({ paymentDate: -1 })
      .limit(5)
      .toArray();

    res.status(200).json({
      success: true,
      message: "Vendor revenue overview loaded successfully.",
      overview: {
        totalRevenue: revenueSummary?.totalRevenue || 0,
        totalTransactions: revenueSummary?.totalTransactions || 0,
        totalTickets,
        totalSoldQuantity: ticketQuantitySummary?.totalSoldQuantity || 0,
        totalAvailableQuantity:
          ticketQuantitySummary?.totalAvailableQuantity || 0,
        pendingRequests,
        acceptedBookings,
        rejectedBookings,
        paidBookings,
      },
      charts: {
        revenueByTicket,
        bookingStatusChart,
        monthlyRevenue,
      },
      recentTransactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load vendor revenue overview.",
      error: error.message,
    });
  }
};