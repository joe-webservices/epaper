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

async function initFirebase() {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  auth = firebase.auth();
  db = firebase.database();
  window.storage = firebase.storage();
  bindLogoutBtn(auth);

  // Auth state listener must be here after auth is initialized
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html";
    } else {
      updateUserInfo(user);
      loadPapers();
    }
  });
}

// DOM Elements
const papersList = document.getElementById("papersList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const logoutBtn = document.getElementById("logoutBtn");
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

// Load and display papers
async function loadPapers() {
  try {
    const papersRef = db.ref("editions");
    const snapshot = await papersRef.once("value");
    const papers = snapshot.val() || {};

    // Convert to array for sorting
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

    // Sort papers
    const sortBy = sortSelect.value;
    papersArray.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.editionDate) - new Date(a.editionDate);
        case "date-asc":
          return new Date(a.editionDate) - new Date(b.editionDate);
        case "name-asc":
          return a.paperName.localeCompare(b.paperName);
        case "name-desc":
          return b.paperName.localeCompare(a.paperName);

        default:
          return 0;
      }
    });

    // Filter papers based on search
    const searchTerm = searchInput.value.toUpperCase();
    papersArray = papersArray.filter(
      (paper) =>
        paper.paperName.toUpperCase().includes(searchTerm) ||
        paper.editionDate.includes(searchTerm)
    );

    // Update UI
    papersList.innerHTML = papersArray
      .map(
        (paper) => `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <img src="${
            paper.thumbUrl || ""
          }" class="card-img-top" alt="Thumbnail" style="object-fit:cover;max-height:180px;">
          <div class="card-body">
            <h5 class="card-title">${paper.paperName}</h5>
            <h6 class="card-subtitle mb-2 text-muted">${paper.editionDate}</h6>
            <p class="card-text">
              <a href="${
                paper.driveLink || "#"
              }" target="_blank">Google Drive Link</a><br>
              <small class="text-muted">
                Uploaded: ${new Date(paper.uploadedAt).toLocaleDateString()}<br>
              </small>
            </p>
            <div class="btn-group">
              <button onclick="openEditModal('${paper.paperName.replace(
                /'/g,
                "\\'"
              )}', '${paper.editionDate}', '${(paper.driveLink || "").replace(
          /'/g,
          "\\'"
        )}', '${(paper.thumbUrl || "").replace(
          /'/g,
          "\\'"
        )}', this)" class="btn btn-warning btn-sm">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button onclick="deletePaper('${paper.paperName.replace(
                /'/g,
                "\\'"
              )}', '${paper.editionDate}')" class="btn btn-danger btn-sm">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    showToast("Error loading papers: " + error.message, "danger");
  }
}

// Update user info
function updateUserInfo(user) {
  const userName = document.getElementById("userName");
  if (user && userName) {
    userName.textContent = user.email;
  }
}

// Delete paper
async function deletePaper(paperName, editionDate) {
  if (
    !confirm(`Are you sure you want to delete ${paperName} (${editionDate})?`)
  ) {
    return;
  }
  try {
    // Only delete from database
    const paperRef = db.ref(`editions/${paperName}/${editionDate}`);
    await paperRef.remove();
    showToast("Paper deleted successfully", "success");
    loadPapers();
  } catch (error) {
    showToast("Error deleting paper: " + error.message, "danger");
  }
}

// Handle logout
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

// Event listeners
searchInput.addEventListener("input", loadPapers);
sortSelect.addEventListener("change", loadPapers);

// Add modal HTML to the page (if not already present)
if (!document.getElementById("editModal")) {
  const modalHtml = `
    <div class="modal fade" id="editModal" tabindex="-1" aria-labelledby="editModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="editForm">
            <div class="modal-header">
              <h5 class="modal-title" id="editModalLabel">Edit Paper</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="editPaperName" class="form-label">Newspaper Name</label>
                <input type="text" class="form-control" id="editPaperName" required />
              </div>
              <div class="mb-3">
                <label for="editEditionDate" class="form-label">Edition Date</label>
                <input type="date" class="form-control" id="editEditionDate" required />
              </div>
              <div class="mb-3">
                <label for="editDriveLink" class="form-label">Google Drive Shareable Link</label>
                <input type="url" class="form-control" id="editDriveLink" required />
              </div>
              <div class="mb-3">
                <label for="editThumbUrl" class="form-label">Thumbnail Image URL</label>
                <input type="url" class="form-control" id="editThumbUrl" required />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHtml);
}

let currentEdit = null;

// Edit modal logic
window.openEditModal = function (
  paperName,
  editionDate,
  driveLink,
  thumbUrl,
  btn
) {
  currentEdit = { oldPaperName: paperName, oldEditionDate: editionDate };
  document.getElementById("editPaperName").value = paperName;
  document.getElementById("editEditionDate").value = editionDate;
  document.getElementById("editDriveLink").value = driveLink;
  document.getElementById("editThumbUrl").value = thumbUrl;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
};

document
  .getElementById("editForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    if (!currentEdit) return;
    const newPaperName = document.getElementById("editPaperName").value.trim();
    const newEditionDate = document.getElementById("editEditionDate").value;
    const newDriveLink = document.getElementById("editDriveLink").value.trim();
    const newThumbUrl = document.getElementById("editThumbUrl").value.trim();
    try {
      // Remove old entry if name or date changed
      if (
        newPaperName !== currentEdit.oldPaperName ||
        newEditionDate !== currentEdit.oldEditionDate
      ) {
        await db
          .ref(
            `editions/${currentEdit.oldPaperName}/${currentEdit.oldEditionDate}`
          )
          .remove();
      }
      // Save new/updated entry
      await db.ref(`editions/${newPaperName}/${newEditionDate}`).set({
        driveLink: newDriveLink,
        thumbUrl: newThumbUrl,
        uploadedAt: new Date().toISOString(),
        views: 0,
      });
      showToast("Paper updated successfully", "success");
      bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
      loadPapers();
    } catch (error) {
      showToast("Error updating paper: " + error.message, "danger");
    } finally {
      currentEdit = null;
    }
  });

// Initialize
initFirebase().catch(console.error);

function updateUserInfo(user) {
  const userName = document.getElementById("userName");
  if (user && userName) {
    userName.textContent = user.email;
  }
}
