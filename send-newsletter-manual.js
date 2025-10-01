#!/usr/bin/env node

/**
 * Manual Newsletter Send Script
 *
 * This script manually triggers the monthly newsletter for September 2025.
 * Run this from the shared-journal-backend directory.
 *
 * Usage: node send-newsletter-manual.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const getUsers = require("./middleware/queryUsers");
const compileUpdates = require("./middleware/compileUpdates");

console.log("=== Manual Newsletter Send Script ===");
console.log("Connecting to MongoDB...");

const mongoDB = process.env.MONGO_URI;

mongoose.connect(
  mongoDB,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  async (err) => {
    if (err) {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    }

    console.log("✓ MongoDB connection established");

    try {
      console.log("\nFetching all users...");
      const getUserData = async () => await getUsers;
      const result = await getUserData();

      const users = result.map((user) => user._id);
      console.log(`✓ Found ${users.length} user(s)`);

      console.log("\nTriggering newsletter send for September 2025...");
      console.log("Note: This will send emails in batches with 15-minute delays between each batch.");
      console.log("The process may take several hours to complete.\n");

      await compileUpdates(users);

      console.log("\n✓ Newsletter send process initiated successfully!");
      console.log("Monitor the application logs to track progress.");

      // Keep the process alive for a bit to ensure the first batch starts
      setTimeout(() => {
        console.log("\nScript completed. The newsletter sending will continue in the background.");
        process.exit(0);
      }, 5000);

    } catch (e) {
      console.error("Error sending newsletter:", e);
      process.exit(1);
    }
  }
);
