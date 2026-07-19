importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAhzf7l3xcFx3EdMp5vPkIMke9LV-c_ROI',
  authDomain: 'movento-77ec1.firebaseapp.com',
  projectId: 'movento-77ec1',
  messagingSenderId: '124211135712',
  appId: '1:124211135712:web:a39a9986834655e5747c85'
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  })
})