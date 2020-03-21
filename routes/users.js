let User = require('../models/User');
let express = require('express');
let mongoose = require('mongoose');
let passport = require('passport');
let router = express.Router();
let jwt = require('jsonwebtoken');
require('../config/passport.js')(passport);

//Receives password and email of the user in body, then it searches for a user in the database with such email and if it
//finds such user it calls the comparePassword function (for more information see User.js)  which compares the received
//password with the hash in the database and if these match then it returns authentication token, email and username of
//the user
router.post('/login', (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findOne({email: email}).exec(function (err, foundUser) {
        if (err) {
            res.sendStatus(500);
        } else if (foundUser) {
            foundUser.comparePassword(password, function (err, isMatch) {
                if (isMatch && isMatch == true) {
                    jwt.sign({user: foundUser}, 'someKey', (err, token) => {
                        res.json({
                            email: foundUser.email,
                            username: foundUser.username,
                            token: token
                        })
                    });
                } else {
                    res.sendStatus(400);
                }
            });
        } else {
            res.sendStatus(400)
        }
    });
});

//If there isn't already a user with email and username it receives in body, it starts saving a user with the data from
//its body, but before it saves the user the password is hashed (for more information see User.js)
router.post('/register', async (req, res, next) => {
    let unique = await userUniqueCheck(req.body.email, req.body.username);
    if (unique) {
        if (req.body.password === req.body.repassword) {
            let newUser = new User();
            newUser.email = req.body.email; //"test2@test.com"
            newUser.password = req.body.password; //"123"
            newUser.username = req.body.username;

            newUser.save(function (err, savedUser) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);
                }
            });
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(400);
    }
});

//Calculates recommended intake of nutritional values according to the Mifflin-St Jeor equation. It requires sex, weight,
//height, age and intensity of the user's daily activity in order to calculate the values. It then saves the recommended
//intake into the document representing the user's account in the database.
router.post('/intake', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    if (!req.body.age && !req.body.height && !req.body.weight && !req.body.sex && !req.body.activity) {
        res.sendStatus(400)
    } else {
        //Initializes variables with all the data from the request
        let nutritionGoal = {kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0};
        let caloriesIntake;
        let activites = ["Sedentary", "Lightly active", "Moderately active", "Very active", "Extra active"];
        let activityCoefficientArray = [1.2, 1.375, 1.55, 1.725, 1.9];
        let activityCoefficient;

        for (let i = 0; i < activites.length; i++) {
            if (activites[i] === req.body.activity) {
                activityCoefficient = activityCoefficientArray[i];
            }
        }

        //Calculates recommended calories intake
        if (req.body.sex === "male") {
            caloriesIntake = (10 * req.body.weight + 6.25 * req.body.height - 5 * req.body.age + 5) * activityCoefficient;
        } else {
            caloriesIntake = (10 * req.body.weight + 6.25 * req.body.height - 5 * req.body.age + -161) * activityCoefficient;
        }

        //Splits the calories into recommended ratios for macronutrients
        nutritionGoal.kcal = Math.round(caloriesIntake * 100) / 100;
        nutritionGoal.protein = Math.round(((0.25 * caloriesIntake) / 4) * 100) / 100;
        nutritionGoal.carbs = Math.round(((0.5 * caloriesIntake) / 4) * 100) / 100;
        nutritionGoal.fat = Math.round(((0.25 * caloriesIntake) / 9) * 100) / 100;

        //Calculates fibre, however it may be inaccurate since fibre is very specific
        if (req.body.age < 3) {
            nutritionGoal.fibre = 14;
        } else if (req.body.age < 8) {
            nutritionGoal.fibre = 17.64;
        } else if (req.body.age < 13) {
            nutritionGoal.fibre = 24.32;
        } else if (req.body.age < 18) {
            nutritionGoal.fibre = 28.56;
        } else {
            if (req.body.sex === "male") {
                nutritionGoal.fibre = 34.27;
            } else {
                nutritionGoal.fibre = 28.39;
            }
        }

        //Saves the document into the database
        User.updateOne({_id: req.user._id}, {intakeGoal: nutritionGoal}).exec(function (err) {
            if (err) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    }
});

//Receives authentication token in request with which it retrieves a user account from the database and then sends
//information about the given user in response
router.get('/userInformation', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    let goal = req.user.intakeGoal;
    if (!req.user.intakeGoal.kcal) {
        goal = null;
    }

    let userInformation = {
        email: req.user.email,
        username: req.user.username,
        userGoal: goal,
    };

    res.send(userInformation);
});

//Checks whether a user for given email and username doesn't already exist
userUniqueCheck = async (email, username) => {
    let numberOfEntries = await User.countDocuments({email: email});
    numberOfEntries += await User.countDocuments({username: username});
    return numberOfEntries === 0;
};

module.exports = router;
