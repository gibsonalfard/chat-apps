const { query } = require('express');
const moment = require('moment');
const mongo = require("./mongo");

function formatMessage(username, text, time = moment().format("h:mm a"), host = "localhost"){
    return {
        host,
        username,
        text,
        time
    }
}

// Store message to MongoDB
async function storeMessage(message) {
    mongo.insertMessageData(message);
}

// Get message by room from MongoDB
async function getMessageFromDB(query){
    data = await mongo.getAggregation(query);
    return data;
}

module.exports = { 
    formatMessage, 
    storeMessage,
    getMessageFromDB
};