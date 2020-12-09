const express = require("express");
const mongoose = require("mongoose");
const aws = require('aws-sdk');
const cors = require("cors");
const nodemailer = require("nodemailer");
const CronJob = require("cron").CronJob;
require("dotenv").config()

const getUsers = require("./middleware/queryUsers")
const compileUpdates = require("./middleware/compileUpdates")

// set up express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
console.log("Starting Server");
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// set up routes
app.use("/posts", require("./routes/postRoute"));
app.use("/users", require("./routes/userRoute"));
app.use("/settings", require("./routes/userSettingsRoute"));

// set up mongoose
console.log("Connection to MongoDB");
var mongoDB = process.env.MONGO_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }, err => {
    if (err) console.log(err);

    console.log("MongoDB connection established");
});

// set up aws
aws.config.update({
    secretAccessKey: process.env.AWS_SCRET_ACCESS_KEY,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    // endpoint: 'https://shared-journal-backend.herokuapp.com',
    region: 'us-east-1'
}, err => {
    if (err) console.log(err)

    console.log("AWS s3 set up")
})

console.log("AWS set up")

const task = new CronJob('0 0 1 * *', function () {
    console.log("Must be the first of the month")
    const getUserData = async () => {
        return await getUsers
    }
    
    getUserData().then(async result => {
        let users = []
    
        result.map(user => {
            users.push(user._id)
        })
    
        try {
            compileUpdates(users)
        } catch (e) {
            console.error(e)
        }
    })
}, null, true, 'America/Los_Angeles')
task.start()

setInterval(() => {console.log("ping")}, 180000)
