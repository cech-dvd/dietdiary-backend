var DiaryEntry = require('../models/DiaryEntry');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport);


router.post('/create', passport.authenticate('jwt', { session: false }), (req, res, next) => {

    var newEntry = new DiaryEntry();

    let meals = req.body.meals;
    for (let i = 0; i < 6; i++) {
        newEntry.meals.push(meals[i]);
    }
    newEntry.date = new Date(req.body.date);
    newEntry.nutritionSummary = {kcal: 9, protein: 3, fibre: 2, fat: 1, carbs: 4};
    newEntry.author = req.user._id;
    newEntry.activities = req.body.activities;
    newEntry.nutritionSummary = calculateSummary(meals, req.body.activities);

    res.json(newEntry);
    /*newEntry.save(function (err, entry) {
        if (err) {
             res.send(err);
        } else {
             res.send(entry);
         }
    });*/
});

calculateSummary = (meals, activites) =>{
    let nutritionSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0};

    let entries = Object.entries(nutritionSummary);
    for (let j = 0; j < meals.length; j++) {
        let mealEntry = Object.entries(meals[j]);
        for (let k = 0; k < entries.length; k++) {
                entries[k][1] += mealEntry[k][1];
        }
    }

    entries[0][1] -= activites.kcal;

    return Object.fromEntries(entries);
};

module.exports = router;