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
  const monthFilter = document.getElementById("monthFilter");

  let allEditions = [];

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
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
      col.className = "col-sm-6 col-md-4 col-lg-3 mb-4";

      col.innerHTML = `
        <div class="edition-card card h-100 border-0 shadow-sm rounded-3">
          <div class="edition-img-container">
            <a href="${item.readLink}" target="_blank" rel="noopener">
              <img src="${item.imgSrc}" alt="${
        item.paperName
      }" class="edition-img card-img-top" />
            </a>
          </div>
          <div class="card-body text-center">
            <h3 class="edition-title card-title">${item.paperName.toUpperCase()}</h3>
            <p class="edition-date card-subtitle text-muted">${formatDate(
              item.date
            )}</p>
            <div class="mt-3">
               <a href="${
                 item.readLink
               }" class="btn btn-warning edition-button rounded-pill px-4 py-2" target="_blank" rel="noopener">Read Now &raquo;</a>
            </div>
          </div>
        </div>
      `;

      editionsRow.appendChild(col);
    });
  }

  function applyFilters() {
    const selectedMonth = monthFilter.value;
    const filtered = allEditions.filter((edition) => {
      return !selectedMonth || edition.date.startsWith(selectedMonth);
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
  if (monthFilter) {
    monthFilter.addEventListener("change", applyFilters);
  }

  fetchEditions();
}
