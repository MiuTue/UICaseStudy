// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCMsRpyiawuP9sg00jDsAZk9KGt02LY8aQ",
  authDomain: "casestudy-87fa8.firebaseapp.com",
  projectId: "casestudy-87fa8",
  storageBucket: "casestudy-87fa8.firebasestorage.app",
  messagingSenderId: "516922945394",
  appId: "1:516922945394:web:62c9292228c81005c9b7eb",
  measurementId: "G-V8W19JZJLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
export const storage = getStorage(app);
export { firestore };