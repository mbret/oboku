// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoGAypSpdEirrLSkEsfOO5mHZC0Jo9gBs",
  authDomain: "oboku-f9e59.firebaseapp.com",
  projectId: "oboku-f9e59",
  storageBucket: "oboku-f9e59.appspot.com",
  messagingSenderId: "799765650470",
  appId: "1:799765650470:web:0eeebcea8ab522dd16dae7",
  measurementId: "G-HBTLGMF74C"
}

// initialize Firebase
const app = initializeApp(firebaseConfig)

// initialize analytics
export const analytics = getAnalytics(app)
