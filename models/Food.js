let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//Defines the properties Food documents in the database should have
let foodSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    nutritionVal: {
        kcal: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fibre: Number,
    },
    ingredients: {
        type: Array,
        required: false,
        default: [],
    },
    desc: {
        type: String,
        required: false,
        default: "No description"
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    },
    authorUsername: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Food", foodSchema);