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

    User.findOne({email: email}).exec(function(err, foundUser){
        if(err){
            res.sendStatus(500);
        } else if (foundUser){
            foundUser.comparePassword(password, function(err, isMatch) {
                if(isMatch && isMatch == true){
                    jwt.sign({user: foundUser}, 'someKey', (err, token) =>{
                        res.json({
                            email: foundUser.email,
                            username: foundUser.username,
                            token: token
                        })
                    });
                } else{
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
    if(unique){
        if(req.body.password === req.body.repassword) {
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

//Checks whether a user for given email and username doesn't already exist
userUniqueCheck = async (email, username) => {
    let numberOfEntries = await User.countDocuments({email: email, username: username});
    return numberOfEntries === 0;
};

module.exports = router;
