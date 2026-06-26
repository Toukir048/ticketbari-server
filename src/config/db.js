import { MongoClient, ServerApiVersion } from "mongodb";
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const uri = process.env.MONGODB_URI;

let client;
let db;

export const connectDB = async () => {
  if (db) {
    return db;
  }

  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env file");
  }

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();

  db = client.db("ticketbariDB");

  await db.command({ ping: 1 });

  console.log("MongoDB connected successfully");

  return db;
};

export const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected yet");
  }

  return db;
};

export const collections = () => {
  const database = getDB();

  return {
    usersCollection: database.collection("users"),
    ticketsCollection: database.collection("tickets"),
    bookingsCollection: database.collection("bookings"),
    paymentsCollection: database.collection("payments"),
  };
};