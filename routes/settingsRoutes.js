const SettingsRouter = require("express").Router()
const auth = require("../middleware/auth")
const SettingsController = require('../controllers/settingsController')

const UserSettingsController = new SettingsController()

// GET
SettingsRouter.get('/api/settings/', auth, UserSettingsController.getSettings)

// POST
SettingsRouter.post('/api/settings/new', UserSettingsController.postSettings)

// PUT
SettingsRouter.put('/api/settings/add_recipient', auth, UserSettingsController.addRecipient)
SettingsRouter.put('/api/settings/bulk_add_recipients', auth, UserSettingsController.bulkAddRecipient)
SettingsRouter.put('/api/settings/edit_journal_name', auth, UserSettingsController.editJournalName)
SettingsRouter.put('/api/settings/delete_recipient', auth, UserSettingsController.deleteRecipient)
SettingsRouter.put('/api/settings/clear_recipients', auth, UserSettingsController.clearRecipeints)

module.exports = SettingsRouter

