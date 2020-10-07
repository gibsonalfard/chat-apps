const users = [];
const db = require("../config/mongodb");
const User = db.User;
const Room = db.Room;

// Join user to chat
function userJoin(id, username, room){
    const user = {id, username, room};

    users.push(user);

    user_obj = {id, username};
    insertUserData(user_obj);

    addMemberToRoom(user_obj, room);

    return user;
}

async function insertUserData(user){
    User.create(user)
        .then(function (data) {
            // console.log(`user: ${data}`);
        }).catch(function (err) {
            console.log(err)
        });
}

async function addMemberToRoom(user_obj, room){
    const query = {"room_name": room};
    const update = {
        $push: {
            members: user_obj
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    Room.findOneAndUpdate(query, update, options, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
        }    
    });
}

async function removeMemberFromRoom(user_obj, room){
    const query = {"room_name": room};
    const update = {
        $pull: {
            members: user_obj
        }
    }
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    Room.findOneAndUpdate(query, update, options, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            if(result.members.length <= 0){
                Room.deleteOne(result, function (err, deletedDoc) {
                    if (err){
                        console.log(err);
                    } else { 
                        console.log(`Deleted: ${deletedDoc}`);
                    }
                });
            }
        }    
    });
}

// Get Current User
function getCurrentUser(id) {
    return users.find(user => user.id === id);
}

// User Leaves chat
function userLeave(id){
    const index = users.findIndex(user => user.id === id);


    if(index !== -1){
        const user = users.splice(index, 1)[0];
        const user_obj = {
            id: user.id,
            username: user.username
        };
        const room = user.room;
        removeMemberFromRoom(user_obj, room);
        return user;
    }
}

// Get room users
function getRoomUsers(room){
    return users.filter(user => user.room === room);
} 

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
}