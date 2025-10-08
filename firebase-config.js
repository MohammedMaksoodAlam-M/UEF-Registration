// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbj2E3yKL8ghBUHIlK8jA6iS8YG4my6mo",
  authDomain: "uef-conference.firebaseapp.com",
  projectId: "uef-conference",
  storageBucket: "uef-conference.firebasestorage.app",
  messagingSenderId: "164648875957",
  appId: "1:164648875957:web:856b78b097540e3ee50bfc",
  measurementId: "G-Y1NWGMBCNZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Auth
const auth = firebase.auth();

// Initialize Firestore
const db = firebase.firestore();

// Initialize Storage
const storage = firebase.storage();

// Reference to the UEFAttendees collection
const attendeesCollection = db.collection('events').doc('data').collection('users');

console.log('Firebase initialized successfully');
