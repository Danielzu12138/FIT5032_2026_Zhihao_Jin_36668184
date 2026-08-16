import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  setDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCz8MIJQGq8TVZQ4VdEq6umMaYgh16n4nI',
  authDomain: 'mindspace-youth.firebaseapp.com',
  projectId: 'mindspace-youth',
  storageBucket: 'mindspace-youth.firebasestorage.app',
  messagingSenderId: '427996511922',
  appId: '1:427996511922:web:e7fd6d062c892e2f6ad3ab',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  setDoc,
}
