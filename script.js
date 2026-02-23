const progressBar = document.querySelector('.scroll-progress');
const reveals = document.querySelectorAll('.reveal');
const particlesEl = document.getElementById('particles');

const apiCandidates = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];

function updateScrollProgress() {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${progress}%`;
}

function revealOnScroll() {
  const trigger = window.innerHeight * 0.9;
  reveals.forEach((element) => {
    if (element.getBoundingClientRect().top < trigger) element.classList.add('is-visible');
  });
}

function createParticles() {
  if (!particlesEl) return;
  particlesEl.innerHTML = '';
  for (let i = 0; i < 20; i += 1) {
    const particle = document.createElement('span');
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${10 + Math.random() * 16}s`;
    particlesEl.appendChild(particle);
  }
}

async function fetchFirst(path, options) {
  for (const base of apiCandidates) {
    try {
      const response = await fetch(`${base}${path}`, options);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // try next candidate
    }
  }
  return null;
}

function closeProfileMenu() {
  const menu = document.getElementById('profile-menu');
  if (menu) menu.hidden = true;
}

async function syncAuthUI() {
  const authLink = document.getElementById('auth-link');
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  const ownerMenu = document.getElementById('owner-menu-link');
  const ownerNav = document.getElementById('owner-nav-link');
  const logoutBtn = document.getElementById('logout-btn');

  if (!authLink || !profileTrigger || !profileMenu || !logoutBtn) return;

  if (ownerMenu) ownerMenu.hidden = true;
  if (ownerNav) ownerNav.hidden = true;

  const token = localStorage.getItem('zenithToken') || '';
  if (!token) {
    closeProfileMenu();
    return;
  }

  const data = await fetchFirst('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
  if (!data?.authenticated || !data.user) {
    localStorage.removeItem('zenithToken');
    closeProfileMenu();
    return;
  }

  authLink.hidden = true;
  profileTrigger.hidden = false;
  profileTrigger.textContent = data.user.email;
  closeProfileMenu();

  profileTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    profileMenu.hidden = !profileMenu.hidden;
  });

  profileMenu.addEventListener('click', (event) => event.stopPropagation());
  document.addEventListener('click', closeProfileMenu);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeProfileMenu();
  });

  if (data.user.role === 'owner') {
    if (ownerMenu) ownerMenu.hidden = false;
    if (ownerNav) ownerNav.hidden = false;
  }

  logoutBtn.addEventListener('click', async () => {
    await fetchFirst('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    localStorage.removeItem('zenithToken');
    if (ownerMenu) ownerMenu.hidden = true;
    if (ownerNav) ownerNav.hidden = true;
    window.location.reload();
  });
}

async function loadAnnouncement() {
  const banner = document.getElementById('announcement');
  if (!banner) return;

  const data = await fetchFirst('/api/settings');
  if (data?.announcement) {
    banner.hidden = false;
    banner.textContent = data.announcement;
  }
}

window.addEventListener('scroll', () => {
  updateScrollProgress();
  revealOnScroll();
}, { passive: true });

window.addEventListener('load', async () => {
  updateScrollProgress();
  revealOnScroll();
  createParticles();
  await Promise.all([syncAuthUI(), loadAnnouncement()]);
});
