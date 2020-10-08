const moment = require('moment');

function formatMessage(username, text, time = moment().format("h:mm a"), host = "localhost"){
    return {
        host,
        username,
        text,
        time
    }
}

module.exports = formatMessage;