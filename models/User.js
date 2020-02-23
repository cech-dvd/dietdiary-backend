let mongoose = require('mongoose');
let Schema = mongoose.Schema;

//Password hashing taken from https://stackoverflow.com/questions/14588032/mongoose-password-hashing
bcrypt = require('bcrypt'),
    SALT_WORK_FACTOR = 10;

//Defines the properties every user item in the database should have
let userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
    }
});

//Hashes the password after every create or update and before it goes into the DB
userSchema.pre('save', function (next) {
    let user = this;

    //Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    //Generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        //Hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            //Override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

//Method for comparing clear text password with hashed one
userSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model("User", userSchema);