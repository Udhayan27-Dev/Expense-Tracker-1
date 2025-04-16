


const firebaseConfig = {
    apiKey: "AIzaSyDqydACrvS75ZVYG5jiPtout-jeOOMb46M",
    authDomain: "expense-tracker-19097.firebaseapp.com",
    projectId: "expense-tracker-19097",
    storageBucket: "expense-tracker-19097.firebasestorage.app",
    messagingSenderId: "576262603191",
    appId: "1:576262603191:web:a9be593c9dded825926832",
    measurementId: "G-DGR2ER2PJQ"
  };
  
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
  // DOM Elements
  const formContainer = document.getElementById('form-container');
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  
  // Toggle between forms
  showSignup.addEventListener('click', () => {
    formContainer.classList.add('active');
  });
  
  showLogin.addEventListener('click', () => {
    formContainer.classList.remove('active');
  });
  
  // Login Event
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
  
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "dashboard.html";  // Change this to your target page
      })
      .catch((error) => alert(error.message));
  });
  
  // Signup Event
  document.getElementById('signup-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
  
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        alert("Signed up successfully!");

        formContainer.classList.remove('active');  // Show login form
      })
      .catch((error) => alert(error.message));
  });
  