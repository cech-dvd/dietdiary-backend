let mongoose = require('mongoose');
let secret = require('../accessories/secret.js');
let uri = secret.getDBUri();

//Function which connect to the Atlas MongoDB database
const connectToDB = async () => {
    await mongoose.connect(uri, {useNewUrlParser:true, useFindAndModify: false})
        .then(()=>{
            console.log('Connected to DB...');
        })
        .catch(err=>{
            console.log(err)
        });
};

module.exports = connectToDB;