const socket = io('http://localhost:3000');
const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const messageBox = document.getElementById('msg');
const uploadButton = document.querySelector('#file-upload');

var typing=false;
var timeout=undefined;
var fileByteArray = [];

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
  // console.log(message);
  outputMessage(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
})

// Get Message Image
socket.on('messageImage', message => {
  outputImage(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

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

function getBase64(file) {
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    console.log(reader.result);
    socket.emit("chatImage", reader.result);
  };
  reader.onerror = function (error) {
    console.log('Error: ', error);
  };
}

// Upload Image
uploadButton.addEventListener('change', function(){
  // var file = document.querySelector('#files > input[type="file"]').files[0];
  var file = this.files[0];
  getBase64(file); // prints the base64 string
  this.value = '';
}, false);

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
  const outerdiv = document.createElement("div");
  outerdiv.classList.add("outer-message");
  const div = document.createElement("div");

  classAdd = (username === message.username) ? "message-mine" : "message";
  div.classList.add(classAdd);
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`;
  outerdiv.appendChild(div);
  document.querySelector(".message-container").appendChild(outerdiv);
}

function b64(e){var t="";var n=new Uint8Array(e);var r=n.byteLength;for(var i=0;i<r;i++){t+=String.fromCharCode(n[i])}return window.btoa(t)}

// Output Image to DOM
function outputImage(message){
  const outerdiv = document.createElement("div");
  outerdiv.classList.add("outer-message");
  const div = document.createElement("div");
  // const img = document.createElement("img");

  classAdd = (username === message.username) ? "message-mine" : "message";
  div.classList.add(classAdd); // "data:image/jpg;base64,"+b64(message.text)
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>`;

  var mediaType = message.text.split(":")[1]
  mediaType = mediaType.split(";")[0];
  mediaType = mediaType.split("/")[0];

  console.log(mediaType);

  mediaHTML = "";
  switch(mediaType){
    case "video":
      mediaHTML = `<video class="img-msg" src="${message.text}" controls></video>`;
    break;
    case "image":
      mediaHTML = `<img class="img-msg" src="${message.text}"/>`;
    break;
    default:
      mediaHTML = `<a href="${message.text}">Cannot Load Files</a>`;
  }

  div.innerHTML += mediaHTML;

  outerdiv.appendChild(div);
  document.querySelector(".message-container").appendChild(outerdiv);
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