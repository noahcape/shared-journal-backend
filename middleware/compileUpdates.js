const Posts = require("../models/postModel")
const UserSettings = require("../models/userSettingsModel")
const User = require('../models/userModel')
const createMailOptions = require("./createMailOptions")

module.exports = async function compileUpdates(users) {
    const thisMonth = new Date(Date.now()).getMonth()
    const thisYear = new Date(Date.now()).getFullYear()

    users.forEach(async (user) => {
        let posts = [];
        thisMonth === 0 ? (
            posts = await Posts.find({ user: user, month: 11, year: thisYear - 1 }).sort({ date: 1 })
        ) : (
            posts = await Posts.find({ user: user, month: (thisMonth - 1), year: thisYear }).sort({ date: 1 })
        )
        
        const settings = await UserSettings.findOne({ user: user })
        const journalUser = await User.findOne({ _id: user })
        const email = journalUser.email

        const monthly_update = {
            userEmail: email,
            recipients: settings.recipients,
            journal_name: settings.journal_name,
            posts: posts,
        }
        
        // if there have been posts this month
        if (monthly_update.posts.length > 0) {
            const emailListLength = monthly_update.recipients.length
            const subListLength = Math.round(emailListLength / 25)

            // send email ever 20 minutes
            const TWENTY_MINUTES = 1200000

            // send emails 20 times
            for (let i = 0; i <= 24; i++) {
                const subList = monthly_update.recipients.slice(i * subListLength, (i + 1) * subListLength)
                await new Promise((resolve) => setTimeout(() => {
                    createMailOptions({ ...monthly_update, recipients: subList })
                    resolve()
                }, TWENTY_MINUTES))
            }
        }
    })
}

