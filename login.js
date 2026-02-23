
const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const statusLine = document.getElementById('login-status');

async function fetchFirst(path, options) {
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base}${path}`, options);
      const data = await res.json();
      if (res.ok) return data;
      throw new Error(data.error || 'Request failed');
    } catch (err) {
      if (base === apiCandidates[apiCandidates.length - 1]) throw err;
    }
  }
  throw new Error('API unavailable');
}

function showToast(message, ok = true) {
  statusLine.textContent = message;
  statusLine.classList.toggle('error', !ok);
}

document.getElementById('show-login').addEventListener('click', () => {
  loginForm.hidden = false;
  registerForm.hidden = true;
});

document.getElementById('show-register').addEventListener('click', () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
});

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const data = await fetchFirst('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    showToast(data.message || 'Account created.', true);
  } catch (error) {
    showToast(error.message, false);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const data = await fetchFirst('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('zenithToken', data.token);
    showToast(`Welcome ${data.user.email}. Redirecting...`, true);
    window.setTimeout(() => {
      window.location.href = data.user.role === 'owner' ? 'owner.html' : 'index.html';
    }, 700);
  } catch (error) {
    showToast(error.message, false);
  }
});

const loginForm = document.getElementById('login-form');
const statusLine = document.getElementById('login-status');

const sessionPanel = document.getElementById('session-panel');
const sessionSummary = document.getElementById('session-summary');
const logoutBtn = document.getElementById('logout-btn');


function isValidPassword(value) {
  return value.length >= 8;
}


function getSession() {
  const raw = localStorage.getItem('zenithSession');
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (!session.expiresAt || Date.now() > Number(session.expiresAt)) {
      localStorage.removeItem('zenithSession');
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function refreshSessionUI() {
  const session = getSession();
  const signedIn = Boolean(session?.email);

  sessionPanel.hidden = !signedIn;
  loginForm.hidden = signedIn;

  if (!signedIn) {
    statusLine.textContent = 'Not authenticated.';
    return;
  }

  const expiresDate = new Date(Number(session.expiresAt));
  sessionSummary.textContent = `${session.email} · Expires ${expiresDate.toLocaleString()}`;
  statusLine.textContent = `Authenticated as ${session.email}.`;
}


loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  const remember = document.getElementById('remember').checked;


  if (!email || !isValidPassword(password)) {
    statusLine.textContent = 'Login failed: enter a valid email and at least 8 characters for password.';
    return;
  }


  const expiryHours = remember ? 24 * 14 : 12;
  const session = {
    email,
    loggedInAt: new Date().toISOString(),
    expiresAt: Date.now() + expiryHours * 60 * 60 * 1000

  const session = {
    email,
    loggedInAt: new Date().toISOString()

  };

  localStorage.setItem('zenithSession', JSON.stringify(session));
  statusLine.textContent = `Authenticated as ${email}. Redirecting to chat workspace...`;

  setTimeout(() => {
    window.location.href = 'chat.html';

  }, 800);
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('zenithSession');
  refreshSessionUI();
});

refreshSessionUI();

  }, 900);
});



