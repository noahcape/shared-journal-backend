const UserSettings = require('../models/userSettingsModel');
const User = require('../models/userModel');
const createMailOptions = require('./createMailOptions');

module.exports = async function compileOffCycleUpdates(user, posts) {

  const settings = await UserSettings.findOne({ user });
  const journalUser = await User.findOne({ _id: user });
  const { email } = journalUser;

  const monthly_update = {
    userEmail: email,
    recipients: settings.recipients,
    journal_name: settings.journal_name,
    posts,
  };

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

    // add myself to check if things send
    subList.push("noahcape@gmail.com")

    await new Promise((resolve) =>
      setTimeout(() => {
        createMailOptions({ ...monthly_update, recipients: subList });
        resolve();
      }, FIFTEEN_MINUTES)
    );
  }

  return { result: 'success' }
}