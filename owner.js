const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
const chatLog = document.getElementById('owner-chat-log');
const ownerReply = document.getElementById('owner-reply');
const ownerSend = document.getElementById('owner-send');
const questionInput = document.getElementById('owner-question');
const answerInput = document.getElementById('owner-answer');
const ownerTeach = document.getElementById('owner-teach');
const knowledgeList = document.getElementById('knowledge-list');
const announcementInput = document.getElementById('announcement-input');
const saveAnnouncement = document.getElementById('save-announcement');

async function api(path, method = 'GET', payload) {
  for (const base of apiCandidates) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // continue
    }
  }
  throw new Error('api unavailable');
}

function renderChat(messages) {
  chatLog.innerHTML = '';
  messages.forEach((message) => {
    const p = document.createElement('p');
    p.textContent = `${message.sender}: ${message.text}`;
    chatLog.appendChild(p);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function refreshChat() {
  const data = await api('/api/messages');
  renderChat(data.messages || []);
}

async function refreshKnowledge() {
  const data = await api('/api/knowledge');
  knowledgeList.innerHTML = '';
  (data.items || []).forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.question}</strong><br><span>${item.answer}</span> <button class="mini-button" data-id="${item.id}">Delete</button>`;
    knowledgeList.appendChild(li);
  });

  knowledgeList.querySelectorAll('button[data-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/api/knowledge?id=${button.dataset.id}`, 'DELETE');
      refreshKnowledge();
    });
  });
}

async function refreshAnnouncement() {
  const data = await api('/api/settings');
  announcementInput.value = data.announcement || '';
}

ownerSend.addEventListener('click', async () => {
  const text = ownerReply.value.trim();
  if (!text) return;
  await api('/api/messages', 'POST', { sender: 'Owner', text });
  ownerReply.value = '';
  refreshChat();
});

ownerTeach.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  if (!question || !answer) return;
  await api('/api/teach', 'POST', { question, answer });
  questionInput.value = '';
  answerInput.value = '';
  refreshKnowledge();
});

saveAnnouncement.addEventListener('click', async () => {
  await api('/api/settings', 'POST', { announcement: announcementInput.value.trim() });
});

refreshChat();
refreshKnowledge();
refreshAnnouncement();
setInterval(refreshChat, 3000);
