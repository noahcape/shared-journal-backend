const express = require("express");
const mongoose = require("mongoose");
const aws = require("aws-sdk");
const cors = require("cors");
const { CronJob } = require("cron");
const fetch = require("node-fetch");
const PostRouter = require("./routes/postRoutes");
const SettingsRouter = require("./routes/settingsRoutes");
const UserRouter = require("./routes/userRoutes");
const CompilingUpdatesRouter = require("./routes/clientOperationsRoute");
require("dotenv").config();

const getUsers = require("./middleware/queryUsers");
const compileUpdates = require("./middleware/compileUpdates");

// set up express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 80;
console.log("Starting Server");
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// set up routes
app.use(PostRouter);
app.use(UserRouter);
app.use(SettingsRouter);
app.use(CompilingUpdatesRouter);
app.use("/stayAwake", require("./routes/stayAwakeRoute"));

// set up mongoose
console.log("Connection to MongoDB");
const mongoDB = process.env.MONGO_URI;
mongoose.connect(
  mongoDB,
  { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
  (err) => {
    if (err) console.log(err);

    console.log("MongoDB connection established");
  }
);

// set up aws
aws.config.update(
  {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    region: "us-west-2",
  },
  (err) => {
    if (err) console.log(err);

    console.log("AWS s3 set up");
  }
);

console.log("AWS set up");

// Track last cron execution for monitoring
global.lastCronRun = null;
global.lastCronStatus = null;
global.lastCronUserCount = null;

const task = new CronJob(
  "0 0 3 * *",
  async () => {
    const timestamp = new Date().toISOString();
    console.log(`[CRON] ========================================`);
    console.log(`[CRON] Monthly email job started at ${timestamp}`);
    console.log(`[CRON] Timezone: America/Los_Angeles (Day 3 of month)`);

    global.lastCronRun = timestamp;
    global.lastCronStatus = "started";

    try {
      const users = await getUsers;
      const userIds = users.map((user) => user._id);

      console.log(`[CRON] Found ${userIds.length} users to process`);
      global.lastCronStatus = `processing ${userIds.length} users`;
      global.lastCronUserCount = userIds.length;

      compileUpdates(userIds);

      console.log(`[CRON] compileUpdates called successfully`);
      console.log(`[CRON] Emails will be sent in batches over ~5 hours`);
      global.lastCronStatus = `triggered for ${userIds.length} users`;
    } catch (e) {
      console.error(`[CRON] ERROR: ${e.message}`);
      console.error(e);
      global.lastCronStatus = `error: ${e.message}`;
    }

    console.log(`[CRON] ========================================`);
  },
  null,
  true,
  "America/Los_Angeles"
);
task.start();
console.log(`[CRON] Scheduled for day 3 of each month at midnight PT. Next run: ${task.nextDate().toString()}`);

// stop this for now
setInterval(() => {
  fetch("https://new-shared-journal.herokuapp.com/stayAwake/", {
    method: "GET",
  });
}, 80000);
