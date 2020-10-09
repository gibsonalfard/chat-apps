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

module.exports = { 
    formatMessage, 
    storeMessage,
};