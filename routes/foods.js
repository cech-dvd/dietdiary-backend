var Food = require('../models/Food');
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();
var passport = require('passport');
require('../config/passport.js')(passport);

router.get('/', async (req, res, next) => {
    var foodName = req.query.name;
    var skipNumber = parseInt(req.query.skipNumber);

    let pageCount = await getPages(foodName);

    Food.find({name: {$regex: foodName, $options: '<options>'}}).skip(skipNumber).limit(10).exec(function (err, foods) {
        if (err) {
            res.send("An error has occured")
        } else {
            console.log(skipNumber, pageCount);
            console.log(skipNumber + 10 > pageCount);
            res.json({foodArray: foods, last: skipNumber + 10 > pageCount});
        }
    })
});

router.get('/delete', (req, res, next) => {
    var foodName = req.body.name;

    Food.deleteOne({name: foodName}).exec(function (err, foods) {
        if (err) {
            res.send("An error has occured")
        } else {
            res.json(foods)
        }
    })

});


router.post('/create', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    var newFood = new Food();

    newFood.name = req.body.name;
    newFood.nutritionVal = req.body.nutritionVal;
    newFood.author = req.user._id;

    if(req.body.desc){
        newFood.desc = req.body.desc;
    }
    if (req.body.ingredients){
        newFood.ingredients = req.body.ingredients;
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
    pageCount = await Food.countDocuments({name: {$regex: foodName, $options: '<options>'}});
    return pageCount;
};


module.exports = router;