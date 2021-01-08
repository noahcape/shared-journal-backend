const Posts = require("../models/postModel")
const UserSettings = require("../models/userSettingsModel")
const User = require('../models/userModel')
const createMailOptions = require("./createMailOptions")

module.exports = async function compileUpdates(users) {
    const monthly_update = {
        userEmail: '',
        journal_name: "",
        recipients: [],
        posts: []
    }

    const thisMonth = new Date(Date.now()).getMonth()
    const thisYear = new Date(Date.now()).getFullYear()

    users.forEach(async (user) => {
        let posts = [];
        thisMonth === 0 ? (
            posts = await Posts.find({ user: user, month: 11, year: thisYear - 1 }).sort({ date: 1 })
        ) : (
            posts = await Posts.find({ user: user, month: (thisMonth), year: thisYear }).sort({ date: 1 })
        )
        
        const settings = await UserSettings.findOne({ user: user })
        const journalUser = await User.findOne({ _id: user })
        const email = journalUser.email

        monthly_update.userEmail = email
        monthly_update.recipients = settings.recipients
        monthly_update.journal_name = settings.journal_name

        const email_update = {
            posts: {
                images: [],
                text: [],
                date: undefined,
                month: undefined,
                year: undefined
            }
        }

        posts.map(post => {
            email_update.posts.images.push(
                post.images
            )
            email_update.posts.text.push(
                post.text
            )
            email_update.posts.date = post.date
            email_update.posts.year = post.year
            email_update.posts.month = post.month
        })


        const images = email_update.posts.images
        const text = email_update.posts.text
        const date = email_update.posts.date
        const year = email_update.posts.year
        const month = email_update.posts.month

        const post_array = []

        for (let i = 0; i < images.length; i++) {
            const text_n_images = {
                images: [],
                text: "",
                date,
                year,
                month
            }

            text_n_images.images = images[i].slice(0, 1)
            text_n_images.text = text[i]

            post_array.push(text_n_images)
        }

        monthly_update.posts = post_array

        if (monthly_update.posts.length > 0) {
            createMailOptions(monthly_update)
        }
        


    })

}

