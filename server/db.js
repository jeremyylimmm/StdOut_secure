const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log("Attempting to connect to MongoDB at:", mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.warn("Server still running despite MongoDB error - auth will fail");
  }
};

module.exports = connectDB;
