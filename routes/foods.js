let Food = require('../models/Food');
let express = require('express');
let mongoose = require('mongoose');
let router = express.Router();
let passport = require('passport');
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


router.post('/create', passport.authenticate('jwt', { session: false }), (req, res, next) => {
    let newFood = new Food();

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
    let pageCount = await Food.countDocuments({name: {$regex: foodName, $options: '<options>'}});
    return pageCount;
};


module.exports = router;