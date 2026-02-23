const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const statusText = document.getElementById('model-status-text');

const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
let history = [];

async function requestApi(path, options = {}) {
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base}${path}`, options);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }
  throw new Error('API unavailable');
}

function bubble(sender, text, className = '') {
  const line = document.createElement('div');
  line.className = `bubble ${className}`.trim();
  line.innerHTML = `<strong>${sender}</strong><p>${text}</p>`;
  chatLog.appendChild(line);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function syncMessages() {
  try {
    const data = await requestApi('/api/messages');
    chatLog.innerHTML = '';
    (data.messages || []).forEach((m) => bubble(m.sender, m.text, m.sender === 'Client' ? 'user' : 'bot'));
  } catch {
    bubble('System', 'Server not reachable. Start python3 server.py and open from http://127.0.0.1:4173/chat.html', 'bot');
  }
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';

  await requestApi('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'Client', text }),
  });

  statusText.textContent = 'Model Status: Thinking';
  bubble('Zenith AI', '...', 'bot typing');

  const data = await requestApi('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, history }),
  });

  history.push({ role: 'user', content: text }, { role: 'assistant', content: data.reply || '' });
  statusText.textContent = `Model Status: ${data.status || 'Online'}`;

  await requestApi('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'Zenith AI', text: data.reply || 'Thanks, our team will follow up.' }),
  });

  await syncMessages();
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendMessage();
});

syncMessages();
setInterval(syncMessages, 3500);

codex/design-zenith-lab-portfolio-3bmkjo
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

 main

