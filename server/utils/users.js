const mongo = require("./mongo");

const users = [];

// Join user to chat
function userJoin(id, username, room){
    const user = {id, username, room, life: 1};

    users.push(user);

    mongo.userJoinRoom(user, room);

    return user;
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
        mongo.userLeaveRoom(user_obj, room);
        return user;
    }
}

// Get room users
function getRoomUsers(room){
    return users.filter(user => user.room === room);
}

function listUser(){
    console.log(users);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    listUser
}