const JwtStrategy = require('passport-jwt').Strategy;
const {ExtractJwt} = require('passport-jwt');
const User = require('../models/User');

module.exports = passport => passport.use(
    new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: 'someKey'
    }, (payload, done) => {
        console.log(payload);
        User.findOne({_id: payload.user._id}, (err, user) => {
            if (err) {
                console.log(err);
                return done(err, false);
            }
            if (user) {
                console.log(user, "Getting good");
                return done(null, user);
            } else {
                console.log("here");
                return done(null, false);
            }
        })
    })
);

