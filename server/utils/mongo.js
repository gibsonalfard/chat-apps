const db = require("../config/mongodb");
const User = db.User;
const Room = db.Room;
const Message = db.Message;

// Get user
async function getUser(query) {
    return User.findOne(query).then(docUser => {
        // console.log("\n>> Got User:\n", docUser);
        return docUser;
    });
};

// Insert user to MongoDB
async function createUser(userObj) {
    return User.create(userObj).then(docUser => {
        // console.log("\n>> Created User:\n", docUser);
        return docUser;
    });
};

// Delete user from MongoDB
async function deleteUser(userId) {
    const options = { useFindAndModify: false };
    return User.findByIdAndRemove(userId, options, function (err, deletedDoc) {
        if (err) {
            console.log(err);
        } else {
            // console.log(`Deleted Doc: ${deletedDoc}`);
            return deletedDoc;
        }
    });
}

// Get room
async function getRoom(query) {
    return Room.findOne(query).then(docRoom => {
        // console.log("\n>> Got Room:\n", docRoom);
        return docRoom;
    });
};

// Insert room to MongoDB
async function createRoom(roomObj) {
    return Room.create(roomObj).then(docRoom => {
        // console.log("\n>> Created Room:\n", docRoom);
        return docRoom;
    });
};

// Delete room from MongoDB
async function deleteRoom(roomId) {
    const options = { useFindAndModify: false };
    return Room.findByIdAndRemove(roomId, options, function (err, deletedDoc) {
        if (err) {
            console.log(err);
        } else {
            // console.log(`Deleted Doc: ${deletedDoc}`);
            return deletedDoc;
        }
    });
}

// Delete messages from room MongoDB
async function deleteMessagesByRoomId(roomId) {
    const query = { room: roomId }
    return Message.deleteMany(query, function (err, deletedDoc) {
        if (err) {
            console.log(err);
        } else {
            // console.log(`Deleted Doc: ${deletedDoc}`);
            return deletedDoc;
        }
    });
}

async function addUserToRoom(userObj, roomId) {
    const updateQuery = {
        $push: {
            members: userObj._id
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false };
    return Room.findByIdAndUpdate(roomId, updateQuery, options);
}

async function addRoomToUser(roomObj, userId) {
    const updateQuery = {
        $push: {
            rooms: roomObj._id
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false };
    return User.findByIdAndUpdate(userId, updateQuery, options);
}

// Get Aggregation
exports.getAggregation = async function (query){
    return Message.aggregate(query).then(doc => {
        return doc;
    });
    // doc = await aggregateMongo(query);
    // return doc;
}

// Insert user data to MongoDB
exports.userJoinRoom = async function (user, room) {
    console.log(`User ${user.username} is joining ${room}`);

    // User
    userObj = {
        id: user.id,
        username: user.username
    };

    // unique username
    const queryUser = { username: user.username };

    try {
        docUser = await getUser(queryUser);
    } catch (err) {
        console.log(err);
    }

    if (docUser == null) {
        console.log(`Creating new user: ${userObj.username}`);
        docUser = await createUser(userObj);
    }

    // Room
    roomObj = {
        name: room
    }

    // unique room name
    const queryRoom = { name: room };

    try {
        docRoom = await getRoom(queryRoom);
    } catch (err) {
        console.log(err);
    }

    if (docRoom == null) {
        console.log(`Creating new room: ${roomObj.name}`);
        try {
            docRoom = await createRoom(roomObj);
        } catch (err) {
            console.log(err);
        }
    }

    // Add User to Room
    try {
        docRoom = await addUserToRoom(docUser, docRoom._id);
    } catch (err) {
        console.log(err);
    }

    // Add Room to User
    try {
        docUser = await addRoomToUser(docRoom, docUser._id);
    } catch (err) {
        console.log(err);
    }
}

async function removeUserFromRoom(user, roomId) {
    const updateQuery = {
        $pull: {
            members: user._id
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false };
    return await Room.findByIdAndUpdate(roomId, updateQuery, options);
}

async function removeRoomFromUser(room, userId) {
    const updateQuery = {
        $pull: {
            rooms: room._id
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true, useFindAndModify: false };
    return await User.findByIdAndUpdate(userId, updateQuery, options);
}

// Insert user data to MongoDB
exports.userLeaveRoom = async function (user, room) {
    console.log(`User ${user.username} is leaving ${room}`);
    // User
    userObj = {
        id: user.id,
        username: user.username
    };

    // unique username
    const queryUser = { username: user.username };

    try {
        docUser = await getUser(queryUser);
    } catch (err) {
        console.log(err);
    }

    // Room
    roomObj = {
        name: room
    }

    // unique room name
    const queryRoom = { name: room };

    try {
        docRoom = await getRoom(queryRoom);
    } catch (err) {
        console.log(err);
    }

    // Remove User from Room
    try {
        docRoom = await removeUserFromRoom(docUser, docRoom._id);
    } catch (err) {
        console.log(err);
    }

    // Remove Room from User
    try {
        docUser = await removeRoomFromUser(docRoom, docUser._id);
    } catch (err) {
        console.log(err);
    }

    // Delete room and messages in that room if the room has no member
    if (docRoom.members.length == 0) {
        console.log(`Deleting room ${docRoom.name} and the messages in that room`);
        try {
            await deleteMessagesByRoomId(docRoom._id);
            await deleteRoom(docRoom._id);
        } catch (err) {
            console.log(err);
        }
    }
}

// Store message to MongoDB
async function createMessage(messageObj) {
    return Message.create(messageObj).then(docMessage => {
        // console.log("\n>> Created Message:\n", docMessage);
        return docMessage;
    });
}

// Insert message
exports.insertMessageData = async function(msg) {
    console.log(`User ${msg.username} send message to ${msg.room_name}`)

    // unique username
    const queryUser = { username: msg.username };

    try {
        docUser = await getUser(queryUser);
    } catch (err) {
        console.log(err);
    }

    // unique room name
    const queryRoom = { name: msg.room_name };

    try {
        docRoom = await getRoom(queryRoom);
    } catch (err) {
        console.log(err);
    }
    
    messageObj = {
        user: docUser._id,
        message: msg.message,
        datetime: msg.datetime,
        room: docRoom._id,
        indexInRoom: msg.indexInRoom
    }

    docMessage = await createMessage(messageObj);
}