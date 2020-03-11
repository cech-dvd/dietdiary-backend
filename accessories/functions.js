let express = require('express');

//Creates a meal from data it receives, argument foods is an array of food objects paired with grams
createMeal = (foods, additive) => {
    let mealSummary = {kcal: 0, protein: 0, fibre: 0, fat: 0, carbs: 0, contents: []};

    let totalGrams = 0;
    let summaryEntries = Object.entries(mealSummary);
    for (let j = 0; j < foods.length; j++) {
        let foodEntry = Object.entries((foods[j]).food.nutritionVal);
        let grams = foods[j].grams;
        //Calculates the grams of all the foods in the parameter
        totalGrams += parseInt(grams);
        //This if takes care of inflection of word "gram" in Czech language
        if (parseInt(foods[j].grams) === 1) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gram");
        } else if (parseInt(foods[j].grams) < 5 && parseInt(foods[j].grams) > 1) {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramy");
        } else {
            summaryEntries[5][1].push(foods[j].food.name + " " + foods[j].grams + " gramů");
        }
        //Adds up all the nutritional values from each food from the parameter foods and saves them into summaryEntries
        for (let k = 0; k < summaryEntries.length - 1; k++) {
            summaryEntries[k][1] += Math.round(100 * (foodEntry[k][1] * (grams / 100))) / 100;
        }
    }

    //This calculates the nutritional values per 100 grams
    if (!additive && totalGrams !== 0) {
        totalGrams = Math.round(100 * (totalGrams / 100)) / 100;
        for (let k = 0; k < summaryEntries.length - 1; k++) {
            summaryEntries[k][1] = Math.round((summaryEntries[k][1] / totalGrams));
        }
    }

    return summaryEntries;
};

module.exports = createMeal;