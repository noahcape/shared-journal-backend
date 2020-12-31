const router = require("express").Router()
const userSettings = require("../models/userSettingsModel")
const user = require("../models/userModel")
const auth = require("../middleware/auth")

router.post("/new", async (req, res) => {

    const { displayName, recipients, user } = req.body

    const newSettings = new userSettings({
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
})

router.put("/add_recipient", auth, async (req, res) => {
    await userSettings.updateOne({ user: req.user }, { $push: { recipients: req.body.recipient } })

    const settings = await userSettings.findOne({ user: req.user })

    res.json(settings)
})

router.put("/bulk_add_recipients", auth, async (req, res) => {
    const emails = req.body.emails.split(", ")

    await userSettings.updateOne({ user: req.user }, { $push: { recipients: emails } })

    const settings = await userSettings.findOne({ user: req.user })

    res.json(settings)
})

router.delete("/delete_recipient", auth, async (req, res) => {
    await userSettings.updateOne({ user: req.user }, { $pull: { recipients: req.body.recipient } })

    const settings = await userSettings.findOne({ user: req.user })

    res.json(settings)
})

router.get("/get", auth, async (req, res) => {
    const settings = await userSettings.findOne({ user: req.user })
    res.json(settings)
})

router.put("/edit_name", auth, async (req, res) => {
    const newName = req.query.journalName.split("_").join(" ")
    if (!await user.findOne({ displayName: newName })) {
        await userSettings.findOneAndUpdate(({ user: req.user }, { journal_name: newName }))
        await user.findOneAndUpdate(({ user: req.user }, { displayName: newName }))
        return res.json(newName)
    } else {
        return res.status(400).json({ msg: "Sorry, that name is already taken" })
    }
})

module.exports = router