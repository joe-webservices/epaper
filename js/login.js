// Initialize Firebase
async function loadFirebaseConfig() {
  try {
    const response = await fetch("firebase-config.json");
    if (!response.ok) throw new Error("Failed to load firebase-config.json");
    return await response.json();
  } catch (err) {
    console.error("Error loading Firebase config:", err);
    showToast("Error loading Firebase config", "danger");
    throw err;
  }
}

let auth;

async function initFirebase() {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  auth = firebase.auth();

  // Set up event listeners after Firebase is initialized
  setupEventListeners();
}

// DOM Elements
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const togglePasswordBtn = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");
const loginBtnText = document.getElementById("loginBtnText");
const loginSpinner = document.getElementById("loginSpinner");
const loginError = document.getElementById("login-error");

// Toast initialization
const toast = new bootstrap.Toast(document.getElementById("liveToast"));

// Show toast message
function showToast(message, type = "success") {
  const toastEl = document.getElementById("liveToast");
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.querySelector(".toast-body").textContent = message;
  toast.show();
}

// Toggle password visibility
function setupEventListeners() {
  togglePasswordBtn.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePasswordBtn.innerHTML =
      type === "password"
        ? '<i class="bi bi-eye"></i>'
        : '<i class="bi bi-eye-slash"></i>';
  });

  // Handle login
  loginForm.addEventListener("submit", handleLogin);

  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "manage.html";
    }
  });
}

// Handle login
async function handleLogin(event) {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showToast("Please enter both email and password", "warning");
    return;
  }

  try {
    // Show loading state
    loginBtn.disabled = true;
    loginBtnText.textContent = "Logging in...";
    loginSpinner.classList.remove("d-none");
    loginError.textContent = "";

    // Sign in with Firebase
    await auth.signInWithEmailAndPassword(email, password);
    showToast("Login successful", "success");
    setTimeout(() => {
      window.location.href = "upload.html";
    }, 1000);
  } catch (error) {
    loginError.textContent = error.message;
    showToast(error.message, "danger");
    loginBtn.disabled = false;
    loginBtnText.textContent = "Login";
    loginSpinner.classList.add("d-none");
  }
}

// Initialize
initFirebase().catch(console.error);
