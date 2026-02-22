const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const promptWrap = document.getElementById('quick-prompts');
const teachQuestion = document.getElementById('teach-question');
const teachAnswer = document.getElementById('teach-answer');
const teachBtn = document.getElementById('teach-btn');

const storageKey = 'zenithChatMessages';

const starterMessages = [
  { who: 'Zenith Bot', text: 'Welcome! Ask me anything project-related. I can also be taught below.' }
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

async function getAiReply(text) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) throw new Error('AI service failed');
    const data = await response.json();
    return data.reply || 'I could not generate a response right now.';
  } catch {
    return 'AI server unavailable. Start `python3 server.py` to enable learning replies.';
  }
}

async function submitMessage(text) {
  if (!text.trim()) return;

  const messages = readMessages();
  messages.push({ who: 'You', text: text.trim() });
  persistMessages(messages);
  renderMessages(messages);
  chatInput.value = '';

  const reply = await getAiReply(text);
  const updated = readMessages();
  updated.push({ who: 'Zenith Mini AI', text: reply });
  persistMessages(updated);
  renderMessages(updated);
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

teachBtn.addEventListener('click', async () => {
  const question = teachQuestion.value.trim();
  const answer = teachAnswer.value.trim();
  if (!question || !answer) return;

  try {
    const response = await fetch('/api/teach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer })
    });

    if (!response.ok) throw new Error('teach failed');

    teachQuestion.value = '';
    teachAnswer.value = '';
    const messages = readMessages();
    messages.push({ who: 'Zenith Bot', text: 'Thanks. I learned a new response.' });
    persistMessages(messages);
    renderMessages(messages);
  } catch {
    const messages = readMessages();
    messages.push({ who: 'Zenith Bot', text: 'Could not reach teaching endpoint. Start python server first.' });
    persistMessages(messages);
    renderMessages(messages);
  }
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
