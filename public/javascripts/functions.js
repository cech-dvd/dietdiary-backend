let express = require('express');

//Creates a meal from data it receives, argument foods is an array of food objects paired with grams
createMeal = (foods) => {
    let mealSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: []};

    let summaryEntries = Object.entries(mealSummary);
    for (let j = 0; j < foods.length; j++) {
        let foodEntry = Object.entries((foods[j]).food.nutritionVal);
        let grams = foods[j].grams;
        //This if takes care of inflection of word "gram" in Czech language
        if (parseInt(foods[j].grams) === 1) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gram");
        } else if (parseInt(foods[j].grams) < 5 && parseInt(foods[j].grams) > 1) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramy");
        } else {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramu");
        }
        for (let k = 0; k < summaryEntries.length - 1; k++) {
            summaryEntries[k][1] += Math.round(100 * (foodEntry[k][1] * (grams / 100)) / 100);
        }
    }

    return summaryEntries;
};

module.exports = createMeal;