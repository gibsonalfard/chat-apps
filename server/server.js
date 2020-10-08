const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const http = require('http');
const path = require('path');
const fs = require('fs');
const db = require("./config/mongodb");
const socketio = require('socket.io');
const { formatMessage, storeMessage } = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Administrator";
const viewDir = path.join(__dirname, 'public');

var messageQueue = {};

// Set Static folder
// app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true })); 

// Connect to MongoDB
db.mongoose.connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "chatapp"
})
    .then(() => {
        console.log("Connected to MongoDB!");
    })
    .catch(err => {
        console.log(db.url);
        console.log("Cannot connect to MongoDB!", err);
        process.exit();
    });

// Run Client Connection
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        // If room is not exist, create message queue
        if(!messageQueue[room]){
            messageQueue[room] = []
        }

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        for (msg of messageQueue[room]){
            var emitType = msg.image ? "messageMedia" : "message";
            var data =  msg.image ? msg.message.name : msg.message;
            socket.emit(emitType, formatMessage(msg.username, data, msg.time));
        }

        socket.emit("notification", formatMessage(botName, 'Welcome to Chat Apps'));

        // Broadcast when user connect to room
        socket.broadcast
            .to(user.room)
            .emit("notification", formatMessage(botName, `${user.username} join the chat`));

        // Send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        const moment_date = moment();
        time = moment_date.format("h:mm a");
        messageQueue[user.room].push({
            username: user.username,
            message: msg,
            time: time
        });

        const message = {
            username: user.username,
            message: msg,
            datetime: moment_date.toDate(),
            room_name: user.room,
            indexInRoom: messageQueue[user.room].length-1,
        }

        storeMessage(message);

        io.to(user.room).emit('message', formatMessage(user.username, msg, time));
    });

    // Listen for chat image
    socket.on('chatImage', (msg) => {
        const user = getCurrentUser(socket.id);

        const moment_date = moment();
        time = moment_date.format("h:mm a");
        messageQueue[user.room].push({
            username: user.username,
            message: msg,
            image: true,
            time: time
        });

        const message = {
            username: user.username,
            message: {
                filename: msg.name,
                data: msg.media
            },
            datetime: moment_date.toDate(),
            room_name: user.room,
            indexInRoom: messageQueue[user.room].length-1,
        }

        storeMessage(message);

        io.to(user.room).emit('messageImage', formatMessage(user.username, msg, time));
    });

    // Output on Typing
    socket.on('typing', (msg) => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('display', msg);
    });

    // Request Media from Client
    socket.on('requestMedia', (key) => {
        const user = getCurrentUser(socket.id);
        message = null;

        for(msg of messageQueue[user.room]){
            if(msg.message.name == key){
                message = msg;
                break;
            }
        }
        console.log(message);
        if(message){
            io.to(user.room).emit('requestMedia', formatMessage(message.username, message.message));
        }
    });

    // Broadcast when user disconnects to room
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit("notification", formatMessage(botName, `${user.username} has left the chat`));

            // Send user and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
})


const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));