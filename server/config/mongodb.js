const mongoose = require("mongoose");

const url = "mongodb://root:hehe90x@localhost:27017/";
mongoose.Promise = global.Promise;

const db = {};
db.mongoose = mongoose;
db.url = url;
db.User = require("../models/User")(mongoose);
db.Room = require("../models/Room")(mongoose);
db.Message = require("../models/Message")(mongoose);

module.exports = db;