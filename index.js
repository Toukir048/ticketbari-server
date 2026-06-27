import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env file");
    }

    const { connectDB } = await import("./src/config/db.js");

    await connectDB();

    const { default: app } = await import("./src/app.js");

    app.listen(PORT, () => {
      console.log(`TicketBari server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start TicketBari server:", error);
    process.exit(1);
  }
};

startServer();