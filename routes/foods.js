let Food = require('../models/Food');
let express = require('express');
let mongoose = require('mongoose');
let router = express.Router();
let passport = require('passport');
let createMeal = require('../public/javascripts/functions.js');
require('../config/passport.js')(passport);

router.get('/', async (req, res, next) => {
    let foodName = req.query.name;
    let skipNumber = parseInt(req.query.skipNumber);

    let pageCount = await getPages(foodName);

    Food.find({name: {$regex: foodName, $options: '<options>'}}).skip(skipNumber).limit(10).exec(function (err, foods) {
        if (err) {
            res.send("An error has occured")
        } else {
            res.json({foodArray: foods, last: skipNumber + 10 > pageCount});
        }
    })
});

router.get('/delete', (req, res, next) => {
    let foodName = req.body.name;

    Food.deleteOne({name: foodName}).exec(function (err, foods) {
        if (err) {
            res.send("An error has occured")
        } else {
            res.json(foods)
        }
    })

});

//Creates Food object specified in FoodSchema in Food.js from data it receives in body of the request, processes both
// requests with ingredients and meals.Ingredients receive nutrition values in the request and don't receive any further
// ingredients, whereas nutrition values of meals are solely based on their ingredients.
router.post('/create', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    let newFood = new Food();

    newFood.name = req.body.name;
    newFood.author = req.user._id;
    if (req.body.desc) {
        newFood.desc = req.body.desc;
    }

    if (req.body.nutritionVal) {
        newFood.nutritionVal = req.body.nutritionVal;
    } else {
        newFood.ingredients = req.body.ingredients;

        //Creates nutritional values from ingredients
        let nutritionalValEntries = createMeal(req.body.ingredients);
        nutritionalValEntries.pop();
        newFood.nutritionVal = Object.fromEntries(nutritionalValEntries);
    }

    res.json(newFood);
    // newFood.save(function (err, food) {
    //     if (err) {
    //         res.send(err);
    //     } else {
    //         res.send(food)
    //     }
    // });
});

getPages = async (foodName) => {
    let pageCount = await Food.countDocuments({name: {$regex: foodName, $options: '<options>'}});
    return pageCount;
};


module.exports = router;