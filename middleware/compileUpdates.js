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

        if (monthly_update.posts.length > 0) {
            createMailOptions(monthly_update)
        }
        


    })

}

