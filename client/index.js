// const io = require('socket.io-client');
const socketio = require('socket.io');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
// console.log(server);
const io = socketio(server);

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 8088 || process.env.PORT;

server.listen(PORT, () => console.log(`Client running on port ${PORT}`));