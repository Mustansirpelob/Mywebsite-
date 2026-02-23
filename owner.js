const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
const statusLine = document.getElementById('owner-status');
const guard = document.getElementById('owner-guard');
const consoleEl = document.getElementById('owner-console');

function token() {
  return localStorage.getItem('zenithToken') || '';
}

async function api(path, method = 'GET', payload) {
  for (const base of apiCandidates) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (error) {
      if (base === apiCandidates[apiCandidates.length - 1]) throw error;
    }
  }
  throw new Error('API unavailable');
}

function toast(message, ok = true) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', !ok);
}

function renderList(target, items, template) {
  target.innerHTML = '';
  if (!items.length) {
    target.innerHTML = '<li class="muted">No entries.</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = template(item);
    target.appendChild(li);
  });
}

async function loadAnalytics() {
  const data = await api('/api/admin/analytics');
  document.getElementById('metric-users').textContent = String(data.total_users ?? 0);
  document.getElementById('metric-messages').textContent = String(data.total_messages ?? 0);
  document.getElementById('metric-knowledge').textContent = String(data.total_knowledge ?? 0);
}

async function loadUsers() {
  const data = await api('/api/admin/users');
  const userList = document.getElementById('user-list');
  renderList(userList, data.users || [], (u) => `${u.email} <em>(${u.role})</em> ${u.role !== 'owner' ? `<button class="button subtle" data-user-id="${u.id}">Delete</button>` : ''}`);

  userList.querySelectorAll('[data-user-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/admin/users?id=${btn.dataset.userId}`, 'DELETE');
      await loadUsers();
      await loadAnalytics();
    });
  });
}

async function loadKnowledge() {
  const data = await api('/api/knowledge');
  const knowledgeList = document.getElementById('knowledge-list');
  renderList(knowledgeList, data.items || [], (item) => `<strong>${item.question}</strong><p>${item.answer}</p><small>${item.source_url || 'manual'}</small> <button class="button subtle" data-know-id="${item.id}">Delete</button>`);

  knowledgeList.querySelectorAll('[data-know-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/knowledge?id=${btn.dataset.knowId}`, 'DELETE');
      await loadKnowledge();
      await loadAnalytics();
    });
  });
}

async function loadSettings() {
  const data = await api('/api/settings');
  document.getElementById('announcement-input').value = data.announcement || '';
}

document.getElementById('owner-teach').addEventListener('click', async () => {
  await api('/api/teach', 'POST', {
    question: document.getElementById('owner-question').value.trim(),
    answer: document.getElementById('owner-answer').value.trim(),
  });
  toast('AI learned a new response.');
  await loadKnowledge();
  await loadAnalytics();
});

document.getElementById('train-url-btn').addEventListener('click', async () => {
  const data = await api('/api/admin/train-url', 'POST', { url: document.getElementById('train-url').value.trim() });
  toast(`Trained from URL: ${data.summary.slice(0, 90)}...`);
  await loadKnowledge();
  await loadAnalytics();
});

document.getElementById('save-announcement').addEventListener('click', async () => {
  await api('/api/settings', 'POST', { announcement: document.getElementById('announcement-input').value.trim() });
  toast('Homepage announcement updated.');
});

document.getElementById('owner-logout').addEventListener('click', async () => {
  await api('/api/auth/logout', 'POST');
  localStorage.removeItem('zenithToken');
  window.location.href = 'login.html';
});

(async function boot() {
  try {
    const session = await api('/api/auth/session');
    if (!session.authenticated || session.user.role !== 'owner') {
      toast('Owner role required.', false);
      guard.hidden = false;
      return;
    }

    guard.hidden = true;
    consoleEl.hidden = false;
    toast(`Authenticated as ${session.user.email}`);

    await Promise.all([loadAnalytics(), loadUsers(), loadKnowledge(), loadSettings()]);
  } catch (error) {
    toast(error.message, false);
  }
})();
