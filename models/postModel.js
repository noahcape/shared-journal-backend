const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    text: { type: String },
    images: { type: [String] },
    image_keys: { type: [String] },
    date: {type: Date, required: true},
    month: {type: Number, required: true},
    year: {type: Number, required: true},
    user: { type: String, required: true }
})

module.exports = mongoose.model("post", postSchema);