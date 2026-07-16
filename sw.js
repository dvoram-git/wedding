// sw.js — Service Worker להתראות חתונה
const CACHE = 'wedding-v1';
const STORAGE_KEY = 'aviTal_journal_v1';
const CHECK_INTERVAL = 60000; // בדיקה כל דקה

// ===== INSTALL & ACTIVATE =====
self.addEventListener('install', e => {
  self.skipWaiting();
});


self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ===== הודעות מהדף =====
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_REMINDERS') {
    checkAndNotify(e.data.journal, e.data.nowStr, e.data.fired);
  }
  if (e.data && e.data.type === 'TEST_NOTIF') {
    sendNotif('בדיקה 💍', 'ההתראות עובדות!', '');
  }
});

// ===== שליחת התראה =====
function sendNotif(title, body, time) {
  const options = {
    body: time ? `${time}  —  ${body}` : body,
    icon: 'https://emojicdn.elk.sh/💍?style=twitter',
    badge: 'https://emojicdn.elk.sh/💍?style=twitter',
    tag: 'wedding-' + Date.now(),
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: { time, body }
  };
  return self.registration.showNotification(title, options);
}

// ===== בדיקת תזכורות =====
function checkAndNotify(journal, nowStr, fired) {
  if (!journal) return;
  Object.entries(journal).forEach(([day, tasks]) => {
    if (!Array.isArray(tasks)) return;
    tasks.forEach(task => {
      if (!task.time || task.done) return;
      const key = `${day}-${task.id}-${task.time}`;
      if (task.time === nowStr && !fired.includes(key)) {
        sendNotif(`⏰ תזכורת — יום ${day}`, task.text, task.time);
      }
    });
  });
}

// ===== לחיצה על התראה =====
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // אם הדף פתוח — העבר אליו
      const existing = list.find(c => c.url.includes('wedding') || c.url.includes('אביטל'));
      if (existing) return existing.focus();
      // אחרת פתח חדש
      return clients.openWindow(self.location.origin + '/wedding/');
    })
  );
});
