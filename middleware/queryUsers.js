const Users = require("../models/userModel")

const getUsers = async () => {
    const users = await Users.find().then(result => result)

    let userIds = []

    userIds = users.map(user => {
        return user
    })

    return userIds;
}


module.exports = getUsers()