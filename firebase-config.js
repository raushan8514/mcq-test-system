// Firebase Configuration
// Replace the values below with your Firebase project configuration
// Get these from Firebase Console > Project Settings > General > Your apps

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_PROJECT_ID.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };

const firebaseConfig = {
  apiKey: "AIzaSyDDYOLAqrH6sZT-nlTO6jeOHOoUZDVy694",
  authDomain: "mcq-tes-system.firebaseapp.com",
  projectId: "mcq-tes-system",
  storageBucket: "mcq-tes-system.firebasestorage.app",
  messagingSenderId: "41793736328",
  appId: "1:41793736328:web:94016a6a5d9f157ef6d93d",
  measurementId: "G-4745WT7P67"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Enable persistence (optional - for offline support)
db.enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('Current browser does not support persistence.');
    }
  });