var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Not sure about required

var mealSchema = new Schema({
    name: {type: String},
    contents: {type: String},
    kcal: {type: Number, default: 0},
    protein: {type: Number, default: 0},
    carbs: {type: Number, default: 0},
    fat: {type: Number, default: 0},
    fibre: {type: Number, default: 0}
});

var diaryEntrySchema = new Schema({
    date: {
        type: Date,
        required: true,
        index: true
    },
    meals: [mealSchema],
    nutritionSummary: {
        kcal: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fibre: Number
    },
    activities: {
        kcal: {type: Number, required: false, default: 0},
        description: {type: String, required: false, default: "No activities"}
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model("DiaryEntry", diaryEntrySchema);