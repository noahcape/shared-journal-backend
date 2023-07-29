const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema({
  journal_name: { type: String },
  recipients: { type: [String] },
  user: { type: String, required: true },
});

module.exports = mongoose.model("settings", userSettingsSchema);
