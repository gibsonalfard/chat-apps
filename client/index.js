// const io = require('socket.io-client');
const socketio = require('socket.io');
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
// console.log(server);
const io = socketio(server);

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

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT;

server.listen(PORT, () => console.log(`Client running on port ${PORT}`));