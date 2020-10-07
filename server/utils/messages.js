const moment = require('moment');

function formatMessage(username, text, time = moment().format("h:mm a")){
    return {
        username,
        text,
        time
    }
}

module.exports = formatMessage;