const CompilingUpdatesRouter = require('express').Router()
const auth = require('../middleware/auth');
const OffCycleUpdatesController = require('../controllers/clientOperationsController')

const CompileOffCycleUpdatesController = new OffCycleUpdatesController()

CompilingUpdatesRouter.get('/api/updates/sendUpdates', auth, CompileOffCycleUpdatesController.sendOffCycle)

module.exports = CompilingUpdatesRouter