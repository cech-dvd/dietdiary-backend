let DiaryEntry = require('../models/DiaryEntry');
let express = require('express');
let mongoose = require('mongoose');
let router = express.Router();
let passport = require('passport');
let createMeal = require('../public/javascripts/functions.js');
require('../config/passport.js')(passport);

//Finds a DiaryEntry document by its author and date or range of dates given by array of two dates - start and end
router.get('/get', passport.authenticate('jwt', {session: false}), (req, res) => {
    let date;
    let goal = {
        "goalKcal": 2550,
        "goalProtein": 300,
        "goalCarbs": 300,
        "goalFat": 300,
        "goalFibre": 300,
    };

    if (Array.isArray(JSON.parse(req.query.date))) {
        date = [];

        JSON.parse(req.query.date).forEach(dateString => {
            date.push(new Date(dateString));
        });

        DiaryEntry.find({
            author: req.user._id,
            date: {$gte: date[0], $lte: date[1]}
        }).exec(function (err, diaryEntries) {
            if (err) {
                console.log("An error has occurred")
            } else {
                if (diaryEntries.length === 0) {
                    res.status(404);
                    res.send("No documents with such dates and author in the database")
                } else {
                    let rawDiaryEntries = diaryEntries;
                    let processedDiaryEntries = [];
                    rawDiaryEntries.forEach(diaryEntry => {
                        let processedEntry = {...diaryEntry.nutritionSummary, ...goal, date: diaryEntry.date.getDate() + ". " + diaryEntry.date.getMonth()+1 + ". " + diaryEntry.date.getFullYear()};
                        delete processedEntry.$init;
                        processedDiaryEntries.push(processedEntry);
                    });
                    console.log(processedDiaryEntries);
                    res.send(diaryEntries);
                }
            }
        });
    } else {
        date = new Date(JSON.parse(req.query.date));
        DiaryEntry.find({author: req.user._id, date: date}).exec(function (err, diaryEntry) {
            if (err) {
                console.log("An error has occurred")
            } else {
                if (diaryEntry.length === 0) {
                    res.status(404);
                    res.send("No documents with such date and author in the database")
                } else {
                    res.send(diaryEntry);
                }
            }
        });
    }

});

//Creates DiaryEntry document if there isn't already a document with identical author and date, requires author, date
//and array of meals as defined in mealSchema in DiaryEntry.js, activities are not compulsory
router.post('/create', passport.authenticate('jwt', {session: false}), async (req, res) => {

    let newEntry = new DiaryEntry();

    //Checks whether there isn't a DiaryEntry already for the same date and user
    let unique = await uniqueCheck(req.user._id, req.body.date);
    if (unique) {
        //Saves date and author received in the body of the request into the new DiaryEntry
        newEntry.date = new Date(req.body.date);
        newEntry.author = req.user._id;

        //Checks if the request contents activities which are not compulsory and saves them if present
        if (req.body.activities.kcal !== "") {
            newEntry.activities = {...newEntry.activities, kcal: req.body.activities.kcal};
        }
        if (req.body.activities.description !== "") {
            newEntry.activities = {...newEntry.activities, description: req.body.activities.description};
        }

        let allMeals = [];
        let mealNames = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "other"];
        let meal = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: [], name: ""};
        let mealEntry = Object.entries(meal);
        let summaryEntry;

        //Creates meal object the form of which is determined by mealSchema in DiaryEntry.js for every meal, the objects are
        //then saved into an array and further used
        for (let i = 0; i < mealNames.length; i++) {
            mealEntry[6][1] = mealNames[i];
            summaryEntry = createMeal(Object.entries(req.body.meals)[i][1]);
            for (let j = 0; j < summaryEntry.length; j++) {
                mealEntry[j] = summaryEntry[j];
            }
            allMeals.push(Object.fromEntries(mealEntry));
        }
        newEntry.meals = allMeals;

        //Creates nutritionSummary with the nutritional values located in the individual meals and activities received from client
        newEntry.nutritionSummary = createSummary(allMeals, newEntry.activities.kcal);

        res.send(newEntry);

        //Saves the object into the database
        // newEntry.save(function (err, entry) {
        //     if (err) {
        //          res.send(err);
        //     } else {
        //          res.send(entry);
        //      }
        // });
    } else {
        res.status(403);
        console.log(req.body.date);
        res.send("Document with given date and author already exists")
    }
});

//Creates nutritionSummary object defined by diaryEntrySchema in DiaryEntry.js from meals and activites passed to the
//function in arguments
createSummary = (meals, activites) => {
    let nutritionSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0};
    let summaryEntries = Object.entries(nutritionSummary);
    let mealEntries;
    let meal;
    for (let i = 0; i < meals.length; i++) {
        meal = meals[i];
        mealEntries = Object.entries(meal);
        for (let j = 0; j < summaryEntries.length; j++) {
            summaryEntries[j][1] += mealEntries[j][1];
        }
    }
    summaryEntries[0][1] -= activites;

    return Object.fromEntries(summaryEntries);
};

//Checks whether a DiaryEntry for given day and author doesn't already exist
uniqueCheck = async (author, date) => {
    let numberOfEntries = await DiaryEntry.countDocuments({author: author, date: date});
    return numberOfEntries === 0;
};

module.exports = router;