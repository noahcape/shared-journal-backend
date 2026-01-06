const Posts = require("../models/postModel");
const UserSettings = require("../models/userSettingsModel");
const User = require("../models/userModel");
const createMailOptions = require("./createMailOptions");

module.exports = async function compileUpdates(users) {
  const thisMonth = new Date(Date.now()).getMonth();
  const thisYear = new Date(Date.now()).getFullYear();

  const targetMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const targetYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  console.log(`[COMPILE] Starting compilation for ${months[targetMonth]} ${targetYear}`);
  console.log(`[COMPILE] Processing ${users.length} users`);

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

    console.log(`[COMPILE] Journal "${settings.journal_name}": ${posts.length} posts, ${settings.recipients.length} recipients`);

    // if there have been posts this month
    if (monthly_update.posts.length > 0) {
      const emailListLength = monthly_update.recipients.length;
      const subListLength = Math.round(emailListLength / 20);

      // send email ever 15 minutes
      const FIFTEEN_MINUTES = 900000;

      console.log(`[COMPILE] "${settings.journal_name}": Starting batch send (20 batches over 5 hours)`);

      // send emails 20 times
      for (let i = 1; i <= 20; i++) {
        const subList = monthly_update.recipients.slice(
          (i - 1) * subListLength,
          i * subListLength
        );
        await new Promise((resolve) =>
          setTimeout(() => {
            if (subList.length > 0) {
              console.log(`[COMPILE] "${settings.journal_name}": Sending batch ${i}/20 to ${subList.length} recipients`);
              createMailOptions({ ...monthly_update, recipients: subList });
            }
            resolve();
          }, FIFTEEN_MINUTES)
        );
      }

      console.log(`[COMPILE] "${settings.journal_name}": All batches queued`);
    } else {
      console.log(`[COMPILE] "${settings.journal_name}": No posts for ${months[targetMonth]}, skipping`);
    }
  });
};
