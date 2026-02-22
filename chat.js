const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const exportBtn = document.getElementById('export-btn');
const promptWrap = document.getElementById('quick-prompts');
const teachQuestion = document.getElementById('teach-question');
const teachAnswer = document.getElementById('teach-answer');
const teachBtn = document.getElementById('teach-btn');

const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
let pollHandle;

async function postToApi(path, payload) {
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }
  throw new Error('api unreachable');
}

async function getFromApi(path) {
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base}${path}`);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // try next
    }
  }
  throw new Error('api unreachable');
}

function renderMessages(messages) {
  chatLog.innerHTML = '';
  messages.forEach((message) => {
    const line = document.createElement('p');
    line.textContent = `${message.sender}: ${message.text}`;
    chatLog.appendChild(line);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function refreshMessages() {
  try {
    const data = await getFromApi('/api/messages');
    renderMessages(data.messages || []);
  } catch {
    renderMessages([{ sender: 'Zenith Bot', text: 'Server offline. Open http://127.0.0.1:4173/chat.html after starting python3 server.py.' }]);
  }
}

async function getAiReply(text) {
  try {
    const data = await postToApi('/api/chat', { message: text });
    return data.reply || 'I could not generate a response right now.';
  } catch {
    return 'AI server unavailable. Open http://127.0.0.1:4173/chat.html after starting python3 server.py.';
  }
}

async function submitMessage(text) {
  const clean = text.trim();
  if (!clean) return;

  await postToApi('/api/messages', { sender: 'Client', text: clean });
  chatInput.value = '';
  await refreshMessages();

  const reply = await getAiReply(clean);
  await postToApi('/api/messages', { sender: 'Zenith Mini AI', text: reply });
  await refreshMessages();
}

sendBtn.addEventListener('click', () => submitMessage(chatInput.value));
chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitMessage(chatInput.value);
});

promptWrap.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => submitMessage(button.dataset.prompt || ''));
});

clearBtn.addEventListener('click', async () => {
  await postToApi('/api/messages', { sender: 'System', text: '--- Chat cleared by client ---' });
  await refreshMessages();
});

teachBtn.addEventListener('click', async () => {
  const question = teachQuestion.value.trim();
  const answer = teachAnswer.value.trim();
  if (!question || !answer) return;

  try {
    await postToApi('/api/teach', { question, answer });
    teachQuestion.value = '';
    teachAnswer.value = '';
    await postToApi('/api/messages', { sender: 'Zenith Bot', text: 'Thanks. I learned a new response.' });
    await refreshMessages();
  } catch {
    await postToApi('/api/messages', { sender: 'Zenith Bot', text: 'Could not reach teaching endpoint.' });
    await refreshMessages();
  }
});

exportBtn.addEventListener('click', async () => {
  const data = await getFromApi('/api/messages');
  const payload = (data.messages || []).map((m) => `${m.sender}: ${m.text}`).join('\n');
  const blob = new Blob([payload], { type: 'text/plain' });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = 'zenith-chat-transcript.txt';
  anchor.click();
  URL.revokeObjectURL(href);
});

refreshMessages();
pollHandle = setInterval(refreshMessages, 3000);
window.addEventListener('beforeunload', () => clearInterval(pollHandle));
