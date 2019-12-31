var DiaryEntry = require('../models/DiaryEntry');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport);


router.post('/create', passport.authenticate('jwt', {session: false}), (req, res, next) => {

    var newEntry = new DiaryEntry();

    newEntry.date = new Date(req.body.date);
    newEntry.author = req.user._id;
    if (req.body.activities.kcal !== "") {
        newEntry.activities = {...newEntry.activities, kcal: req.body.activities.kcal};
    }
    if (req.body.activities.description !== "") {
        newEntry.activities = {...newEntry.activities, description: req.body.activities.description};
    }

    // console.log(Object.entries(req.body.meals));

    // let meals = req.body.meals;
    // for (let i = 0; i < 6; i++) {
    //     newEntry.meals.push(meals[i]);
    // }

    let allMeals = [];
    let mealNames = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "other"];
    let meal = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: [], name: ""};
    let mealEntry = Object.entries(meal);
    let summaryEntry;
    //Creates meal object the form of which is determined by mealChema in DiaryEntry.js for every meal
    for (let i = 0; i < mealNames.length; i++) {
        mealEntry[6][1] = mealNames[i];
        summaryEntry = createMeal(Object.entries(req.body.meals)[i][1]);
        for (let j = 0; j < summaryEntry.length; j++) {
            mealEntry[j] = summaryEntry[j];
        }
        allMeals.push(Object.fromEntries(mealEntry));
    }
    newEntry.meals = allMeals;

    newEntry.nutritionSummary = createSummary(allMeals, newEntry.activities.kcal);

    console.log(newEntry);
    res.json(req.body);
    /*newEntry.save(function (err, entry) {
        if (err) {
             res.send(err);
        } else {
             res.send(entry);
         }
    });*/
});

//Creates a meal from data it receives, argument foods is an array of food objects paired with grams
createMeal = (foods) => {
    let mealSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: []};

    let summaryEntries = Object.entries(mealSummary);
    for (let j = 0; j < foods.length; j++) {
        let foodEntry = Object.entries((foods[j]).food.nutritionVal);
        let grams = foods[j].grams;
        //This if takes care of inflection of word "gram" in Czech language
        if (parseInt(foods[j].grams) === 1) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gram");
        } else if (foods[j].grams < 5) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramy");
        } else {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramu");
        }
        for (let k = 0; k < summaryEntries.length - 1; k++) {
            summaryEntries[k][1] += Math.round(100 * (foodEntry[k][1] * (grams / 100)) / 100);
        }
    }

    return summaryEntries;
};

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
        for(let j = 0; j < summaryEntries.length; j++){
            summaryEntries[j][1]+= mealEntries[j][1];
        }
    }
    summaryEntries[0][1]-= activites;

    return Object.fromEntries(summaryEntries);
};

module.exports = router;