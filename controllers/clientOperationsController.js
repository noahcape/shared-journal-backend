const Post = require('../models/postModel');
const compileOffCycleUpdates = require('../middleware/compileOffCycleUpdates')

module.exports = class ClientOperationsController {
  async sendOffCycle(req, res) {
    const { month } = req.body
    const thisYear = new Date(Date.now()).getFullYear();

    // check if this user even has posts to send from this month
    const posts = await Post.find({
      user: req.user,
      month,
      year: thisYear,
    }).sort({ date: 1 })

    // if there are no posts throw error
    if (posts.length > 1) return res.send({ result: 'no posts to send' })
    else res.send({ result: 'success' })

    compileOffCycleUpdates(req.user, posts)
  }
}