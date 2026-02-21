const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

const starterMessages = [
  'Zenith Bot: Welcome! Tell me about your project goals.',
  'Client: Need a hybrid web + game prototype by next sprint.'
];

function renderMessage(message) {
  const line = document.createElement('p');
  line.textContent = message;
  chatLog.appendChild(line);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function saveMessages() {
  localStorage.setItem('zenithChat', chatLog.innerHTML);
}

function loadMessages() {
  const stored = localStorage.getItem('zenithChat');
  if (stored) {
    chatLog.innerHTML = stored;
    return;
  }

  starterMessages.forEach(renderMessage);
  saveMessages();
}

sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  renderMessage(`You: ${text}`);
  chatInput.value = '';
  saveMessages();
});

clearBtn.addEventListener('click', () => {
  chatLog.innerHTML = '';
  localStorage.removeItem('zenithChat');
});

loadMessages();
