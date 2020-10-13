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

function formatMessageResponse(username, text, time = moment().format("h:mm a"), host = "localhost", index = 0){
    return {
        host,
        username,
        text,
        time,
        index
    }
}

// Store message to MongoDB
async function storeMessage(message) {
    mongo.insertMessageData(message);
}

// Get Count Message every Room
async function messageCount(){
    var query = [
        {
            $lookup:{
                from: "room",
                localField: "room",
                foreignField: "_id",
                as: "room"
            }
        },{
            $unwind: "$room"
        },{
            $project:{
                __v: 0,
                "room.__v":0,
                "room._id":0,
                "room.members":0
            }
        },{
            $group:{
                _id: "$room",
                count: {$sum: 1}
            }
        }
    ];

    data = await mongo.getAggregation(query);
    return data;
}

// Get message by room from MongoDB
async function getMessageFromDB(match){
    var query = [
        {
            $lookup:{
                from: "user",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },{
            $unwind: "$user"
        },{
            $project:{
                __v: 0,
                "user.__v":0,
                "user.rooms": 0,
                "user._id": 0
            }
        },{
            $lookup:{
                from: "room",
                localField: "room",
                foreignField: "_id",
                as: "room"
            }
        },{
            $unwind: "$room"
        },{
            $project:{
                __v: 0,
                "room.__v":0,
                "room._id":0,
                "room.members":0
            }
        },{
            $match: match
        } 
    ];

    data = await mongo.getAggregation(query);
    return data;
}

module.exports = { 
    formatMessage,
    formatMessageResponse,
    storeMessage,
    getMessageFromDB,
    messageCount
};