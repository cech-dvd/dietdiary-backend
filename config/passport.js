const JwtStrategy = require('passport-jwt').Strategy;
const {ExtractJwt} = require('passport-jwt');
const User = require('../models/User');
const secret = require('../accessories/secret.js');
let key = secret.getKey();

//Checks if the user authenticationHeader received in request matches after decryption with a user in the database
module.exports = passport => passport.use(
    new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: key
    }, (payload, done) => {
        User.findOne({_id: payload.user._id}, (err, user) => {
            if (err) {
                console.log(err);
                return done(err, false);
            }
            if (user) {
                return done(null, user);
            } else {
                return done(null, false);
            }
        })
    })
);

