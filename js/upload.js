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
let db;

async function initFirebase() {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  auth = firebase.auth();
  db = firebase.database();
  setupEventListeners();
  bindLogoutBtn(auth);

  // Auth state listener must be here after auth is initialized
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      updateUserInfo(user);
      loadRecentUploads();
    }
  });
}

// DOM Elements
const uploadForm = document.getElementById("uploadForm");
const paperNameInput = document.getElementById("paperName");
const editionDateInput = document.getElementById("editionDate");
const driveLinkInput = document.getElementById("driveLink");
const thumbUrlInput = document.getElementById("thumbUrl");
const uploadBtn = document.getElementById("uploadBtn");
const uploadBtnText = document.getElementById("uploadBtnText");
const uploadSpinner = document.getElementById("uploadSpinner");
const recentUploads = document.getElementById("recentUploads");
const userName = document.getElementById("userName");

// Toast initialization
const toast = new bootstrap.Toast(document.getElementById("liveToast"));

// Show toast message
function showToast(message, type = "primary") {
  const toastEl = document.getElementById("liveToast");
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.querySelector(".toast-body").textContent = message;
  toast.show();
}

// Load recent uploads
async function loadRecentUploads() {
  try {
    const papersRef = db.ref("editions");
    const snapshot = await papersRef.once("value");
    const papers = snapshot.val() || {};
    let papersArray = [];
    Object.entries(papers).forEach(([paperName, editions]) => {
      Object.entries(editions).forEach(([editionDate, details]) => {
        papersArray.push({
          paperName,
          editionDate,
          ...details,
        });
      });
    });
    papersArray.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    recentUploads.innerHTML = papersArray
      .slice(0, 5)
      .map(
        (paper) => `
      <tr>
        <td>${paper.paperName}</td>
        <td>${paper.editionDate}</td>
        <td>${new Date(paper.uploadedAt).toLocaleDateString()}</td>
        <td>
          <span class="badge bg-success">Saved</span>
        </td>
      </tr>
    `
      )
      .join("");
  } catch (error) {
    showToast("Error loading recent uploads", "danger");
  }
}

// Handle link save
async function handleSaveLink(event) {
  event.preventDefault();
  const paperName = paperNameInput.value.trim();
  const editionDate = editionDateInput.value;
  const driveLink = driveLinkInput.value.trim();
  const thumbUrl = thumbUrlInput.value.trim();
  if (!paperName || !editionDate || !driveLink || !thumbUrl) {
    showToast("Please fill in all fields", "warning");
    return;
  }
  // Check authentication before writing
  if (!auth.currentUser) {
    showToast("You must be logged in to upload.", "danger");
    return;
  }
  try {
    uploadBtn.disabled = true;
    uploadBtnText.textContent = "Saving...";
    uploadSpinner.classList.remove("d-none");
    const paperRef = db.ref(`editions/${paperName}/${editionDate}`);
    await paperRef.set({
      driveLink,
      thumbUrl,
      uploadedAt: new Date().toISOString(),
      views: 0,
    });
    uploadForm.reset();
    showToast("Link saved successfully", "success");
    loadRecentUploads();
  } catch (error) {
    showToast("Error: " + error.message, "danger");
  } finally {
    uploadBtn.disabled = false;
    uploadBtnText.textContent = "Save Link";
    uploadSpinner.classList.add("d-none");
  }
}

// Update user info
function updateUserInfo(user) {
  const userName = document.getElementById("userName");
  if (user && userName) {
    userName.textContent = user.email;
  }
}

// Handle logout
function setupEventListeners() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await auth.signOut();
        window.location.href = "login.html";
      } catch (error) {
        showToast(error.message, "danger");
      }
    });
  }
  if (uploadForm) {
    uploadForm.addEventListener("submit", handleSaveLink);
  }
}

function bindLogoutBtn(auth) {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      auth.signOut().then(() => {
        showToast("Logged out successfully", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1000);
      });
    });
  }
}

initFirebase().catch(console.error);
