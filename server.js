 // server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Array to store online users
const onlineUsers = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const userIndex = onlineUsers.indexOf(socket.userName);
    if (userIndex !== -1) {
      onlineUsers.splice(userIndex, 1);
      io.emit('user disconnected', onlineUsers, socket.userName); // Sending both the array and the userName
    }
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

  socket.on('user connected', (userName) => {
    socket.userName = userName;
    onlineUsers.push(userName);
    io.emit('user connected', onlineUsers); // Sending the updated array of online users
  });  
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
