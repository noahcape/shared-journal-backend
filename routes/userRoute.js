const router = require("express").Router();
const User = require("../models/userModel")
const auth = require("../middleware/auth")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()

router.post("/register", async (req, res) => {
    try {
        const { email, password, passwordCheck, displayName } = req.body;

        // validation
        if (!email || !password || !passwordCheck || !displayName)
            return res.status(400).json({ msg: "Not all fields have been entered" })

        if (password.length < 5)
            return res.status(400).json({ msg: "Password needs to be at least 5 character long" })

        if (password !== passwordCheck)
            return res.status(400).json({ msg: "Enter the same password twice for verification" })

        if (await User.findOne({ displayName: displayName })) { return res.status(400).json({ msg: "Sorry, that name is already taken" }) }

        if (await User.findOne({ email: email })) { return res.status(400).json({ msg: "Account with this email already exists" }) }

        const salt = await bcrypt.genSalt();
        const paswordHash = await bcrypt.hash(password, salt)

        const newUser = User({
            email,
            password: paswordHash,
            displayName
        })

        await newUser.save()
        res.json({ displayName })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }

})

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        // validate
        if (!email || !password)
            return res.status(400).json({ msg: "Not all fields have been entered" })

        const user = await User.findOne({ email: email })

        if (!user)
            return res.status(400).json({ msg: "No account with this email has been registered" })

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch)
            return res.status(400).json({ msg: "Invalid credentials" })

        const token = jwt.sign({ id: user._id }, process.env.JWT_PASSWORD)

        res.json({
            token,
            user: {
                id: user._id,
                journalName: user.displayName
            }
        })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.delete("/delete", auth, async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.user)
        res.json(deletedUser);
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.post("/tokenIsValid", async (req, res) => {
    try {
        const token = req.header("x-auth-token")

        if (!token) return res.json(false)

        const verified = jwt.verify(token, process.env.JWT_PASSWORD)

        if (!verified) return res.json(false)

        const user = await User.findById(verified.id)

        if (!user) return res.json(false)

        return res.json(true)

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.get("/", auth, async (req, res) => {
    const user = await User.findById(req.user)

    res.json({ journalName: user.displayName, id: user._id })
})

module.exports = router;