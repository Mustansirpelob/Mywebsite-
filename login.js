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
