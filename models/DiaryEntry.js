var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nutritionDefinition =
    "{\n" +
    "   required: true,\n" +
    "   kcal: {type: Number, required: false, default: 0},\n" +
    "   protein: {type: Number, required: false, default: 0},\n" +
    "   carbs: {type: Number, required: false, default: 0},\n" +
    "   fat: {type: Number, required: false, default: 0},\n" +
    "   fibre: {type: Number, required: false, default: 0},\n" +
    "}";

var diaryEntrySchema = new Schema({
    date: {
        type: Number,
        required: true,
        index: true,
    },
    meals: {
        breakfast: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
        morning_snack: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
        lunch: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
        afternoon_snack: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
        dinner: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
        other: {
            required: true,
            kcal: {type: Number, required: false, default: 0},
            protein: {type: Number, required: false, default: 0},
            carbs: {type: Number, required: false, default: 0},
            fat: {type: Number, required: false, default: 0},
            fibre: {type: Number, required: false, default: 0},
        },
    },
    nutritionSummary: {
        kcal: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fibre: Number,
        required: true
    },
    activities: {
        kcal: {type: Number, required: true, default: 0},
        description: {type: String, required: true, default: "No activities"},
        required: false,
    },
    author: {
        type: Schema.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model("DiaryEntry", diaryEntrySchema);