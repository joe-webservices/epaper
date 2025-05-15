async function initFirebase() {
  try {
    const res = await fetch("/firebase-config.json");
    if (!res.ok) throw new Error("Could not load Firebase config");
    const firebaseConfig = await res.json();

    firebase.initializeApp(firebaseConfig);
    window.auth = firebase.auth();
    window.db = firebase.database();

    setupAuthListeners();
    setupForms();
    setupPasswordToggle(); // <-- 👁️ Show/hide password toggle
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    alert("Failed to load Firebase config.");
  }
}

function setupAuthListeners() {
  const loginSection = document.getElementById("login-section");
  const uploadSection = document.getElementById("upload-section");
  const loginError = document.getElementById("login-error");

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginSection.style.display = "none";
      uploadSection.style.display = "block";
      loginError.textContent = "";
    } else {
      loginSection.style.display = "block";
      uploadSection.style.display = "none";
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      auth.signOut().then(() => {
        showToast("Logged out successfully!", "success");
      });
    }
  });
}

function setupForms() {
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("login-error");
  const resultDiv = document.getElementById("result");

  // LOGIN FORM
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loginBtn = document.getElementById("loginBtn");
    const loginBtnText = document.getElementById("loginBtnText");
    const loginSpinner = document.getElementById("loginSpinner");

    loginBtn.disabled = true;
    loginBtnText.textContent = "Logging in...";
    loginSpinner.classList.remove("d-none");
    loginError.textContent = "";

    try {
      await auth.signInWithEmailAndPassword(
        document.getElementById("email").value,
        document.getElementById("password").value
      );
      loginForm.reset();
      showToast("Login successful! Welcome back.", "success");
    } catch (error) {
      let message = "";
      switch (error.code) {
        case "auth/user-not-found":
          message = "No user found with this email.";
          break;
        case "auth/wrong-password":
          message = "Incorrect password.";
          break;
        case "auth/invalid-email":
          message = "Invalid email format.";
          break;
        case "auth/user-disabled":
          message = "User account disabled.";
          break;
        default:
          message = error.message;
      }
      showToast(message, "danger");
    } finally {
      loginBtn.disabled = false;
      loginBtnText.textContent = "Login";
      loginSpinner.classList.add("d-none");
    }
  });

  // UPLOAD FORM
  const driveForm = document.getElementById("driveForm");
  driveForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const saveBtn = document.getElementById("saveBtn");
    const saveBtnText = document.getElementById("saveBtnText");
    const saveSpinner = document.getElementById("saveSpinner");

    saveBtn.disabled = true;
    saveBtnText.textContent = "Saving...";
    saveSpinner.classList.remove("d-none");
    resultDiv.innerHTML = "";

    const paper = document.getElementById("paperName").value.trim();
    const date = document.getElementById("editionDate").value;
    const link = document.getElementById("driveLink").value.trim();
    const thumbUrl = document.getElementById("thumbUrl").value.trim();

    const fileIdMatch = link.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
    const fileId = fileIdMatch ? fileIdMatch[1] : null;
    const previewLink = fileId
      ? `https://drive.google.com/file/d/${fileId}/preview`
      : link;
    const viewerLink = fileId ? `viewer.html?fileId=${fileId}` : "";

    const dataToSave = { driveLink: previewLink };
    if (thumbUrl) dataToSave.thumb = thumbUrl;

    try {
      await db.ref(`editions/${paper}/${date}`).set(dataToSave);

      resultDiv.innerHTML = `
          <div class="alert alert-success">
            <strong>Saved!</strong><br>
            <b>${paper}</b> - <b>${date}</b><br>
            <a href="${previewLink}" target="_blank">Drive Preview</a><br>
            ${
              thumbUrl
                ? `<a href="${thumbUrl}" target="_blank">Thumbnail Image</a><br>`
                : ""
            }
            <div class="mt-2">
              <label>Viewer Link:</label>
              <input type="text" class="form-control" value="${viewerLink}" id="viewerLink" readonly />
              <button class="btn btn-outline-primary btn-sm mt-2" onclick="copyViewerLink()">Copy Link</button>
              <a class="btn btn-outline-success btn-sm mt-2 ms-2" target="_blank" href="${viewerLink}">Open Viewer</a>
            </div>
          </div>
        `;

      driveForm.reset();
      showToast("Edition saved successfully!", "success");
    } catch (error) {
      resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
      showToast("Failed to save edition.", "danger");
    } finally {
      saveBtn.disabled = false;
      saveBtnText.textContent = "Save Link";
      saveSpinner.classList.add("d-none");
    }
  });
}

function copyViewerLink() {
  const input = document.getElementById("viewerLink");
  input.select();
  input.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard
    .writeText(input.value)
    .then(() => {
      showToast("Viewer link copied to clipboard!", "success");
    })
    .catch(() => {
      showToast("Failed to copy link.", "danger");
    });
}

function setupPasswordToggle() {
  const toggleBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  toggleBtn.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    toggleBtn.textContent = type === "password" ? "👁️" : "🙈";
  });
}

function showToast(message, type = "primary") {
  const toastEl = document.getElementById("liveToast");
  const toastBody = document.getElementById("toastBody");

  toastBody.textContent = message;
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

window.addEventListener("DOMContentLoaded", initFirebase);
