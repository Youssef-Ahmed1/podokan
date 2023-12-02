import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {

  apiKey: "AIzaSyBi_JnZJDSrMVypD-19VwZd5a30xC2RaFw",

  authDomain: "mytshirtapp662.firebaseapp.com",

  databaseURL: "https://mytshirtapp662-default-rtdb.firebaseio.com",

  projectId: "mytshirtapp662",

  storageBucket: "mytshirtapp662.appspot.com",

  messagingSenderId: "732752833906",

  appId: "1:732752833906:web:21b736e30f5803f941c1eb",

  measurementId: "G-FMKH90W1F9"

};


const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export default storage;
