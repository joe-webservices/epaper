# 📰 ePaper Website

An online ePaper platform developed by **JWS (Joe Web Services)** for **Client: Prasanth Arokia Samy**. Inspired by [The Times of India's ePaper](https://epaper.indiatimes.com), this project allows users to view daily newspaper editions in a clean and interactive web interface.

---

## 🔍 Objective

To build a responsive ePaper website where users can:

- View today's paper
- Select and read previous editions
- Zoom and navigate between pages
- Enjoy a clean reading experience with no login required

---

## 🔧 Technologies Used

| Part           | Technology                                                |
| -------------- | --------------------------------------------------------- |
| **Frontend**   | HTML, CSS, JavaScript (Vanilla or with jQuery), Bootstrap |
| **Database**   | Firebase Realtime DB or Supabase                          |
| **PDF Viewer** | [PDF.js](https://mozilla.github.io/pdf.js/) (open-source) |

---

## 🛠️ Features

### ✅ User Side:

- 📆 View today’s edition
- 🔍 Zoom in/out and navigate pages
- 🗂️ Select by date
- 📑 Page jump, next/prev buttons
- 🖥️ Full-screen support (basic)

### 🔐 Admin Side:

- 🔐 Simple login with password
- 📤 Upload daily edition (PDF or pages)
- 🗑️ Delete or update existing editions
- 🗓️ Editions saved with date-based naming

---

## 📂 Data Structure

Each edition is stored with:

- `date` (e.g. `2025-05-13`)
- PDF or page images
- Metadata stored in Firebase/Supabase
- File URLs in database, files in storage

---

## 🔒 User Access

| Role   | Access                                    |
| ------ | ----------------------------------------- |
| Reader | Public (No login)                         |
| Admin  | Private (Password-protected upload panel) |

---

## 🚫 Payment System

- Free to read – No payment gateway integration.

---

## 🕒 Time Estimation

| Task                   | Estimated Time |
| ---------------------- | -------------- |
| UI Design              | 2 days         |
| PDF Viewer Integration | 1 day          |
| Admin Panel            | 2 days         |
| Firebase/DB Setup      | 1 day          |
| Testing & Deployment   | 1 day          |
| **Total**              | **~1 Week**    |

---

## 📁 Project Structure (Suggested)

```
epaper-website/
│
├── index.html               # Home page
├── viewer.html              # ePaper viewer page
├── admin.html               # Admin upload panel
├── /assets/                 # CSS, JS, images
├── /pdfs/                   # Uploaded PDFs (storage-linked)
├── /scripts/                # Firebase or PHP scripts
└── README.md
```

---

## 🚀 Deployment

Choose based on stack:

- **Frontend**: Netlify or GitHub Pages
- **Backend**: Firebase Functions, Supabase, or Hostinger (for PHP)

---

## 📌 Future Improvements

- Multi-edition support by region
- Bookmark/favorite feature
- Responsive mobile-first layout
- Download edition option
- OCR/Text search inside PDF

---

## 👨‍💻 Developed By

**JWS (Joe Web Services)**  
Contact: rakeshjoe52@gmail.com  
GitHub: [@yourusername](#)  
LinkedIn: [Joe Rakesh](https://linkedin.com/in/joerakesh)

---
