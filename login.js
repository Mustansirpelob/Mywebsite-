const loginForm = document.getElementById('login-form');
const statusLine = document.getElementById('login-status');

function isValidPassword(value) {
  return value.length >= 8;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !isValidPassword(password)) {
    statusLine.textContent = 'Login failed: enter a valid email and at least 8 characters for password.';
    return;
  }

  const session = {
    email,
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem('zenithSession', JSON.stringify(session));
  statusLine.textContent = `Authenticated as ${email}. Redirecting to chat workspace...`;

  setTimeout(() => {
    window.location.href = 'chat.html';
  }, 900);
});

