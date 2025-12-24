importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Your production config
const firebaseConfig = {
  apiKey: "AIzaSyA6zMvQnsY0gZPl9ciCyI_HeaTYvn3DuTA",
  authDomain: "compliment-app-production.firebaseapp.com",
  projectId: "compliment-app-production",
  storageBucket: "compliment-app-production.firebasestorage.app",
  messagingSenderId: "294989386360",
  appId: "1:294989386360:web:8db856205d65686f79d38d",
  measurementId: "G-4S3YW74X7Q"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
