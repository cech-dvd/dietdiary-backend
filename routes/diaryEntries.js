var DiaryEntry = require('../models/DiaryEntry');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport);


router.post('/create', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var newEntry = new DiaryEntry();

    newEntry.date = new Date(req.body.date);
    newEntry.author = req.user._id;
    if(req.body.activities.kcal !== ""){
        newEntry.activities = {...newEntry.activities, kcal: req.body.activities.kcal};
    }
    if(req.body.activities.description !== ""){
        newEntry.activities = {...newEntry.activities, description: req.body.activities.description};
    }

    // console.log(Object.entries(req.body.meals));

    // let meals = req.body.meals;
    // for (let i = 0; i < 6; i++) {
    //     newEntry.meals.push(meals[i]);
    // }

    let mealNames = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "other"];
    let meal = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: [], name: ""};
    let mealEntry = Object.entries(meal);
    let summaryEntry;
    //Calculates nutritionSummary for every meal additionally assigns name to it and creates its content
    for(let i = 0; i<mealNames.length;i++){
        mealEntry[6] = mealNames[i];
        summaryEntry = calculateSummary(Object.entries(req.body.meals)[i][1], {kcal:0});
        for (let j = 0; j < summaryEntry.length; j++){
            mealEntry[j] = summaryEntry[j];
        }
        //Most likely newEntry.meals.push(Object.fromEntries(mealEntry));
        console.log(mealEntry)
    }

    // newEntry.meals.push();
    // calculateSummary(Object.entries(req.body.meals)[1][1], newEntry.activities);
    //
    // console.log(req.body, newEntry);
    res.json(req.body);
    /*newEntry.save(function (err, entry) {
        if (err) {
             res.send(err);
        } else {
             res.send(entry);
         }
    });*/
});

calculateSummary = (meals, activites) =>{
    let nutritionSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: []};

    let summaryEntries = Object.entries(nutritionSummary);
    for (let j = 0; j < meals.length; j++) {
        let mealEntry = Object.entries((meals[j]).food.nutritionVal);
        let grams = meals[j].grams;
        if(parseInt(meals[j].grams)===1){
            summaryEntries[5][1].push(meals[j].food.name + " " + meals[j].grams + " gram");
        } else if(meals[j].grams<5){
            summaryEntries[5][1].push(meals[j].food.name + " " + meals[j].grams + " gramy");
        } else {
            summaryEntries[5][1].push(meals[j].food.name + " " + meals[j].grams + " gramu");
        }
        for (let k = 0; k < summaryEntries.length-1; k++) {
                summaryEntries[k][1] += Math.round(100 *(mealEntry[k][1]*(grams/100))/100);
        }
    }

    summaryEntries[0][1] -= activites.kcal;

    return summaryEntries;
};

module.exports = router;