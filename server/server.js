const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers, listUser } = require("./utils/users");
const { get } = require('https');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Administrator";
const viewDir = path.join(__dirname, 'public');

var messageQueue = {};
var socketIdList = [];

// Set Static folder
// app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); 

// Run Client Connection
io.on('connection', socket => {
    socket.on('joinRoom', ({host, username, room}) => {
        if(!messageQueue[room]){
            messageQueue[room] = []
        }
        user = getCurrentUser(host)
        newUser = false;
        
        if(user){
            user.life += 1;
        }else{
            user = userJoin(host, username, room);
            newUser = true;
        }

        socketIdList.push({
            id: socket.id,
            host: host
        });

        socket.join(user.room);

        for (msg of messageQueue[room]){
            var emitType = msg.image ? "messageMedia" : "message";
            var data =  msg.image ? msg.message.name : msg.message;
            socket.emit(emitType, formatMessage(msg.username, data, msg.time, host));
        }

        if(newUser){
            socket.emit("notification", formatMessage(botName, 'Welcome to Chat Apps'));
    
            // Broadcast when user connect to room
            socket.broadcast
                .to(user.room)
                .emit("notification", formatMessage(botName, `${user.username} join the chat`));
        }

        // Send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chat message
    socket.on('chatMessage', ({host, msg}) => {
        const user = getCurrentUser(host);

        time = moment().format("h:mm a");
        messageQueue[user.room].push({
            username: user.username,
            message: msg,
            time: time
        });

        io.to(user.room).emit('message', formatMessage(user.username, msg, time, host));
    });

    // Listen for chat image
    socket.on('chatImage', (msg) => {
        const user = getCurrentUser(msg.host);

        time = moment().format("h:mm a");
        messageQueue[user.room].push({
            username: user.username,
            message: msg,
            image: true,
            time: time
        });

        io.to(user.room).emit('messageImage', formatMessage(user.username, msg, time, msg.host));
    });

    // Output on Typing
    socket.on('typing', (msg) => {
        const user = getCurrentUser(msg.host);
        msg.username = user ? user.username : msg.username;
        
        io.to(user.room).emit('display', msg);
    });

    // Request Media from Client
    socket.on('requestMedia', ({host, key}) => {
        const user = getCurrentUser(host);
        message = null;

        for(msg of messageQueue[user.room]){
            if(msg.message.name == key){
                message = msg;
                break;
            }
        }
        console.log(message);
        if(message){
            io.to(user.room).emit('requestMedia', formatMessage(message.username, message.message, host));
        }
    });

    // Broadcast when user disconnects to room
    socket.on('disconnect', () => {
        host = removeUserById(socket.id);
        
        account = getCurrentUser(host);
        account.life -= 1;
        if(account.life == 0){
            const user = userLeave(host);

            if(user){
                io.to(user.room).emit("notification", formatMessage(botName, `${user.username} has left the chat`));

                // Send user and room info
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                });

                listUser();
            }
        }
    });
})

function removeUserById(id){
    console.log("Find By Id");
    console.log(socketIdList);

    index = socketIdList.findIndex(user => user.id === id);
    if(index !== -1){
        return socketIdList.splice(index, 1)[0].host;
    }
}

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));