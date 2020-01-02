let User = require('../models/User');
let express = require('express');
let mongoose = require('mongoose');
let passport = require('passport');
let router = express.Router();
let jwt = require('jsonwebtoken');
require('../config/passport.js')(passport);

router.post('/login', (req, res, next) => {
    let email = req.body.email; //"test2@test.com"
    let password = req.body.password; //"123"

    console.log(req.body.email, req.body);

    User.findOne({email: email}).exec(function(err, foundUser){
        if(err){
            console.log(err);
            res.send(err);
        } else {
            foundUser.comparePassword(password, function(err, isMatch) {
                if(isMatch && isMatch == true){
                    jwt.sign({user: foundUser}, 'someKey', (err, token) =>{
                        res.json({
                            token: token
                        })
                    });
                    console.log("Signed");
                } else{
                    console.log("Invalid credentials");
                    res.sendStatus(401);
                }
            });
        }
    });
});


router.post('/register', (req, res, next) => {

    if(req.body.password === req.body.repassword) {
        let newUser = new User();
        newUser.email = req.body.email; //"test2@test.com"
        newUser.password = req.body.password; //"123"
        newUser.username = req.body.username;

        newUser.save(function (err, savedUser) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.sendStatus(200);
            }
        });
    } else {
            res.sendStatus(401);
    }
});

router.get('/test', passport.authenticate('jwt', { session: false }), (req, res) => {
    const userInformation = {
        email: req.user.email,
        username: req.user.username
    };
    res.json(userInformation);
});

module.exports = router;
