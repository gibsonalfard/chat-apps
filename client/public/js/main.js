const socket = io('localhost:3000');
// const socket = io('chat-server:3000');
const chatForm = document.getElementById("chat-form");
const chatMessage = document.querySelector(".chat-messages");
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
const messageBox = document.getElementById('msg');
const uploadButton = document.querySelector('#file-upload');
const host = location.host;

var typing=false;
var timeout=undefined;
var fileByteArray = [];

// If your site is on Cloudflare, then you can use '/cdn-cgi/trace' instead
console.log(location);
// console.log(location.hostname);

// Get username and room from URL
const {username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// Join chatroom
socket.emit('joinRoom', {host, username, room});

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

// Get Notification from Admin
socket.on('notification', message => {
  outputNotif(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

// Get Message from Server
socket.on('message', message => {
  outputMessage(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
})

// Get Message Image
socket.on('messageImage', message => {
  saveToStorage(message.text.filename, message.text.data);
  console.log("Message Image");
  console.log(message);
  outputImage(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

socket.on('requestMedia'+host, message => {
  console.log("Request Media");
  console.log(message);
  saveToStorage(message.text.filename, message.text.data);

  // outputImage(message);
  outputMessageIndex(message);

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

// Get Message Media
socket.on('messageMedia', message => {
  key = message.text
  console.log("Message Media")
  console.log(message);
  data = findInLocal(key);
  if(data){
    message.text = {
      filename: key,
      data: data
    }
    outputImage(message);
  }

  // Scroll down
  chatMessage.scrollTop = chatMessage.scrollHeight;
});

// Message Typing
messageBox.addEventListener("keypress", (e) => {
  if(e.which!=13){
    typing=true;
    socket.emit('typing', {host, username, typing, room});
    clearTimeout(timeout);
    timeout=setTimeout(notTyping, 3000);
  }
});

// Request to Server For Media
function requestMedia(key){
  socket.emit("requestMedia", {host, key});
}

// Save to Local Storage
function saveToStorage(key, value){
  sessionStorage.setItem(key, value);
}

// Find from Local Storage
function findInLocal(key){
  data = sessionStorage.getItem(key);
  if(data){
    // console.log(data)
    return data;
  }else{
    outputEmpty();
    requestMedia(key);
  }
}

function notTyping(){
  console.log("Not Typing");
  clearTimeout(timeout)
  typing = false;
  socket.emit('typing', {host, username, typing, room});
}

function getBase64(file) {
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function () {
    var data = {
      "host": host,
      "filename": file.name,
      "data": reader.result
    };
    socket.emit("chatImage", data);
  };
  reader.onerror = function (error) {
    console.log('Error: ', error);
  };
}

// Upload Image
uploadButton.addEventListener('change', function(){
  if(this.files[0].size > (1024*1024*2)){
      alert("File is too big!");
      this.value = "";
  }else{
    var file = this.files[0];
    console.log(file);
    getBase64(file); // prints the base64 string
    this.value = '';
  }
}, false);

// Message sent
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  notTyping();

  // Emit message to server
  const msg = e.target.elements.msg.value;
  socket.emit('chatMessage', {host, msg});

  // Clear Input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

function detectLink(text){
  var regex = /((https?:)\/\/)?(\\:\\d+)?((www\.)?([A-Za-z]+(\.[A-Za-z]+)+)|((\d{1,3}\.){3}\d{1,3}))(\:)?(\d+)?((\/[\w]+)+)?/g;
  return text.replace(regex, function(link){
    url = link;
    protocol = url.split("//")[0]
    if(protocol != "http:" && protocol != "https:"){
      url = "https://"+url;
    }
    
    return `<a href="${url}" target="_blank">${link}</a>`;
  });
}

// Output message to DOM
function outputMessage(message){
  const outerdiv = document.createElement("div");
  outerdiv.classList.add("outer-message");
  const div = document.createElement("div");

  var result = detectLink(message.text);

  classAdd = (host === message.host) ? "message-mine" : "message";
  div.classList.add(classAdd);
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
  <p class="text">
    ${result}
  </p>`;
  outerdiv.appendChild(div);
  document.querySelector(".message-container").appendChild(outerdiv);
}

// Output notif to DOM
function outputNotif(message){
  const outerdiv = document.createElement("div");
  outerdiv.classList.add("outer-notif");
  const div = document.createElement("div");

  div.classList.add("admin-notification");

  div.innerHTML = `<span>${message.time} - ${message.text}</span></p>`;
  outerdiv.appendChild(div);
  document.querySelector(".message-container").appendChild(outerdiv);
}

// Output Insertion by Index
function outputMessageIndex(message){
  const div = document.evaluate(
    `.//div[@class='message-container']/div[@class='outer-message'][${message.index}]/div`, 
    document,
    null, 
    XPathResult.FIRST_ORDERED_NODE_TYPE, 
    null).singleNodeValue;

  classAdd = (host === message.host) ? "message-mine" : "message";
  div.classList.add(classAdd);

  var mediaType = message.text.data.split(":")[1]
  mediaType = mediaType.split(";")[0];
  mediaType = mediaType.split("/")[0];

  mediaHTML = "";
  switch(mediaType){
    case "video":
      mediaHTML = `<video class="img-msg" src="${message.text.data}" controls></video>`;
    break;
    case "image":
      mediaHTML = `<img class="img-msg" src="${message.text.data}"/>`;
    break;
    case "audio":
      mediaHTML = `<audio src="${message.text.data}" controls></audio>`;
    break;
    default:
      mediaHTML = `<a href="${message.text.data}">${message.text.filename}</a>`;
  }

  div.innerHTML += mediaHTML;
}

// Output Empty Message
function outputEmpty(){
  const outerdiv = document.createElement("div");
  outerdiv.classList.add("outer-message");
  const div = document.createElement("div");

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

  classAdd = (host === message.host) ? "message-mine" : "message";
  div.classList.add(classAdd);
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>`;

  var mediaType = message.text.data.split(":")[1]
  mediaType = mediaType.split(";")[0];
  mediaType = mediaType.split("/")[0];

  mediaHTML = "";
  switch(mediaType){
    case "video":
      mediaHTML = `<video class="img-msg" src="${message.text.data}" controls></video>`;
    break;
    case "image":
      mediaHTML = `<img class="img-msg" src="${message.text.data}"/>`;
    break;
    case "audio":
      mediaHTML = `<audio src="${message.text.data}" controls></audio>`;
    break;
    default:
      mediaHTML = `<a href="${message.text.data}">${message.text.filename}</a>`;
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