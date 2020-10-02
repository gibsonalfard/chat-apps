const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = "Administrator";

// Set Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Run Client Connection
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Say Hi to Someone who connect
        socket.emit("message", formatMessage(botName, 'Welcome to Chat Apps'));

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

        io.to(user.room).emit('message', formatMessage(user.username, msg));
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