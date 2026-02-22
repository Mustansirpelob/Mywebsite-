const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const promptWrap = document.getElementById('quick-prompts');

const storageKey = 'zenithChatMessages';

const starterMessages = [
  { who: 'Zenith Bot', text: 'Welcome! Tell me about your project goals.' },
  { who: 'Client', text: 'Need a hybrid web + game prototype by next sprint.' }
];

function renderMessages(messages) {
  chatLog.innerHTML = '';
  messages.forEach((message) => {
    const line = document.createElement('p');
    line.textContent = `${message.who}: ${message.text}`;
    chatLog.appendChild(line);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function readMessages() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return [...starterMessages];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [...starterMessages];
  } catch {
    return [...starterMessages];
  }
}

function persistMessages(messages) {
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function autoReply(text) {
  if (text.toLowerCase().includes('invoice')) return 'Invoice summary: 2 paid, 1 pending review.';
  if (text.toLowerCase().includes('milestone')) return 'Milestone health: Discovery ✅, Prototype ✅, Build in progress.';
  return 'Acknowledged. I can package this note into your weekly progress digest.';
}

function submitMessage(text) {
  if (!text.trim()) return;

  const messages = readMessages();
  messages.push({ who: 'You', text: text.trim() });
  messages.push({ who: 'Zenith Bot', text: autoReply(text) });
  persistMessages(messages);
  renderMessages(messages);
  chatInput.value = '';
}

sendBtn.addEventListener('click', () => submitMessage(chatInput.value));
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitMessage(chatInput.value);
});

promptWrap.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => submitMessage(button.dataset.prompt || ''));
});

clearBtn.addEventListener('click', () => {
  persistMessages([...starterMessages]);
  renderMessages(readMessages());
});

exportBtn.addEventListener('click', () => {
  const messages = readMessages();
  const payload = messages.map((message) => `${message.who}: ${message.text}`).join('\n');
  const blob = new Blob([payload], { type: 'text/plain' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'zenith-chat-transcript.txt';
  anchor.click();
  URL.revokeObjectURL(href);
});

renderMessages(readMessages());
