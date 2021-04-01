const UserSettings = require("../models/userSettingsModel")
const User = require("../models/userModel")

module.exports = class SettingsController {
    async postSettings(req, res) {
        const { displayName, recipients, user } = req.body

        const newSettings = new UserSettings({
            journal_name: displayName,
            recipients,
            user
        })

        try {
            const savedSettings = await newSettings.save()
            res.json(savedSettings)
        } catch (err) {
            console.log({ err: err.message })
            res.status(500).json({ error: err.message })
        }
    }

    async getSettings(req, res) {
        const settings = await UserSettings.findOne({ user: req.user })
        res.json(settings)
    }

    async addRecipient(req, res) {
        await UserSettings.updateOne({ user: req.user }, { $push: { recipients: req.body.recipient } })
        const settings = await UserSettings.findOne({ user: req.user })

        res.json(settings)
    }

    async bulkAddRecipient(req, res) {
        const recipients = req.body.recipients.split(",")
        const tempRecipients = []

        const settingsToBeEdited = await UserSettings.findOne({ user: req.user })

        recipients.forEach((recipient) => {
            if (!settingsToBeEdited.recipients.includes(recipient)) {
                tempRecipients.push(recipient)
            }
        })

        await UserSettings.updateOne({ user: req.user }, { $push: { recipients: tempRecipients } })
        const settings = await UserSettings.findOne({ user: req.user })

        res.json(settings)
    }

    async editJournalName(req, res) {
        const { newName } = req.body
        if (!await User.findOne({ displayName: newName })) {
            await UserSettings.updateOne({ user: req.user }, { $set: { journal_name: newName } })
            await User.updateOne({ _id: req.user }, { $set: { displayName: newName } })
            const newSettings = await UserSettings.findOne({ user: req.user })
            return res.json(newSettings)
        } else {
            return res.status(400).json({ msg: "Sorry, that name is already taken" })
        }
    }

    async deleteRecipient(req, res) {
        const recipient = req.body.recipient

        const settingsToEdit = await UserSettings.findOne({ user: req.user })
        const recipientList = settingsToEdit.recipients

        settingsToEdit.recipients.forEach((r, index) => {
            if (r === recipient) { return recipientList.splice(index, 1) }
        })

        await UserSettings.updateOne({ user: req.user }, { $set: { recipients: recipientList } })
        const settings = await UserSettings.findOne({ user: req.user })

        res.json(settings)
    }

    async clearRecipeints(req, res) {
        await UserSettings.findOneAndUpdate({ user: req.user }, { $set: { recipients: [] } })

        const settings = await UserSettings.findOne({ user: req.user })
        return res.json(settings).end()
    }
}