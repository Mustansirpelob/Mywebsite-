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
  reveals.forEach((el) => {
    if (el.getBoundingClientRect().top < trigger) el.classList.add('is-visible');
  });
}

function createParticles() {
  if (!particlesEl) return;
  for (let i = 0; i < 20; i += 1) {
    const p = document.createElement('span');
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 10}s`;
    p.style.animationDuration = `${10 + Math.random() * 16}s`;
    particlesEl.appendChild(p);
  }
}

async function fetchFirst(path, options) {
  for (const base of apiCandidates) {
    try {
      const res = await fetch(`${base}${path}`, options);
      if (!res.ok) continue;
      return await res.json();
    } catch {
      // next
    }
  }
  return null;
}

async function syncAuthUI() {
  const authLink = document.getElementById('auth-link');
  const profileTrigger = document.getElementById('profile-trigger');
  const profileMenu = document.getElementById('profile-menu');
  const ownerMenu = document.getElementById('owner-menu-link');
  const logoutBtn = document.getElementById('logout-btn');
  if (!authLink || !profileTrigger || !profileMenu || !logoutBtn) return;

  const token = localStorage.getItem('zenithToken') || '';
  if (!token) return;

  const data = await fetchFirst('/api/auth/session', { headers: { Authorization: `Bearer ${token}` } });
  if (!data?.authenticated || !data.user) {
    localStorage.removeItem('zenithToken');
    return;
  }

  authLink.hidden = true;
  profileTrigger.hidden = false;
  profileTrigger.textContent = data.user.email;

  profileTrigger.addEventListener('click', () => {
    profileMenu.hidden = !profileMenu.hidden;
  });

  if (data.user.role === 'owner') ownerMenu.hidden = false;

  logoutBtn.addEventListener('click', async () => {
    await fetchFirst('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    localStorage.removeItem('zenithToken');
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
