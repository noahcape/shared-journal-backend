const jwt = require("jsonwebtoken")

const auth = (req, res, next) => {
    try {
        const token = req.header("x-auth-token");

        if (!token)
            return res.status(401).json({ msg: "No authentication token, authorization denied" })

        const verifiedToken = jwt.verify(token, process.env.JWT_PASSWORD)

        if (!verifiedToken)
            return res.status(401).json({ msg: "Token verification failed, authorization denied" })
        console.log("maybe req.user")
        req.user = verifiedToken.id
        console.log("not request.user")
        next();
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}

module.exports = auth;