const Posts = require("../models/postModel");
const UserSettings = require("../models/userSettingsModel");
const User = require("../models/userModel");
const createMailOptions = require("./createMailOptions");

module.exports = async function compileUpdates(users) {
  const thisMonth = new Date(Date.now()).getMonth();
  const thisYear = new Date(Date.now()).getFullYear();

  users.forEach(async (user) => {
    let posts = [];
    thisMonth === 0
      ? (posts = await Posts.find({ user, month: 11, year: thisYear - 1 }).sort(
          { date: 1 }
        ))
      : (posts = await Posts.find({
          user,
          month: thisMonth - 1,
          year: thisYear,
        }).sort({ date: 1 }));

    const settings = await UserSettings.findOne({ user });
    const journalUser = await User.findOne({ _id: user });
    const { email } = journalUser;

    const monthly_update = {
      userEmail: email,
      recipients: settings.recipients,
      journal_name: settings.journal_name,
      posts,
    };

    // if there have been posts this month
    if (monthly_update.posts.length > 0) {
      const emailListLength = monthly_update.recipients.length;
      const subListLength = Math.round(emailListLength / 20);

      // send email ever 15 minutes
      const FIFTEEN_MINUTES = 900000;

      // send emails 20 times
      for (let i = 1; i <= 20; i++) {
        const subList = monthly_update.recipients.slice(
          (i - 1) * subListLength,
          i * subListLength
        );
        await new Promise((resolve) =>
          setTimeout(() => {
            createMailOptions({ ...monthly_update, recipients: subList });
            resolve();
          }, FIFTEEN_MINUTES)
        );
      }
    }
  });
};
