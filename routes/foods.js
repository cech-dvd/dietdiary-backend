let Food = require('../models/Food');
let express = require('express');
let mongoose = require('mongoose');
let router = express.Router();
let passport = require('passport');
let createMeal = require('../accessories/functions.js');
require('../config/passport.js')(passport);

//Receives name of the food and number of pages which it is supposed to skip( one page consists of 10 documents), with
//this data it then searches the database for documents and returns these documents as well as a boolean which states
//whether the page returned was the last one
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

//Receives in body food id and its author, then it searches the database for valid document and deletes it if there is one
router.delete('/delete', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    if(!req.body._id){
        res.sendStatus(400)
    } else {
        // Food.deleteOne({_id: req.body._id, author: req.user._id}).exec(function (err, foods) {
        //     if (err) {
        //         res.send("An error has occured")
        //     } else {
        //         if(foods.deletedCount===1){
        //             res.sendStatus(200);
        //         } else {
        //             res.sendStatus(400);
        //         }
        //         console.log(foods);
        //     }
        // });

        res.sendStatus(200)
    }
});

//Creates Food object specified in FoodSchema in Food.js from data it receives in body of the request, processes both
// requests with ingredients and meals.Ingredients receive nutrition values in the request and don't receive any further
// ingredients, whereas nutrition values of meals are solely based on their ingredients.
router.post('/create', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    let newFood = new Food();

    newFood.name = req.body.name;
    newFood.author = req.user._id;
    newFood.authorUsername = req.user.username;
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
    //         res.sendStatus(500);
    //     } else {
    //         res.send(food)
    //     }
    // });
});

//Returns number of documents in database with given name
getPages = async (foodName) => {
    let pageCount = await Food.countDocuments({name: {$regex: foodName, $options: '<options>'}});
    return pageCount;
};


module.exports = router;