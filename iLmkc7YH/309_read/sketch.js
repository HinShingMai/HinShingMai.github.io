const firebaseConfig = {
  apiKey: "AIzaSyARetf_IrYgcWGB8StF5nhit9NaVQbdw88",
  authDomain: "bikesim-f46bc.firebaseapp.com",
  databaseURL: "https://bikesim-f46bc-default-rtdb.firebaseio.com",
  projectId: "bikesim-f46bc",
  storageBucket: "bikesim-f46bc.appspot.com",
  messagingSenderId: "153582709015",
  appId: "1:153582709015:web:3d050296d8a5271043af52",
  measurementId: "G-Q3M0346J9W"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
// Initialize Realtime Database and get a reference to the service
const database = firebase.database();

function readData(userId) {
  const userRef = firebase.database().ref('users/' + userId);
  userRef.once('value').then((snapshot) => {
    const data = snapshot.val();
    console.log(data);
  });
}

function startGame() {
    var values = document.getElementsByName('cover-select');
    if(!values[0].value) {
        alert('The id cannot be empty!');
        return;
    }
    id = values[0].value;
    readData(id);
}