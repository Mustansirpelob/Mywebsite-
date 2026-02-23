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
