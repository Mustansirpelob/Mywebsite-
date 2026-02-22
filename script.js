
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
    badge.textContent = `${session.email}`;
    nav.appendChild(badge);
  } catch {
    localStorage.removeItem('zenithSession');
  }
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
window.addEventListener('resize', updateScrollEffects);
window.addEventListener('load', () => {
  updateScrollEffects();
  markSessionInNav();
});
