let DiaryEntry = require('../models/DiaryEntry');
let express = require('express');
let mongoose = require('mongoose');
let router = express.Router();
let passport = require('passport');
let createMeal = require('../accessories/functions.js');
require('../config/passport.js')(passport);

//Finds a DiaryEntry document by its author and date or range of dates given by array of two dates - start and end
router.get('/get', passport.authenticate('jwt', {session: false}), (req, res) => {
    //Initializes temporary variables
    let date;
    let nutritionTemplate = {"kcal": 0, "protein": 0, "carbs": 0, "fat": 0, "fibre": 0};
    let goal = {
        "goalKcal": 2550,
        "goalProtein": 100,
        "goalCarbs": 100,
        "goalFat": 100,
        "goalFibre": 100,
    };

    if (Array.isArray(JSON.parse(req.query.date))) {
        date = [];

        JSON.parse(req.query.date).forEach(dateString => {
            date.push(new Date(dateString));
        });

        //Stores number of days between the two received dates in request
        let numberOfDays = Math.floor((date[1] - date[0]) / 86400000);

        DiaryEntry.find({
            author: req.user._id,
            date: {$gte: date[0], $lte: date[1]}
        }).exec(function (err, diaryEntries) {
            if (err) {
                res.sendStatus(500);
            } else {
                let rawDiaryEntries = diaryEntries;
                let allDates = [date[0]];
                let processedDiaryEntries = [];

                //Creates all the dates between the two dates which it receives in request
                for (let i = 0; i < numberOfDays; i++) {
                    let nextDay = new Date(allDates[i]);
                    nextDay.setDate(nextDay.getDate() + 1);
                    allDates.push(nextDay);
                }

                //Creates an empty diaryEntry and adds it to processedDiaryEntries array
                allDates.forEach(entry => {
                    let processedEntry = {
                        ...nutritionTemplate,
                        ...goal,
                        date: entry.getDate() + ". " +
                            (entry.getMonth() + 1) + ". " + entry.getFullYear()
                    };
                    processedDiaryEntries.push(processedEntry);
                });

                //Changes the properties of the empty processedDiaryEntries to the properties of according diaryEntries
                // stored in database in the range given in request
                let alreadySearched = 0;
                rawDiaryEntries.forEach(diaryEntry => {
                    let entryDate = diaryEntry.date.getDate() + ". " +
                        (diaryEntry.date.getMonth() + 1) + ". " + diaryEntry.date.getFullYear();

                    for (let i = alreadySearched; i < processedDiaryEntries.length; i++) {

                        if (processedDiaryEntries[i].date === entryDate) {
                            //Calculates the goal from the user's goal and nutritionSummary of the given day
                            let goalCopy = goal;
                            let summaryEntries = Object.entries(diaryEntry.nutritionSummary);
                            let goalEntries = Object.entries(goalCopy);
                            for (let j = 0; j < 5; j++) {
                                goalEntries[j][1] = goalEntries[j][1] - summaryEntries[j + 1][1];
                            }

                            //Stores all the data into the array
                            processedDiaryEntries[i] = {
                                ...processedDiaryEntries[i],
                                ...diaryEntry.nutritionSummary,
                                ...Object.fromEntries(goalEntries),
                            };
                            delete processedDiaryEntries[i].$init;

                            //If there has been a match there's no need for further cycles
                            lastIndex = i;
                            break;
                        }

                    }
                    //No need to examine the first processedEntry one again
                    alreadySearched++;
                });
                res.send(processedDiaryEntries);
            }
        });
    } else {
        date = new Date(JSON.parse(req.query.date));
        //Creates template data for DiaryEntry
        let processedDiaryEntry = {
            ...nutritionTemplate,
            ...goal,
            date: date.getDate() + ". " +
                (date.getMonth() + 1) + ". " + date.getFullYear()
        };

        DiaryEntry.find({author: req.user._id, date: date}).exec(function (err, diaryEntry) {
            if (err) {
                res.sendStatus(500);
            } else {
                if (diaryEntry.length === 0) {
                    //If there isn't a DiaryEntry in the database response is the template
                    res.send(processedDiaryEntry);
                } else {
                    //Calculates nutrition values left in order to reach the goal
                    let goalEntries = Object.entries(goal);
                    let summaryEntries = Object.entries(diaryEntry[0].nutritionSummary);
                    for (let j = 0; j < 5; j++) {
                        goalEntries[j][1] = goalEntries[j][1] - summaryEntries[j + 1][1];
                    }

                    //Updates the template with data from the database
                    processedDiaryEntry = {
                        ...processedDiaryEntry,
                        ...diaryEntry[0].nutritionSummary,
                        ...Object.fromEntries(goalEntries),
                    };
                    delete processedDiaryEntry.$init;

                    //Creates object with both the data from the updated template and additional data from the database
                    let enrichedEntry = {
                        data: {...processedDiaryEntry},
                        enrichedData: {
                            meals: diaryEntry[0].meals,
                            activities: {...diaryEntry[0].activities}
                        },
                        authorUsername: diaryEntry[0].authorUsername,
                        _id: diaryEntry[0]._id,
                    };
                    delete enrichedEntry.enrichedData.activities.$init;

                    res.send(enrichedEntry);
                }
            }
        });
    }

});

//Creates DiaryEntry document if there isn't already a document with identical author and date, requires author, date
//and array of meals as defined in mealSchema in DiaryEntry.js, activities are not compulsory
router.post('/create', passport.authenticate('jwt', {session: false}), async (req, res) => {

    let newEntry = new DiaryEntry();

    //Checks whether there isn't a DiaryEntry already for the same date and user
    let unique = await uniqueCheck(req.user._id, req.body.date);
    if (unique) {
        //Saves date and author received in the body of the request into the new DiaryEntry
        newEntry.date = new Date(req.body.date);
        newEntry.author = req.user._id;
        newEntry.authorUsername = req.user.username;

        //Checks if the request contents activities which are not compulsory and saves them if present
        if (req.body.activities.kcal !== "") {
            newEntry.activities = {...newEntry.activities, kcal: req.body.activities.kcal};
        }
        if (req.body.activities.description !== "") {
            newEntry.activities = {...newEntry.activities, description: req.body.activities.description};
        }

        let allMeals = [];
        let mealNames = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "other"];
        let meal = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: [], name: ""};
        let mealEntry = Object.entries(meal);
        let summaryEntry;

        //Creates meal object the form of which is determined by mealSchema in DiaryEntry.js for every meal, the objects are
        //then saved into an array and further used
        for (let i = 0; i < mealNames.length; i++) {
            mealEntry[6][1] = mealNames[i];
            summaryEntry = createMeal(Object.entries(req.body.meals)[i][1], true);
            for (let j = 0; j < summaryEntry.length; j++) {
                mealEntry[j] = summaryEntry[j];
            }
            allMeals.push(Object.fromEntries(mealEntry));
        }
        newEntry.meals = allMeals;

        //Creates nutritionSummary with the nutritional values located in the individual meals and activities received from client
        newEntry.nutritionSummary = createSummary(allMeals, newEntry.activities.kcal);

        //Saves the object into the database
        newEntry.save(function (err, entry) {
            if (err) {
                 res.sendStatus(500);
            } else {
                 res.send(entry);
             }
        });
    } else {
        res.sendStatus(403);
    }
});

//
router.delete('/delete', passport.authenticate('jwt', {session: false}), (req, res, next) => {
    if(!req.body._id){
        res.sendStatus(400)
    } else {
        DiaryEntry.deleteOne({_id: req.body._id, author: req.user._id}).exec(function (err, diaryEntries) {
            if (err) {
                res.sendStatus(500)
            } else {
                if(diaryEntries.deletedCount===1){
                    res.sendStatus(200);
                } else {
                    res.sendStatus(400)
                }
            }
        });
    }
});


//Creates nutritionSummary object defined by diaryEntrySchema in DiaryEntry.js from meals and activites passed to the
//function in arguments
createSummary = (meals, activites) => {
    let nutritionSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0};
    let summaryEntries = Object.entries(nutritionSummary);
    let mealEntries;
    let meal;
    for (let i = 0; i < meals.length; i++) {
        meal = meals[i];
        mealEntries = Object.entries(meal);
        for (let j = 0; j < summaryEntries.length; j++) {
            summaryEntries[j][1] += mealEntries[j][1];
        }
    }
    summaryEntries[0][1] -= activites;

    return Object.fromEntries(summaryEntries);
};

//Checks whether a DiaryEntry for given day and author doesn't already exist
uniqueCheck = async (author, date) => {
    let numberOfEntries = await DiaryEntry.countDocuments({author: author, date: date});
    return numberOfEntries === 0;
};

module.exports = router;