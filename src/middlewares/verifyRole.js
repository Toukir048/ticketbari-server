import { collections } from "../config/db.js";

export const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.user?.email;

    const { usersCollection } = collections();
    const user = await usersCollection.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden access. Admin only.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin verification failed.",
      error: error.message,
    });
  }
};

export const verifyVendor = async (req, res, next) => {
  try {
    const email = req.user?.email;

    const { usersCollection } = collections();
    const user = await usersCollection.findOne({ email });

    if (!user || user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Forbidden access. Vendor only.",
      });
    }

    if (user.isFraud) {
      return res.status(403).json({
        success: false,
        message: "Your vendor access has been blocked.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vendor verification failed.",
      error: error.message,
    });
  }
};