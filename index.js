const express = require('express');
const mongoose = require('mongoose');
const aws = require('aws-sdk');
const cors = require('cors');
const { CronJob } = require('cron');
const fetch = require('node-fetch');
const PostRouter = require('./routes/postRoutes');
const SettingsRouter = require('./routes/settingsRoutes');
const UserRouter = require('./routes/userRoutes');
const CompilingUpdatesRouter = require('./routes/clientOperationsRoute')
require('dotenv').config();

const getUsers = require('./middleware/queryUsers');
const compileUpdates = require('./middleware/compileUpdates');

// set up express
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
console.log('Starting Server');
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// set up routes
app.use(PostRouter);
app.use(UserRouter);
app.use(SettingsRouter);
app.use(CompilingUpdatesRouter)
app.use('/stayAwake', require('./routes/stayAwakeRoute'));

// set up mongoose
console.log('Connection to MongoDB');
const mongoDB = process.env.MONGO_URI;
mongoose.connect(
    mongoDB,
    { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true },
    (err) => {
        if (err) console.log(err);

        console.log('MongoDB connection established');
    },
);

// set up aws
aws.config.update(
    {
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        region: 'us-west-2',
    },
    (err) => {
        if (err) console.log(err);

        console.log('AWS s3 set up');
    },
);

console.log('AWS set up');

const task = new CronJob(
    '0 0 1 * *',
    () => {
        console.log('Must be the first of the month');
        const getUserData = async () => await getUsers;

        getUserData().then(async (result) => {
            const users = [];

            result.map((user) => {
                users.push(user._id);
            });

            try {
                compileUpdates(users);
            } catch (e) {
                console.error(e);
            }
        });
    },
    null,
    true,
    'America/Los_Angeles',
);
task.start();

setInterval(() => {
    fetch('https://shared-journal-backend.herokuapp.com/stayAwake/', {
        method: 'GET',
    });
}, 80000);
