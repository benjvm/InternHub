import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBuw-fbE6d4tHVZulq_epLvudXHoq9meOo',
  authDomain: 'internhub-378eb.firebaseapp.com',
  projectId: 'internhub-378eb',
  storageBucket: 'internhub-378eb.firebasestorage.app',
  messagingSenderId: '176539382608',
  appId: '1:176539382608:web:4613538ca701577aacf255',
  measurementId: 'G-MHJWHVP93Q',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export { app }
export const auth = getAuth(app)
export const db = getFirestore(app)
