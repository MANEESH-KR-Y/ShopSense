// Scripts for firebase messaging service worker

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyD9AGlS72t1aVBvHuGLgjDixfVtXtwUjz8',
  authDomain: 'shopsense-aab8d.firebaseapp.com',
  projectId: 'shopsense-aab8d',
  storageBucket: 'shopsense-aab8d.firebasestorage.app',
  messagingSenderId: '357808857360',
  appId: '1:357808857360:web:7e3568b8822ba912178595',
  measurementId: 'G-V8ERQX6Q3B',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
