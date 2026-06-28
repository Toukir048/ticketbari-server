import { collections } from "../config/db.js";

const normalizeEmail = (email = "") => {
  if (typeof email !== "string") return "";
  return email.trim().toLowerCase();
};

const createDefaultUser = async (email, name = "", photoURL = "") => {
  const { usersCollection } = collections();

  const normalizedEmail = normalizeEmail(email);

  const newUser = {
    name: name || normalizedEmail.split("@")[0] || "TicketBari User",
    email: normalizedEmail,
    photoURL: photoURL || "",
    role: "user",
    isFraud: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
  };

  await usersCollection.insertOne(newUser);

  return usersCollection.findOne({ email: normalizedEmail });
};

const findOrCreateUserByEmail = async (email) => {
  const { usersCollection } = collections();

  const normalizedEmail = normalizeEmail(email);

  let user = await usersCollection.findOne({ email: normalizedEmail });

  if (!user) {
    user = await createDefaultUser(normalizedEmail);
  }

  return user;
};

export const createOrUpdateUser = async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required.",
      });
    }

    const { usersCollection } = collections();

    const existingUser = await usersCollection.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await usersCollection.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            name: name || existingUser.name || "TicketBari User",
            photoURL: photoURL || existingUser.photoURL || "",
            updatedAt: new Date(),
            lastLoginAt: new Date(),
          },
        }
      );

      const updatedUser = await usersCollection.findOne({
        email: normalizedEmail,
      });

      return res.status(200).json({
        success: true,
        message: "User already exists. User information updated.",
        user: updatedUser,
      });
    }

    const newUser = {
      name: name || normalizedEmail.split("@")[0] || "TicketBari User",
      email: normalizedEmail,
      photoURL: photoURL || "",
      role: "user",
      isFraud: false,
      createdAt: new Date(),
      updatedAt: new Date(),
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

export const getMyProfile = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.user?.email);

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Email not found in token.",
      });
    }

    const user = await findOrCreateUserByEmail(email);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserRole = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.user?.email);

    if (!email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Email not found in token.",
      });
    }

    const user = await findOrCreateUserByEmail(email);

    res.status(200).json({
      success: true,
      role: user.role || "user",
    });
  } catch (error) {
    next(error);
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
    const email = normalizeEmail(req.params.email);
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
    const email = normalizeEmail(req.params.email);

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
          hiddenReason: "Vendor marked as fraud",
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