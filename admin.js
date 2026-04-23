/* ════════════════════════════════════════════════
   CONFIG
   ════════════════════════════════════════════════ */

// Change this to your own password
const ADMIN_PASSWORD = 'agbarber2025';

// Same Firebase config as main.js
const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  databaseURL:       'https://YOUR_PROJECT-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

/* ════════════════════════════════════════════════
   Firebase init
   ════════════════════════════════════════════════ */
let db = null;
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  db = firebase.database();
} catch (e) {
  console.warn('Firebase not configured:', e.message);
}

/* ════════════════════════════════════════════════
   State
   ════════════════════════════════════════════════ */
let allBookings = []; // flat list: { barber, date, time, name, phone, service, timestamp }
let periodFilter = 'today';
let barberFilter = 'all';

/* ════════════════════════════════════════════════
   Auth
   ════════════════════════════════════════════════ */
const loginScreen = document.getElementById('loginScreen');
const dashboard   = document.getElementById('dashboard');
const loginForm   = document.getElementById('loginForm');
const loginError  = document.getElementById('loginError');

function showDashboard() {
  loginScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  loadBookings();
}

function showLogin() {
  sessionStorage.removeItem('agb_admin');
  dashboard.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

/* Check existing session */
if (sessionStorage.getItem('agb_admin') === '1') {
  showDashboard();
}

loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const pw = document.getElementById('password').value;
  if (pw === ADMIN_PASSWORD) {
    sessionStorage.setItem('agb_admin', '1');
    loginError.classList.remove('visible');
    showDashboard();
  } else {
    loginError.classList.add('visible');
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
  }
});

document.getElementById('logout').addEventListener('click', showLogin);

/* ════════════════════════════════════════════════
   Load bookings from Firebase (real-time)
   ════════════════════════════════════════════════ */
function loadBookings() {
  if (!db) {
    document.getElementById('bookingsList').innerHTML =
      '<div class="empty-state"><p>Firebase δεν έχει ρυθμιστεί ακόμα.</p></div>';
    return;
  }

  db.ref('bookings').on('value', snap => {
    allBookings = [];
    if (snap.exists()) {
      snap.forEach(barberSnap => {
        const barber = barberSnap.key;
        barberSnap.forEach(dateSnap => {
          const date = dateSnap.key;
          dateSnap.forEach(timeSnap => {
            const data = timeSnap.val();
            if (data && data.booked) {
              allBookings.push({
                barber,
                date,
                time: timeSnap.key,
                name:      data.name      || '–',
                phone:     data.phone     || '–',
                service:   data.service   || '–',
                timestamp: data.timestamp || 0,
              });
            }
          });
        });
      });
    }
    updateStats();
    renderBookings();
  });
}

/* ════════════════════════════════════════════════
   Stats
   ════════════════════════════════════════════════ */
function updateStats() {
  const todayStr = todayDateStr();
  const weekDates = getWeekDates();

  const todayCount     = allBookings.filter(b => b.date === todayStr).length;
  const weekCount      = allBookings.filter(b => weekDates.includes(b.date)).length;
  const alexCount      = allBookings.filter(b => b.barber === 'Alex').length;
  const francescoCount = allBookings.filter(b => b.barber === 'Francesco').length;

  document.getElementById('statToday').textContent     = todayCount;
  document.getElementById('statWeek').textContent      = weekCount;
  document.getElementById('statAlex').textContent      = alexCount;
  document.getElementById('statFrancesco').textContent = francescoCount;
}

/* ════════════════════════════════════════════════
   Render
   ════════════════════════════════════════════════ */
function renderBookings() {
  const todayStr  = todayDateStr();
  const weekDates = getWeekDates();

  let filtered = allBookings.filter(b => {
    const periodOk =
      periodFilter === 'all'  ? true :
      periodFilter === 'today' ? b.date === todayStr :
      weekDates.includes(b.date);

    const barberOk = barberFilter === 'all' || b.barber === barberFilter;
    return periodOk && barberOk;
  });

  /* Sort: date ASC, time ASC */
  filtered.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  const list      = document.getElementById('bookingsList');
  const emptyState = document.getElementById('emptyState');

  if (filtered.length === 0) {
    list.innerHTML = '';
    list.appendChild(emptyState);
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  /* Group by date */
  const byDate = {};
  filtered.forEach(b => {
    if (!byDate[b.date]) byDate[b.date] = [];
    byDate[b.date].push(b);
  });

  list.innerHTML = '';
  Object.entries(byDate).forEach(([date, bookings]) => {
    const group = document.createElement('div');
    group.className = 'day-group';

    const label = document.createElement('div');
    label.className = 'day-group__label';
    label.textContent = formatDate(date);
    group.appendChild(label);

    const cards = document.createElement('div');
    cards.className = 'day-group__cards';

    bookings.forEach(b => {
      cards.appendChild(buildCard(b));
    });

    group.appendChild(cards);
    list.appendChild(group);
  });
}

function buildCard(b) {
  const card = document.createElement('div');
  card.className = 'booking-card';
  card.innerHTML = `
    <div class="booking-card__time">
      <span class="booking-card__hour">${b.time}</span>
      <span class="booking-card__barber-badge">${b.barber}</span>
    </div>
    <div class="booking-card__name">${escHtml(b.name)}</div>
    <div class="booking-card__details">
      <div class="booking-card__detail">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.12 6.12l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
        ${escHtml(b.phone)}
      </div>
      <div class="booking-card__detail">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${escHtml(b.service)}
      </div>
    </div>
    <button class="booking-card__cancel" data-barber="${b.barber}" data-date="${b.date}" data-time="${b.time}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      Ακύρωση κράτησης
    </button>
  `;

  card.querySelector('.booking-card__cancel').addEventListener('click', () => {
    cancelBooking(b.barber, b.date, b.time, b.name);
  });

  return card;
}

async function cancelBooking(barber, date, time, name) {
  const confirmed = window.confirm(
    `Ακύρωση κράτησης;\n\n${name}\n${barber} · ${formatDate(date)} · ${time}\n\nΗ ώρα θα αποδεσμευτεί αμέσως.`
  );
  if (!confirmed) return;

  try {
    await db.ref(`bookings/${barber}/${date}/${time}`).remove();
    /* Firebase listener will auto-refresh the list */
  } catch (e) {
    alert('Σφάλμα κατά την ακύρωση. Δοκιμάστε ξανά.');
    console.error(e);
  }
}

/* ════════════════════════════════════════════════
   Filters
   ════════════════════════════════════════════════ */
document.querySelectorAll('.filter-btn[data-period]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-period]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    periodFilter = btn.dataset.period;
    renderBookings();
  });
});

document.querySelectorAll('.filter-btn[data-barber]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-barber]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    barberFilter = btn.dataset.barber;
    renderBookings();
  });
});

/* ════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════ */
function todayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
