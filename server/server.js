const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const fs = require('fs');
const socketio = require('socket.io');
const formatMessage = require("./utils/messages");
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

// Run Client Connection
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        if(!messageQueue[room]){
            messageQueue[room] = []
            messageQueue[room].push({
                username: botName,
                message: 'Welcome to Chat Apps'
            });
        }

        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        for (msg of messageQueue[room]){
            // if(msg.image){
            //     socket.emit('messageImage', formatMessage(msg.username, msg.message));
            // }else{
            //     socket.emit("message", formatMessage(msg.username, msg.message));
            // }
            emitType = msg.image ? "messageImage" : "message";
            socket.emit(emitType, formatMessage(msg.username, msg.message));
        }

        // Send Image
        // fs.readFile('sample.jpg', function(err, data){
        //     socket.emit('messageImage', formatMessage(botName, data));
        //     console.log(data);
        //     // socket.emit('imageConversionByServer', "data:image/png;base64,"+ data.toString("base64"));
        // });

        // Say Hi to Someone who connect
        // socket.emit("message", formatMessage(botName, 'Welcome to Chat Apps'));

        // Broadcast when user connect to room
        socket.broadcast
            .to(user.room)
            .emit("message", formatMessage(botName, `${user.username} join the chat`));

        // Send user and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    // Listen for chat message
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);

        messageQueue[user.room].push({
            username: user.username,
            message: msg
        });

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Listen for chat image
    socket.on('chatImage', (msg) => {
        const user = getCurrentUser(socket.id);

        messageQueue[user.room].push({
            username: user.username,
            message: msg,
            image: true
        });

        console.log(msg);

        io.to(user.room).emit('messageImage', formatMessage(user.username, msg));
    });

    // Output on Typing
    socket.on('typing', (msg) => {
        const user = getCurrentUser(socket.id);
        
        io.to(user.room).emit('display', msg);
    });

    // Broadcast when user disconnects to room
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit("message", formatMessage(botName, `${user.username} has left the chat`));

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