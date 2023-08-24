const socket = io();
const userNameInput = document.getElementById('user-name');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.querySelector('.messages');
const onlineUsersList = document.querySelector('.online-users');

let isNameEntered = false;
const remData = {};

function updateUserNameDisplay(userName) {
  document.getElementById('user-name-display').textContent = userName;
}

function displayErrorMessage(elementId, message) {
  document.getElementById(elementId).textContent = message;
}

function clearErrorMessage(elementId) {
  document.getElementById(elementId).textContent = '';
}

userNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const userName = userNameInput.value.trim();
    if (userName !== '') {
      updateUserNameDisplay(userName);

      // Remove cursor focus from the input
      userNameInput.blur();
      clearErrorMessage('user-name-error');

      // Emit 'user connected' event to the server
      socket.emit('user connected', userName);
      userNameInput.disabled = true; 
      isNameEntered = true;
    } else {
      displayErrorMessage('user-name-error', 'Please enter a name');
    }
  }
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    const userName = userNameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (message === '' && userName === '') {
      displayErrorMessage('message-error', 'Please type a message');
      displayErrorMessage('user-name-error', 'Please enter a name');
    } else if (message === '') {
      displayErrorMessage('message-error', 'Please type a message');
    } else {
      clearErrorMessage('message-error');
      sendMessage();
    }
  }
});

function sendMessage() {
  const userName = userNameInput.value.trim();
  const message = messageInput.value.trim();
  let formattedMessage = message;

  const emojis = {
    react: "⚛️",
    woah: "😲",
    hey: "👋",
    lol: "😂",
    like: "🤍",
    congratulations: "🎉",
  };

  if (userName === '') {
    displayErrorMessage('user-name-error', 'Please enter a name');
    return;
  } else {
    clearErrorMessage('user-name-error');
  }

  if (message === '') {
    displayErrorMessage('message-error', 'Please type a message');
    return;
  } else {
    clearErrorMessage('message-error');
  }

  // Check for special commands
  if (message.startsWith('/')) {
    const command = message.slice(1); // Remove the slash '/'
    const commandParts = command.split(' ');

    if (command === 'help') {
      const helpMessage = "Available commands:\n" +
        "/alert - Show this message\n" +
        "/random - Print a random number\n" +
        "/clear - Clear the chat";
      alert(helpMessage);
      messageInput.value = '';
      return;
    } else if (command === 'random') {
      const randomNumber = Math.random() * 1000;
      formattedMessage = `Here's your random number: ${randomNumber}`;
    } else if (command === 'clear') {
      messagesContainer.innerHTML = '';
      messageInput.value = '';
      return;
    } else if (commandParts[0] === 'rem') {
      let formattedMessage = null;
    
      if (commandParts.length >= 3) {
        const remName = commandParts[1];
        const remValue = commandParts.slice(2).join(' '); // Combine the rest of the parts as value   
        remData[remName] = remValue;
        formattedMessage = `Added value for ${remName} as ${remValue}`;
      } else if (commandParts.length === 2) {
        const remName = commandParts[1];
        if (remData.hasOwnProperty(remName)) {
          formattedMessage = `Value for ${remName} is ${remData[remName]}`;
        } else {
          formattedMessage = `No value has been added for ${remName}`;
        }
      } else if (commandParts.length === 1) {
          formattedMessage = "Give complete command with name and value";
      } else {
        formattedMessage = "Invalid /rem command format";
      }
      
      messageInput.value = '';
      // Display the formattedMessage in the chat
      const messageElement = document.createElement('div');
      messageElement.innerHTML = formattedMessage;
      messageElement.classList.add('message', 'sent'); // Add classes
      messagesContainer.appendChild(messageElement);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }    
  } else {
    // Check for each emoji keyword in the message
    for (const keyword in emojis) {
      if (message.toLowerCase().includes(keyword)) {
        // Replace the keyword with the emoji
        formattedMessage = formattedMessage.replace(
          new RegExp(keyword, 'gi'), // 'gi' for global and case-insensitive search
          emojis[keyword]
        );
      }
    }
  }

  updateUserNameDisplay(userName);

  if (!message.startsWith('/random')) {
    const command = message.slice(1); // Remove the slash '/'
    if (!command.startsWith('rem')) {
      // Send regular chat message
      socket.emit('chat message', userName + ': ' + formattedMessage);
    }
  } else {
    // Display locally without sending to server
    const messageElement = document.createElement('div');
    messageElement.innerHTML = formattedMessage;
    messageElement.classList.add('message', 'sent'); // Add classes
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  messageInput.value = '';
  messageInput.blur();
}

function updateOnlineUserCount(count) {
  const onlineCountElement = document.querySelector('.online-count');
  onlineCountElement.textContent = `( ${count} )`;
}

sendButton.addEventListener('click', sendMessage);

socket.on('chat message', (msg) => {
  const messageElement = document.createElement('div');

  const formattedMessage = msg.replace(/(.*?):/, '<b>$1:</b>'); // Wrap userName in <b> element
  messageElement.innerHTML = formattedMessage;

  if (msg.startsWith(userNameInput.value.trim() + ': ')) {
    messageElement.classList.add('message', 'sent');
  } else {
    messageElement.classList.add('message', 'received');
  }

  messagesContainer.appendChild(messageElement);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

socket.on('user connected', (onlineUsers) => {
  updateOnlineUserCount(onlineUsers.length);
  onlineUsersList.innerHTML = ''; // Clear the list before adding updated users
  onlineUsers.forEach((userName) => {
    const userItem = document.createElement('li');
    userItem.textContent = userName;
    onlineUsersList.appendChild(userItem);
  });
});

socket.on('user disconnected', (userName) => {
  updateOnlineUserCount(onlineUsers.length);
  const userItems = onlineUsersList.getElementsByTagName('li');
  for (const userItem of userItems) {
    if (userItem.textContent === userName) {
      userItem.remove();
      break;
    }
  }
});