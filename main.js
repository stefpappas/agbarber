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

/* ── Date input: disable past dates & Sundays ── */
const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInput.min = `${yyyy}-${mm}-${dd}`;

const slots = {
  weekday: [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30',
  ],
  saturday: [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  ],
};

function buildTimeSlots(day) {
  timeSelect.innerHTML = '<option value="" disabled selected>Επιλέξτε ώρα…</option>';
  const list = day === 6 ? slots.saturday : slots.weekday;
  list.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    timeSelect.appendChild(opt);
  });
}

dateInput.addEventListener('change', () => {
  const selected = new Date(dateInput.value + 'T00:00:00');
  const dayOfWeek = selected.getDay();

  if (dayOfWeek === 0) {
    dateInput.setCustomValidity('Κλειστά Κυριακή. Επιλέξτε άλλη μέρα.');
    dateInput.reportValidity();
    timeSelect.innerHTML = '<option value="" disabled selected>Κλειστά Κυριακή</option>';
    return;
  }

  dateInput.setCustomValidity('');
  buildTimeSlots(dayOfWeek);
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
    form.querySelectorAll('.form__input').forEach(el => {
      el.disabled = true;
    });
  }, 900);
});

/* ── Smooth scroll for anchor links ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 80;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
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
