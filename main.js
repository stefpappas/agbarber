/* ════════════════════════════════════════════════
   CONFIG  –  fill in after creating your accounts
   ════════════════════════════════════════════════ */

// 1. Get this from formspree.io → New Form → copy the ID part of the URL
const FORMSPREE_ID = 'YOUR_FORMSPREE_ID';

// 2. Get this from console.firebase.google.com → your project → Project settings → Your apps
const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  databaseURL:       'https://YOUR_PROJECT-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

/* ── Firebase init (graceful – site works even if not configured yet) ── */
let db = null;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();
} catch (e) {
  console.warn('Firebase not configured yet:', e.message);
}

async function getBookedSlots(barber, dateStr) {
  if (!db) return {};
  try {
    const snap = await db.ref(`bookings/${barber}/${dateStr}`).get();
    return snap.exists() ? snap.val() : {};
  } catch (e) {
    console.warn('Could not read slots:', e);
    return {};
  }
}

async function saveBooking(barber, dateStr, timeStr, details) {
  if (!db) return;
  try {
    await db.ref(`bookings/${barber}/${dateStr}/${timeStr}`).set({
      booked: true,
      name: details.name,
      phone: details.phone,
      service: details.service,
      timestamp: Date.now(),
    });
  } catch (e) {
    console.warn('Could not save booking:', e);
  }
}

/* ════════════════════════════════════════════════
   Gallery Lightbox
   ════════════════════════════════════════════════ */
(function () {
  const items    = Array.from(document.querySelectorAll('.gallery__item'));
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
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') close();
  });
  let touchX = 0;
  lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
  }, { passive: true });
})();

/* ════════════════════════════════════════════════
   Nav
   ════════════════════════════════════════════════ */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

const burger     = document.getElementById('burger');
const mobileMenu = document.getElementById('mobileMenu');
burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
mobileMenu.querySelectorAll('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ════════════════════════════════════════════════
   Booking form
   ════════════════════════════════════════════════ */
const dateInput  = document.getElementById('date');
const timeSelect = document.getElementById('time');
const barberSelect = document.getElementById('barber');

/* Prevent past dates */
const today = new Date();
dateInput.min = today.toISOString().split('T')[0];

const ALL_SLOTS = [
  '11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30',
  '17:00','17:30','18:00','18:30',
];

function needsRefresh() {
  return dateInput.value && barberSelect.value;
}

async function refreshTimeSlots() {
  if (!needsRefresh()) return;

  const dateStr  = dateInput.value;
  const barber   = barberSelect.value;
  const selected = new Date(dateStr + 'T00:00:00');
  const day      = selected.getDay();

  /* Block Monday (1) and Sunday (0) */
  if (day === 0 || day === 1) {
    const label = day === 0 ? 'Κυριακή' : 'Δευτέρα';
    timeSelect.innerHTML = `<option value="" disabled selected>Κλειστά ${label}</option>`;
    return;
  }

  timeSelect.innerHTML = '<option value="" disabled selected>Φόρτωση…</option>';
  timeSelect.disabled = true;

  const booked = await getBookedSlots(barber, dateStr);

  timeSelect.innerHTML = '<option value="" disabled selected>Επιλέξτε ώρα…</option>';
  ALL_SLOTS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    if (booked[t]) {
      opt.textContent = `${t} – Μη διαθέσιμο`;
      opt.disabled = true;
      opt.classList.add('slot--booked');
    } else {
      opt.textContent = t;
    }
    timeSelect.appendChild(opt);
  });
  timeSelect.disabled = false;
}

dateInput.addEventListener('change', () => {
  const selected = new Date(dateInput.value + 'T00:00:00');
  const day = selected.getDay();
  if (day === 0 || day === 1) {
    dateInput.setCustomValidity(`Κλειστά ${day === 0 ? 'Κυριακή' : 'Δευτέρα'}. Επιλέξτε Τρίτη έως Σάββατο.`);
    dateInput.reportValidity();
  } else {
    dateInput.setCustomValidity('');
  }
  refreshTimeSlots();
});

barberSelect.addEventListener('change', refreshTimeSlots);

/* ── Form submit: email via Formspree + save slot to Firebase ── */
const form       = document.getElementById('bookingForm');
const successMsg = document.getElementById('formSuccess');

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const submitBtn  = form.querySelector('[type="submit"]');
  const origLabel  = submitBtn.textContent;
  submitBtn.textContent = 'Αποστολή…';
  submitBtn.disabled = true;

  const barber  = document.getElementById('barber').value;
  const dateVal = dateInput.value;
  const timeVal = timeSelect.value;
  const nameVal = document.getElementById('name').value;
  const phoneVal = document.getElementById('phone').value;
  const serviceVal = document.getElementById('service').value;

  try {
    /* Send email via Formspree */
    if (FORMSPREE_ID !== 'YOUR_FORMSPREE_ID') {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Formspree error');
    }

    /* Lock the slot in Firebase */
    await saveBooking(barber, dateVal, timeVal, {
      name: nameVal,
      phone: phoneVal,
      service: serviceVal,
    });

    /* Success */
    submitBtn.style.display = 'none';
    successMsg.classList.add('visible');
    form.querySelectorAll('.form__input').forEach(el => { el.disabled = true; });

  } catch (err) {
    console.error(err);
    submitBtn.textContent = origLabel;
    submitBtn.disabled = false;
    alert('Παρουσιάστηκε σφάλμα. Παρακαλώ δοκιμάστε ξανά ή τηλεφωνήστε μας στο 2741 400498.');
  }
});

/* ════════════════════════════════════════════════
   Smooth scroll
   ════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
  });
});

/* ════════════════════════════════════════════════
   Scroll fade-in
   ════════════════════════════════════════════════ */
const fadeObserver = new IntersectionObserver(
  entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); fadeObserver.unobserve(entry.target); }
  }),
  { threshold: 0.1 }
);
document.querySelectorAll('.section').forEach(s => {
  s.classList.add('fade-section');
  fadeObserver.observe(s);
});
const style = document.createElement('style');
style.textContent = `
  .fade-section { opacity:0; transform:translateY(28px); transition:opacity .7s ease,transform .7s ease; }
  .fade-section.in-view { opacity:1; transform:none; }
  option.slot--booked { color: #666; }
`;
document.head.appendChild(style);
