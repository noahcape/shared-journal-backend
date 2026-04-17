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
const Posts = require("./models/postModel");
const UserSettings = require("./models/userSettingsModel");
const User = require("./models/userModel");
const createMailOptions = require("./middleware/createMailOptions");

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
      const allUsers = await User.find();
      console.log(`✓ Found ${allUsers.length} user(s)`);

      const thisMonth = new Date(Date.now()).getMonth(); // October = 9
      const thisYear = new Date(Date.now()).getFullYear();
      const targetMonth = thisMonth === 0 ? 11 : thisMonth - 1; // September = 8
      const targetYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      console.log(`\nProcessing newsletters for month ${targetMonth} (September) of ${targetYear}...`);

      let totalEmailsScheduled = 0;
      let usersWithPosts = 0;

      for (const journalUser of allUsers) {
        const user = journalUser._id;

        // Get posts for the target month
        const posts = await Posts.find({
          user,
          month: targetMonth,
          year: targetYear,
        }).sort({ date: 1 });

        if (posts.length === 0) {
          console.log(`  ⊘ ${journalUser.displayName || journalUser.email}: No posts for September`);
          continue;
        }

        usersWithPosts++;
        const settings = await UserSettings.findOne({ user });

        if (!settings || !settings.recipients || settings.recipients.length === 0) {
          console.log(`  ⊘ ${journalUser.displayName || journalUser.email}: No recipients configured`);
          continue;
        }

        const recipientCount = settings.recipients.length;
        totalEmailsScheduled += recipientCount;

        console.log(`  ✓ ${settings.journal_name || journalUser.email}: ${posts.length} posts, ${recipientCount} recipients`);

        const monthly_update = {
          userEmail: journalUser.email,
          recipients: settings.recipients,
          journal_name: settings.journal_name,
          posts,
        };

        const emailListLength = monthly_update.recipients.length;
        const subListLength = Math.round(emailListLength / 20);
        const FIFTEEN_MINUTES = 900000;

        // Send emails in batches
        for (let i = 1; i <= 20; i++) {
          const subList = monthly_update.recipients.slice(
            (i - 1) * subListLength,
            i * subListLength
          );

          if (subList.length === 0) break;

          const batchNum = i;
          const delayMinutes = (i - 1) * 15;

          if (i > 1) {
            console.log(`    ⏳ Waiting 15 minutes before batch ${batchNum}...`);
            await new Promise(resolve => setTimeout(resolve, FIFTEEN_MINUTES));
          }

          console.log(`    → Sending batch ${batchNum}/20 (${subList.length} emails) now`);
          createMailOptions({ ...monthly_update, recipients: subList });
        }
      }

      console.log("\n=== Summary ===");
      console.log(`Users with posts: ${usersWithPosts}`);
      console.log(`Total emails scheduled: ${totalEmailsScheduled}`);
      console.log("\n✓ All newsletter sends have been scheduled!");
      console.log("Emails will be sent over the next few hours.");
      console.log("Check the console output above for 'Message sent' confirmations.\n");

      // Keep process alive for the emails to send
      console.log("Keeping process alive... Press Ctrl+C to exit after all emails are sent.");

    } catch (e) {
      console.error("Error sending newsletter:", e);
      process.exit(1);
    }
  }
);
