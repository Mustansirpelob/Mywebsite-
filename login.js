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
