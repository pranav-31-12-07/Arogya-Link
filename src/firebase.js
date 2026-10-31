import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDDHat8vl3fr4TxH_H2nObpxFgGPzmmCtM",
    authDomain: "arogyalink-4f8c4.firebaseapp.com",
    projectId: "arogyalink-4f8c4",
    storageBucket: "arogyalink-4f8c4.firebasestorage.app",
    messagingSenderId: "248855217446",
    appId: "1:248855217446:web:2066e8b7239aff82ed6de7",
    measurementId: "G-BHHKYGZ130"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;

// Analytics is optional and browser-dependent.
isSupported().then((supported) => {
    if (supported) {
        getAnalytics(app);
    }
});