import { collections } from "../config/db.js";

export const createOrUpdateUser = async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const { usersCollection } = collections();

    const existingUser = await usersCollection.findOne({ email });

    if (existingUser) {
      const updateDoc = {
        $set: {
          name: name || existingUser.name,
          photoURL: photoURL || existingUser.photoURL,
          lastLoginAt: new Date(),
        },
      };

      await usersCollection.updateOne({ email }, updateDoc);

      const updatedUser = await usersCollection.findOne({ email });

      return res.status(200).json({
        success: true,
        message: "User already exists. User information updated.",
        user: updatedUser,
      });
    }

    const newUser = {
      name: name || "No Name",
      email,
      photoURL: photoURL || "",
      role: "user",
      isFraud: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      insertedId: result.insertedId,
      user: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create or update user.",
      error: error.message,
    });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const email = req.user?.email;

    const { usersCollection } = collections();
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile loaded successfully.",
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load user profile.",
      error: error.message,
    });
  }
};

export const getUserRole = async (req, res) => {
  try {
    const email = req.user?.email;

    const { usersCollection } = collections();
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User role not found.",
      });
    }

    res.status(200).json({
      success: true,
      role: user.role,
      isFraud: user.isFraud || false,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load user role.",
      error: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { usersCollection } = collections();

    const users = await usersCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      message: "Users loaded successfully.",
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load users.",
      error: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { email } = req.params;
    const { role } = req.body;

    const allowedRoles = ["user", "vendor", "admin"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be user, vendor, or admin.",
      });
    }

    const { usersCollection } = collections();

    const result = await usersCollection.updateOne(
      { email },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update user role.",
      error: error.message,
    });
  }
};

export const markVendorAsFraud = async (req, res) => {
  try {
    const { email } = req.params;

    const { usersCollection, ticketsCollection } = collections();

    const vendor = await usersCollection.findOne({ email });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found.",
      });
    }

    if (vendor.role !== "vendor") {
      return res.status(400).json({
        success: false,
        message: "Only vendors can be marked as fraud.",
      });
    }

    await usersCollection.updateOne(
      { email },
      {
        $set: {
          isFraud: true,
          updatedAt: new Date(),
        },
      }
    );

    await ticketsCollection.updateMany(
      { vendorEmail: email },
      {
        $set: {
          isHidden: true,
          updatedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Vendor marked as fraud and all vendor tickets hidden.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to mark vendor as fraud.",
      error: error.message,
    });
  }
};