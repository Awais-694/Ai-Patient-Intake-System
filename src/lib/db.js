import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI environment variable missing is. your .env.local file check."
  );
}

/*
  Development mode in Next.js files to multiple times reload can.

  Cache the MongoDB connection globally so development reloads do not
  create a new database connection each time.
*/

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    connection: null,
    promise: null,
  };
}

async function connectDB() {
  // Reuse the existing connection when it is available.
  if (cached.connection) {
    return cached.connection;
  }

  // If connection process before from start is to again start will not.
  if (!cached.promise) {
    const options = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options);
  }

  try {
    cached.connection = await cached.promise;

    console.log("MongoDB connected successfully");

    return cached.connection;
  } catch (error) {
    // Failed promise to clear perform required is,
    // taake agli request again connection try kar sake.
    cached.promise = null;

    console.error("MongoDB connection failed:", error.message);

    throw new Error("Could not establish a MongoDB connection.");
  }
}

export default connectDB;
