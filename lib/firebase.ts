import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getDatabase } from "firebase/database"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyDFk-uSlG-0BmnPVHXPoxDP1RnOXWFoVkY",
  authDomain: "vj-piles-ug-movies.firebaseapp.com",
  databaseURL: "https://vj-piles-ug-movies-default-rtdb.firebaseio.com",
  projectId: "vj-piles-ug-movies",
  storageBucket: "vj-piles-ug-movies.firebasestorage.app",
  messagingSenderId: "986998273185",
  appId: "1:986998273185:web:4ed6e9d422a793777aace0",
  measurementId: "G-MFJHXCR87N",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const database = getDatabase(app)
export const storage = getStorage(app)
