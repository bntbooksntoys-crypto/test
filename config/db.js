const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/admin_panel";

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "   Check that MongoDB is running and MONGODB_URI in your .env file is correct."
    );
    process.exit(1);
  }
}

module.exports = connectDB;
