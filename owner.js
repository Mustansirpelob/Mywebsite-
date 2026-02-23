const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
const loginForm = document.getElementById('owner-login-form');
const statusLine = document.getElementById('owner-status');
const ownerConsole = document.getElementById('owner-console');
const ownerReply = document.getElementById('owner-reply');
const ownerSend = document.getElementById('owner-send');
const questionInput = document.getElementById('owner-question');
const answerInput = document.getElementById('owner-answer');
const ownerTeach = document.getElementById('owner-teach');
const knowledgeList = document.getElementById('knowledge-list');
const announcementInput = document.getElementById('announcement-input');
const saveAnnouncement = document.getElementById('save-announcement');
const chatLog = document.getElementById('owner-chat-log');
const logoutBtn = document.getElementById('owner-logout');
let ownerPoll;

function getToken() {
  return localStorage.getItem('zenithOwnerToken') || '';
}

function setToken(token) {
  localStorage.setItem('zenithOwnerToken', token);
}

function clearToken() {
  localStorage.removeItem('zenithOwnerToken');
}

async function api(path, method = 'GET', payload, requireAuth = false) {
  for (const base of apiCandidates) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (requireAuth && getToken()) headers.Authorization = `Bearer ${getToken()}`;

      const response = await fetch(`${base}${path}`, {
        method,
        headers,
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
  const data = await api('/api/messages', 'GET', null, true);
  renderChat(data.messages || []);
}

async function refreshKnowledge() {
  const data = await api('/api/knowledge', 'GET', null, true);
  knowledgeList.innerHTML = '';
  (data.items || []).forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${item.question}</strong><br><span>${item.answer}</span> <button class="mini-button" data-id="${item.id}">Delete</button>`;
    knowledgeList.appendChild(li);
  });

  knowledgeList.querySelectorAll('button[data-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api(`/api/knowledge?id=${button.dataset.id}`, 'DELETE', null, true);
      refreshKnowledge();
    });
  });
}

async function refreshAnnouncement() {
  const data = await api('/api/settings', 'GET', null, true);
  announcementInput.value = data.announcement || '';
}

function setOwnerView(isOwner) {
  ownerConsole.hidden = !isOwner;
  loginForm.hidden = isOwner;
  statusLine.textContent = isOwner ? 'Owner authenticated. Edit mode enabled.' : 'Owner not authenticated.';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('owner-email').value.trim();
  const password = document.getElementById('owner-password').value;

  try {
    const data = await api('/api/owner/login', 'POST', { email, password });
    if (!data.token) throw new Error('no token');
    setToken(data.token);
    setOwnerView(true);
    await Promise.all([refreshChat(), refreshKnowledge(), refreshAnnouncement()]);
    ownerPoll = setInterval(refreshChat, 3000);
  } catch {
    statusLine.textContent = 'Owner login failed. Check Gmail and password.';
  }
});

ownerSend.addEventListener('click', async () => {
  const text = ownerReply.value.trim();
  if (!text) return;
  await api('/api/messages', 'POST', { sender: 'Owner', text }, true);
  ownerReply.value = '';
  refreshChat();
});

ownerTeach.addEventListener('click', async () => {
  const question = questionInput.value.trim();
  const answer = answerInput.value.trim();
  if (!question || !answer) return;
  await api('/api/teach', 'POST', { question, answer }, true);
  questionInput.value = '';
  answerInput.value = '';
  refreshKnowledge();
});

saveAnnouncement.addEventListener('click', async () => {
  await api('/api/settings', 'POST', { announcement: announcementInput.value.trim() }, true);
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  if (ownerPoll) clearInterval(ownerPoll);
  setOwnerView(false);
});

(async function boot() {
  if (!getToken()) {
    setOwnerView(false);
    return;
  }

  try {
    await api('/api/owner/verify', 'GET', null, true);
    setOwnerView(true);
    await Promise.all([refreshChat(), refreshKnowledge(), refreshAnnouncement()]);
    ownerPoll = setInterval(refreshChat, 3000);
    setInterval(refreshChat, 3000);
  } catch {
    clearToken();
    setOwnerView(false);
  }
})();
