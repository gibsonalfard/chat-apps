const socket = io();
const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const messageBox = document.getElementById('msg');

var typing=false;
var timeout=undefined;

// Get username and room from URL
const {username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Join chatroom
socket.emit('joinRoom', {username, room});

// Get room and users
socket.on('roomUsers', ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

socket.on('display', (data)=>{
  const typingInfo = document.querySelector('.typing-info');

  if(data.typing==true)
    typingInfo.innerHTML = `${data.username} is typing...`;
  else
    typingInfo.innerHTML = "";
})

// Get Message from Server
socket.on('message', message => {
  console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
})

// Message Typing
messageBox.addEventListener("keypress", (e) => {
  if(e.which!=13){
    typing=true;
    socket.emit('typing', {username, typing, room});
    clearTimeout(timeout);
    timeout=setTimeout(notTyping, 3000);
  }
});

function notTyping(){
  console.log("Not Typing");
  clearTimeout(timeout)
  typing = false;
  socket.emit('typing', {username, typing, room});
}

// Message sent
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  notTyping();

  // Emit message to server
  const msg = e.target.elements.msg.value;
  socket.emit('chatMessage', msg);

  // Clear Input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

// Output message to DOM
function outputMessage(message){
  const div = document.createElement("div");
  div.classList.add('message');
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`;
  document.querySelector(".message-container").appendChild(div);
}

// Add room name to DOM
function outputRoomName(room){
  roomName.innerText = room;
}

// Add user to DOM
function outputUsers(users){
  userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
  `;
}