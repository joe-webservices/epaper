// Fetch Firebase config from external JSON
fetch("/firebase-config.json")
  .then((res) => {
    if (!res.ok) throw new Error("Failed to load Firebase config");
    return res.json();
  })
  .then((firebaseConfig) => {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // Initialize your app here
    startApp(db);
  })
  .catch((error) => {
    document.getElementById("loading").style.display = "none";
    const errorEl = document.getElementById("error");
    errorEl.style.display = "block";
    errorEl.textContent = "Failed to initialize Firebase: " + error.message;
    console.error(error);
  });

function startApp(db) {
  const editionsRow = document.getElementById("editions-row");
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const searchInput = document.getElementById("searchInput");
  const monthFilter = document.getElementById("monthFilter");
  const clearBtn = document.getElementById("clearBtn");

  let allEditions = [];

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function extractDriveFileId(urlOrId) {
    const match = urlOrId.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : /^[a-zA-Z0-9_-]+$/.test(urlOrId) ? urlOrId : null;
  }

  function renderEditions(data) {
    editionsRow.innerHTML = "";
    if (data.length === 0) {
      editionsRow.innerHTML = `<p class="text-muted">No results found.</p>`;
      return;
    }

    data.forEach((item) => {
      const col = document.createElement("div");
      col.className = "col-sm-6 col-md-4 col-lg-3";

      col.innerHTML = `
        <div class="edition-card h-100">
          <img src="${item.imgSrc}" alt="${
        item.paperName
      }" class="edition-img" />
          <div class="edition-title">${item.paperName.toUpperCase()}</div>
          <div class="edition-date">${formatDate(item.date)}</div>
          <a href="${item.readLink}" class="read-link">Read Now &raquo;</a>
        </div>
      `;

      editionsRow.appendChild(col);
    });
  }

  function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const selectedMonth = monthFilter.value;

    const filtered = allEditions.filter((edition) => {
      const matchesName = edition.paperName.toLowerCase().includes(term);
      const matchesMonth =
        !selectedMonth || edition.date.startsWith(selectedMonth);
      return matchesName && matchesMonth;
    });

    renderEditions(filtered);
  }

  function populateMonthDropdown(dates) {
    const months = Array.from(
      new Set(
        dates.map((d) => {
          const date = new Date(d);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`;
        })
      )
    )
      .sort()
      .reverse();

    months.forEach((m) => {
      const option = document.createElement("option");
      const [year, month] = m.split("-");
      option.value = m;
      option.textContent = `${new Date(m + "-01").toLocaleString("en-US", {
        month: "long",
      })} ${year}`;
      monthFilter.appendChild(option);
    });
  }

  function fetchEditions() {
    db.ref("editions")
      .once("value")
      .then((snapshot) => {
        loadingEl.style.display = "none";

        if (!snapshot.exists()) {
          editionsRow.innerHTML = "<p>No editions found.</p>";
          return;
        }

        const data = snapshot.val();
        allEditions = [];
        const dateList = [];

        for (const paperName in data) {
          const editionsByDate = data[paperName];
          const dates = Object.keys(editionsByDate);
          const latestDate = dates.sort().reverse()[0];
          const edition = editionsByDate[latestDate];
          dateList.push(latestDate);

          let imgSrc = edition.thumbUrl || "";

          if (!imgSrc) {
            switch (paperName.toLowerCase()) {
              case "toi":
                imgSrc =
                  "https://epaper.timesgroup.com//TimesOfIndia/TimesOfIndia/2023/12/25/TOIBG/1_001/1_01/1_01_001.jpg";
                break;
              case "et":
                imgSrc = "https://etimg.etb2bimg.com/photo/87369819.cms";
                break;
              case "mt":
                imgSrc =
                  "https://maharashtratimes.com/thumb/10010940/maharashtra-times-logo.jpg";
                break;
              case "mirror":
                imgSrc = "https://images.indianexpress.com/2020/08/mirror.jpg";
                break;
              default:
                imgSrc = "/img/logo.png";
            }
          }

          const fileId = extractDriveFileId(edition.driveLink);
          const readLink = fileId
            ? `viewer.html?fileId=${fileId}`
            : edition.driveLink;

          allEditions.push({
            paperName,
            imgSrc,
            date: latestDate,
            readLink,
          });
        }

        populateMonthDropdown(dateList);
        renderEditions(allEditions);
      })
      .catch((error) => {
        loadingEl.style.display = "none";
        errorEl.style.display = "block";
        errorEl.textContent = "Failed to load editions: " + error.message;
      });
  }

  // Event Listeners
  if (searchInput && monthFilter && clearBtn) {
    searchInput.addEventListener("input", applyFilters);
    monthFilter.addEventListener("change", applyFilters);
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      monthFilter.value = "";
      renderEditions(allEditions);
    });
  }

  fetchEditions();
}
function renderEditions(data) {
  const editionsRow = document.getElementById("editions-row");
  editionsRow.innerHTML = "";

  if (!data || data.length === 0) {
    editionsRow.innerHTML = `<p class="text-muted">No results found.</p>`;
    return;
  }

  data.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3";

    col.innerHTML = `
      <div class="edition-card h-100">
        <div class="edition-img-container">
        <a href="${item.readLink}" >
          <img src="${item.imgSrc}" alt="${
      item.paperName
    }" class="edition-img" /> </a>
        </div>
        <div class="edition-body">
          <h3 class="edition-title">${item.paperName}</h3>
          <p class="edition-date">${formatDate(item.date)}</p>
          <a href="${
            item.readLink
          }" class="edition-button" target="_blank" rel="noopener">Read Now &raquo;</a>
        </div>
      </div>
    `;

    editionsRow.appendChild(col);
  });

  document.getElementById("loading").classList.add("d-none");
}
