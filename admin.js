// Initialize Firebase - replace with your own config!
// Function to load Firebase config from JSON file
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

async function initFirebase() {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  window.auth = firebase.auth();
  window.db = firebase.database();

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginSection.style.display = "none";
      adminUI.style.display = "block";
      showSection("dashboardSection");
      setActiveTab(navTabs.querySelector('[data-section="dashboardSection"]'));
      loadPaperCount();
      loadManageList();
    } else {
      loginSection.style.display = "block";
      adminUI.style.display = "none";
    }
  });
}

// Call only once at script start
initFirebase().catch(() => {
  // Handle failure if needed
});

// Remove any auth.onAuthStateChanged calls outside this function

// DOM Elements
const loginSection = document.getElementById("loginSection");
const adminUI = document.getElementById("adminUI");

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtnText = document.getElementById("loginBtnText");
const loginSpinner = document.getElementById("loginSpinner");
const loginError = document.getElementById("login-error");
const togglePasswordBtn = document.getElementById("togglePassword");

const navTabs = document.getElementById("navTabs");
const logoutBtn = document.getElementById("logoutBtn");

const sections = {
  dashboard: document.getElementById("dashboardSection"),
  upload: document.getElementById("uploadSection"),
  manage: document.getElementById("manageSection"),
};

const paperCountEl = document.getElementById("paperCount");

const uploadForm = document.getElementById("uploadForm");
const saveBtnText = document.getElementById("saveBtnText");
const saveSpinner = document.getElementById("saveSpinner");
const backToDashboardBtn = document.getElementById("backToDashboard");

const papersList = document.getElementById("papersList");

const editFormContainer = document.getElementById("editFormContainer");
const editForm = document.getElementById("editForm");
const editPaperNameInput = document.getElementById("editPaperName");
const editEditionDateInput = document.getElementById("editEditionDate");
const editDriveLinkInput = document.getElementById("editDriveLink");
const editThumbUrlInput = document.getElementById("editThumbUrl");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Toast Elements
const toastEl = document.getElementById("liveToast");
const toastBody = document.getElementById("toastBody");
const toast = new bootstrap.Toast(toastEl);

// Show toast helper function
function showToast(message, type = "primary") {
  toastBody.textContent = message;
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;
  toast.show();
}

// Toggle password visibility
togglePasswordBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "👁️";
  }
});

// Handle login submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  loginBtnText.textContent = "Logging in...";
  loginSpinner.classList.remove("d-none");

  try {
    await auth.signInWithEmailAndPassword(
      emailInput.value,
      passwordInput.value
    );
    loginForm.reset();
    showToast("Login successful!", "success"); // <-- Add this line
  } catch (error) {
    loginError.textContent = error.message;
    showToast(`Login failed: ${error.message}`, "error"); // <-- And this line
  } finally {
    loginBtnText.textContent = "Login";
    loginSpinner.classList.add("d-none");
  }
});

// Auth state listener
// auth.onAuthStateChanged((user) => {
//   if (user) {
//     loginSection.style.display = "none";
//     adminUI.style.display = "block";
//     showSection("dashboardSection");
//     setActiveTab(navTabs.querySelector('[data-section="dashboardSection"]'));
//     loadPaperCount();
//     loadManageList();
//   } else {
//     loginSection.style.display = "block";
//     adminUI.style.display = "none";
//   }
// });

// Logout
logoutBtn.addEventListener("click", () => {
  if (confirm("Are you sure you want to log out?")) {
    auth
      .signOut()
      .then(() => {
        showToast("Logged out successfully.", "success");
        // Hide admin UI, show login screen
        adminUI.style.display = "none";
        loginSection.style.display = "block";
        showSection("dashboardSection"); // reset to dashboard or login as needed
        setActiveTab(
          navTabs.querySelector('[data-section="dashboardSection"]')
        );
      })
      .catch((error) => {
        showToast("Logout failed: " + error.message, "danger");
      });
  }
});

// Navigation tabs click handler
navTabs.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    e.preventDefault();
    const sectionId = e.target.getAttribute("data-section");
    showSection(sectionId);
    setActiveTab(e.target);

    if (sectionId === "manageSection") {
      loadManageList();
    } else if (sectionId === "dashboardSection") {
      loadPaperCount();
    }

    // Hide edit form when switching sections
    editFormContainer.style.display = "none";
    editForm.reset();
  }
});

// Show given section, hide others
function showSection(sectionId) {
  Object.values(sections).forEach((sec) => {
    sec.classList.remove("active");
  });
  const sec = document.getElementById(sectionId);
  if (sec) sec.classList.add("active");
}

// Set active tab link
function setActiveTab(activeLink) {
  navTabs.querySelectorAll("a.nav-link").forEach((link) => {
    link.classList.remove("active");
  });
  if (activeLink) activeLink.classList.add("active");
}

// Load total paper count and display
function loadPaperCount() {
  db.ref("editions").once("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      paperCountEl.textContent = "0";
      return;
    }
    // Count total editions across all papers
    let totalCount = 0;
    for (const paperName in data) {
      if (Object.hasOwnProperty.call(data, paperName)) {
        totalCount += Object.keys(data[paperName]).length;
      }
    }
    paperCountEl.textContent = totalCount;
  });
}

// Upload form submit handler
uploadForm.addEventListener("submit", (e) => {
  e.preventDefault();
  saveBtnText.textContent = "Saving...";
  saveSpinner.classList.remove("d-none");

  const paperName = document
    .getElementById("paperName")
    .value.trim()
    .toLowerCase();
  const editionDate = document.getElementById("editionDate").value;
  const driveLink = document.getElementById("driveLink").value.trim();
  const thumbUrl = document.getElementById("thumbUrl").value.trim();

  if (!paperName || !editionDate || !driveLink) {
    showToast("Please fill all required fields", "danger");
    saveBtnText.textContent = "Save Link";
    saveSpinner.classList.add("d-none");
    return;
  }

  // Save to Firebase under /papers/{paperName}/{editionDate}
  const ref = db.ref(`editions/${paperName}/${editionDate}`);
  ref
    .set({
      driveLink,
      thumbUrl: thumbUrl || "",
      uploadedAt: Date.now(),
    })
    .then(() => {
      showToast("Paper saved successfully!", "success");
      uploadForm.reset();
      loadPaperCount();
    })
    .catch((err) => {
      showToast("Error saving paper: " + err.message, "danger");
    })
    .finally(() => {
      saveBtnText.textContent = "Save Link";
      saveSpinner.classList.add("d-none");
    });
});

// Back to dashboard button
backToDashboardBtn.addEventListener("click", () => {
  showSection("dashboardSection");
  setActiveTab(navTabs.querySelector('[data-section="dashboardSection"]'));
  editFormContainer.style.display = "none";
  editForm.reset();
});

// Load and render papers list in Manage section
function loadManageList() {
  papersList.innerHTML = "";
  editFormContainer.style.display = "none";
  editForm.reset();

  db.ref("editions").once("value", (snapshot) => {
    const papers = snapshot.val();
    if (!papers) {
      papersList.innerHTML = '<div class="text-muted">No papers found.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    // Iterate over each paper
    Object.entries(papers).forEach(([paperName, editions]) => {
      // Paper header
      const paperHeader = document.createElement("div");
      paperHeader.className =
        "list-group-item list-group-item-secondary fw-bold";
      paperHeader.textContent = paperName.toUpperCase();
      fragment.appendChild(paperHeader);

      // Editions for each paper
      Object.entries(editions).forEach(([editionDate, details]) => {
        const item = document.createElement("div");
        item.className =
          "list-group-item d-flex justify-content-between align-items-center";

        // Left side content
        const leftDiv = document.createElement("div");
        leftDiv.innerHTML = `
            <div><strong>${editionDate}</strong></div>
            <div>
              <a href="${
                details.driveLink
              }" target="_blank" rel="noopener noreferrer">
                Google Drive Link
              </a>
            </div>
            ${
              details.thumbUrl
                ? `<div><img src="${details.thumbUrl}" alt="Thumbnail" style="max-width:60px; max-height:60px; border-radius:4px; margin-top:4px;"></div>`
                : ""
            }
          `;

        // Buttons group: Edit and Delete
        const btnGroup = document.createElement("div");
        btnGroup.className = "btn-group btn-group-sm";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-outline-primary";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () =>
          openEditForm(paperName, editionDate, details)
        );

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-outline-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () =>
          deletePaper(paperName, editionDate)
        );

        btnGroup.appendChild(editBtn);
        btnGroup.appendChild(deleteBtn);

        item.appendChild(leftDiv);
        item.appendChild(btnGroup);

        fragment.appendChild(item);
      });
    });

    papersList.appendChild(fragment);
  });
}

// Open edit form with paper details
function openEditForm(paperName, editionDate, details) {
  editFormContainer.style.display = "block";
  editPaperNameInput.value = paperName;
  editEditionDateInput.value = editionDate;
  editDriveLinkInput.value = details.driveLink;
  editThumbUrlInput.value = details.thumbUrl || "";

  // Scroll to edit form for visibility
  editFormContainer.scrollIntoView({ behavior: "smooth" });
}

// Edit form submission to update paper info
editForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const paperName = editPaperNameInput.value;
  const editionDate = editEditionDateInput.value;
  const driveLink = editDriveLinkInput.value.trim();
  const thumbUrl = editThumbUrlInput.value.trim();

  if (!driveLink) {
    showToast("Drive link cannot be empty", "danger");
    return;
  }

  const ref = db.ref(`editions/${paperName}/${editionDate}`); // <== fixed path here
  ref
    .update({
      driveLink,
      thumbUrl: thumbUrl || "",
      updatedAt: Date.now(),
    })
    .then(() => {
      showToast("Paper updated successfully!", "success");
      loadManageList();
      editFormContainer.style.display = "none";
      editForm.reset();
    })
    .catch((err) => {
      showToast("Error updating paper: " + err.message, "danger");
    });
});

// Cancel edit button hides form and resets it
cancelEditBtn.addEventListener("click", () => {
  editFormContainer.style.display = "none";
  editForm.reset();
});

// Delete paper with confirmation
function deletePaper(paperName, editionDate) {
  if (
    !confirm(
      `Are you sure you want to delete ${paperName.toUpperCase()} - ${editionDate}?`
    )
  )
    return;

  db.ref(`editions/${paperName}/${editionDate}`)
    .remove()
    .then(() => {
      showToast("Paper deleted successfully!", "success");
      loadManageList();
      loadPaperCount();
    })
    .catch((err) => {
      showToast("Error deleting paper: " + err.message, "danger");
    });
}

function showToast(message, type = "primary") {
  const toastEl = document.getElementById("liveToast");
  const toastBody = document.getElementById("toastBody");

  toastBody.textContent = message;

  // Remove all possible bg classes first
  toastEl.classList.remove(
    "text-bg-primary",
    "text-bg-success",
    "text-bg-danger",
    "text-bg-warning",
    "text-bg-info"
  );

  // Add class according to type
  switch (type) {
    case "success":
      toastEl.classList.add("text-bg-success");
      break;
    case "danger":
    case "error":
      toastEl.classList.add("text-bg-danger");
      break;
    case "warning":
      toastEl.classList.add("text-bg-warning");
      break;
    case "info":
      toastEl.classList.add("text-bg-info");
      break;
    default:
      toastEl.classList.add("text-bg-primary");
  }

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
