const progressBar = document.querySelector('.scroll-progress');
const parallaxElements = document.querySelectorAll('.parallax');

function updateScrollEffects() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollY = window.scrollY;
  const progress = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0;

  progressBar.style.width = `${progress}%`;

  parallaxElements.forEach((element) => {
    const speed = Number(element.dataset.parallax || 0);
    const offset = scrollY * speed;
    element.style.transform = `translate3d(0, ${offset}px, 0)`;
  });
}

window.addEventListener('scroll', updateScrollEffects, { passive: true });
window.addEventListener('resize', updateScrollEffects);
window.addEventListener('load', updateScrollEffects);
