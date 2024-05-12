const mongoose = require("mongoose");

const preferenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User"
    },
    diets: {
        type: [String],
        default: ["balanced"]
    },
    allergies: {
        type: [String]
    },
    favorites: {
        type: [String],
        default: ["pasta", "sandwich"]
    },
    ingredients: {
        type: [String],
        default: ["egg", "salt", "pepper", "milk"]
    }
});

module.exports = mongoose.model("Preference", preferenceSchema);