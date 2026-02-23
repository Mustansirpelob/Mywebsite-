const progressBar = document.querySelector('.scroll-progress');
const parallaxElements = document.querySelectorAll('.parallax');

function updateScrollEffects() {
  if (!progressBar) return;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollY = window.scrollY;
  const progress = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;
  progressBar.style.width = `${progress}%`;

  parallaxElements.forEach((element) => {
    const speed = Number(element.dataset.parallax || 0);
    element.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
  });
}

function markSessionInNav() {
  const sessionRaw = localStorage.getItem('zenithSession');
  if (!sessionRaw) return;

  try {
    const session = JSON.parse(sessionRaw);
    const nav = document.querySelector('.site-header nav');
    if (!nav || !session?.email) return;

    const badge = document.createElement('span');
    badge.className = 'session-badge';
    badge.textContent = session.email;
    nav.appendChild(badge);
  } catch {
    localStorage.removeItem('zenithSession');
  }
}

async function loadAnnouncement() {
  const banner = document.getElementById('announcement');
  if (!banner) return;

  const endpoints = ['', 'http://127.0.0.1:4173', 'http://localhost:4173'];
  for (const base of endpoints) {
    try {
      const response = await fetch(`${base}/api/settings`);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.announcement) {
        banner.hidden = false;
        banner.textContent = data.announcement;
      }
      return;
    } catch {
      // next
    }
  }
}

function showOwnerEditButton() {
  const link = document.getElementById('owner-edit-link');
  if (!link) return;
  if (localStorage.getItem('zenithOwnerToken')) link.hidden = false;
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
window.addEventListener('resize', updateScrollEffects);
window.addEventListener('load', () => {
  updateScrollEffects();
  markSessionInNav();
  loadAnnouncement();
  showOwnerEditButton();
});
