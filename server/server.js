const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const http = require('http');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const db = require("./config/mongodb");
const socketio = require('socket.io');

const { formatMessage, formatMessageResponse, storeMessage, getMessageFromDB, messageCount } = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers, listUser } = require("./utils/users");
const { get } = require('https');
const { mongo } = require('mongoose');

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

// Fixing CORS
io.origins('*:*');
app.use(cors());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    if ('OPTIONS' == req.method) {
       res.sendStatus(200);
     }
     else {
       next();
     }});

async function broadcastMessage(socket, user){
    mongoMessage = await getMessageFromDB({ "room.name": user.room });

    for (msg of mongoMessage){
        var emitType = msg.message.data ? "messageMedia" : "message";
        var data =  msg.message.data ? msg.message.filename : msg.message;
        socket.emit(emitType, formatMessage(msg.user.username, data, moment(msg.datetime).format("h:mm a"), msg.user.id));
    }
}

async function sendMedia(host, user, key){
    mongoMessage = await getMessageFromDB({ "message.filename": key, "room.name": user.room });
    message = mongoMessage[0];

    if(message){
        io.to(user.room).emit('requestMedia'+host, formatMessageResponse(message.user.username, 
            message.message, moment(message.datetime).format("h:mm a"), message.user.id, message.indexInRoom));
    }
}

// Get Last Message Index From DB
async function initMessageQueue(){
    mongoMessage = await messageCount();

    for(msg of mongoMessage){
        messageQueue[msg._id.name] = msg.count;
    }
}

// Connect to MongoDB
db.mongoose.connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "chatapp"
}).then(() => {
    console.log("Connected to MongoDB!");
})
.catch(err => {
    console.log(db.url);
    console.log("Cannot connect to MongoDB!", err);
    process.exit();
});

// Assign Message Queue with Previous data from DB
initMessageQueue();

console.log("Message Queue Initialization");
console.log(messageQueue);

// Run Client Connection
io.on('connection', socket => {
    socket.on('joinRoom', ({host, username, room}) => {
        if(!messageQueue[room]){
            messageQueue[room] = 0
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

        broadcastMessage(socket, user);

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

        const moment_date = moment();
        time = moment_date.format("h:mm a");
        messageQueue[user.room] += 1;

        const message = {
            username: user.username,
            message: msg,
            datetime: moment_date.toDate(),
            room_name: user.room,
            indexInRoom: messageQueue[user.room],
        }

        storeMessage(message);

        io.to(user.room).emit('message', formatMessage(user.username, msg, time, host));

        console.log("Message Queue");
        console.log(messageQueue);
    });

    // Listen for chat image
    socket.on('chatImage', (msg) => {
        const user = getCurrentUser(msg.host);

        const moment_date = moment();
        time = moment_date.format("h:mm a");
        messageQueue[user.room] += 1;
        
        const message = {
            username: user.username,
            message: {
                filename: msg.filename,
                data: msg.data
            },
            datetime: moment_date.toDate(),
            room_name: user.room,
            indexInRoom: messageQueue[user.room],
        }

        storeMessage(message);

        io.to(user.room).emit('messageImage', formatMessage(user.username, msg, time, msg.host));

        console.log("Message Media Queue");
        console.log(messageQueue);
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
        sendMedia(host, user, key)
    });

    // Broadcast when user disconnects to room
    socket.on('disconnect', () => {
        host = removeUserById(socket.id);
        
        account = getCurrentUser(host);
        if(account){
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