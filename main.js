/* ── Gallery Lightbox ── */
(function () {
  const items   = Array.from(document.querySelectorAll('.gallery__item'));
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightboxImg');
  const lbClose  = document.getElementById('lightboxClose');
  const lbPrev   = document.getElementById('lightboxPrev');
  const lbNext   = document.getElementById('lightboxNext');
  let current = 0;

  function open(index) {
    current = index;
    const img = items[current].querySelector('img');
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function prev() { open((current - 1 + items.length) % items.length); }
  function next() { open((current + 1) % items.length); }

  items.forEach((item, i) => {
    item.addEventListener('click', () => open(i));
    item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(i); });
  });

  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', prev);
  lbNext.addEventListener('click', next);

  lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape')     close();
  });

  /* Touch swipe inside lightbox */
  let touchX = 0;
  lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
  }, { passive: true });
})();

/* ── Nav scroll effect ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ── Mobile burger ── */
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');

burger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ── Date input: disable past dates, Mondays & Sundays ── */
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInput.min = `${yyyy}-${mm}-${dd}`;

/* Open Tue–Sat 11:00–18:30 (last slot before closing at 19:00) */
const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30',
];

function buildTimeSlots() {
  timeSelect.innerHTML = '<option value="" disabled selected>Επιλέξτε ώρα…</option>';
  timeSlots.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeSelect.appendChild(opt);
  });
}

dateInput.addEventListener('change', () => {
  const selected = new Date(dateInput.value + 'T00:00:00');
  const day = selected.getDay();

  /* 0 = Sunday, 1 = Monday — both closed */
  if (day === 0 || day === 1) {
    const label = day === 0 ? 'Κυριακή' : 'Δευτέρα';
    dateInput.setCustomValidity(`Κλειστά ${label}. Επιλέξτε Τρίτη έως Σάββατο.`);
    dateInput.reportValidity();
    timeSelect.innerHTML = `<option value="" disabled selected>Κλειστά ${label}</option>`;
    return;
  }

  dateInput.setCustomValidity('');
  buildTimeSlots();
});

/* ── Booking form submit ── */
const form = document.getElementById('bookingForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const submitBtn = form.querySelector('[type="submit"]');
  submitBtn.textContent = 'Αποστολή…';
  submitBtn.disabled = true;

  /* Simulate async submission */
  setTimeout(() => {
    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
    form.querySelectorAll('.form__input').forEach(el => { el.disabled = true; });
  }, 900);
});

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ── Intersection Observer: fade-in sections ── */
const observer = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }
  }),
  { threshold: 0.1 }
);

document.querySelectorAll('.section').forEach(s => {
  s.classList.add('fade-section');
  observer.observe(s);
});

const style = document.createElement('style');
style.textContent = `
  .fade-section { opacity: 0; transform: translateY(28px); transition: opacity .7s ease, transform .7s ease; }
  .fade-section.in-view { opacity: 1; transform: none; }
`;
document.head.appendChild(style);
