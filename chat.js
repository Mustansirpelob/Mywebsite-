const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const starterMessages = [
  'Zenith Bot: Welcome! Tell me about your project goals.',
  'Client: Need a hybrid web + game prototype by next sprint.'
];

function renderMessage(message) {
  const line = document.createElement('p');
  line.textContent = message;
  chatLog.appendChild(line);
}

starterMessages.forEach(renderMessage);

sendBtn.addEventListener('click', () => {
  const text = chatInput.value.trim();
  if (!text) return;
  renderMessage(`You: ${text}`);
  chatInput.value = '';
});
