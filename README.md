# Library Management System

A modern, responsive, and full-stack **Library Management System** built with a FastAPI backend, PostgreSQL database, and lightweight vanilla HTML/CSS/JavaScript frontend. It includes premium features like user and admin dashboards, interactive catalog searching, automated recommendations, loading indicators, dynamic theme toggling, and mobile-friendly collapsible drawer navigation.

---

## 🚀 Features

- **Responsive Dashboards:** Dedicated panels for users and admins that adapt dynamically across mobile, tablet, and desktop layouts.
- **Dynamic Theme Switcher:** Smooth dark/light mode transition toggler that persists selection in `localStorage` with zero-flash loading.
- **Modern Loading States & Error Banners:** CSS-only animations and error state layouts providing visual feedback during backend `fetch()` operations.
- **Stacked Card-Style Mobile Tables:** Clean layout adjustments that stack tabular rows into visual cards on small devices.
- **Search & Recommendation Engine:** Full-text book lookup with intelligent item recommendations displayed dynamically below results.
- **Secure Credentials:** Clean environment configurations loading database keys from environment variables.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, ES6 JavaScript, FontAwesome
- **Backend:** FastAPI (Python), Uvicorn ASGI Server
- **Database:** PostgreSQL, psycopg2

---

## 📁 Project Structure

```text
LibraryManagementSystem/
├── backend/
│   ├── main.py              # FastAPI app endpoints and business logic
│   ├── database.py          # PostgreSQL connector initialization
│   ├── requirements.txt     # Python dependencies
│   └── __pycache__/         # Python compilation cache (ignored by Git)
├── frontend/
│   ├── css/
│   │   └── style.css        # Main stylesheet containing responsive media queries
│   ├── js/
│   │   ├── theme.js         # Theme management engine & mobile nav toggle
│   │   ├── home.js          # Book search and borrow interaction
│   │   ├── admin_dashboard.js
│   │   ├── view_books.js    # Card-layout book catalog management
│   │   ├── members.js
│   │   ├── profile.js
│   │   ├── my_books.js
│   │   └── update_book.js
│   ├── index.html           # Landing page / Redirect
│   ├── home.html            # User catalogue browsing
│   ├── admin.html           # Admin action panel
│   ├── user.html            # User action panel
│   ├── user_login.html      # Member login
│   ├── admin_login.html     # Librarian login
│   ├── register.html        # Account creation
│   ├── profile.html         # User profile views
│   ├── my_books.html        # Borrowed book trackers
│   ├── add_book.html        # Admin add books form
│   ├── update_book.html     # Admin edit books form
│   ├── view_books.html      # Admin inventory viewer
│   └── members.html         # Admin user directory
├── .gitignore               # Ignored cache, systems, and local configs
└── README.md                # System documentation
```

---

## 🔧 Installation & Setup

### 1. Database Configuration
1. Install and start **PostgreSQL**.
2. Create a new database named `library_db`:
   ```sql
   CREATE DATABASE library_db;
   ```
3. Set the required database credentials using environment variables on your system, or let the app fall back to local development defaults:
   - `DB_HOST` (Default: `localhost`)
   - `DB_NAME` (Default: `library_db`)
   - `DB_USER` (Default: `postgres`)
   - `DB_PASSWORD` (Default: `sb1234`)
   - `DB_PORT` (Default: `5432`)

### 2. Run the FastAPI Backend
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the FastAPI server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be running on `http://127.0.0.1:8000`.

### 3. Launch the Frontend
1. The frontend consists of static client files. Simply open the [index.html](file:///Users/bhargav/Desktop/LibraryManagementSystem/frontend/index.html) file directly in any modern browser (Chrome, Edge, Safari, Firefox) to start browsing:
   ```bash
   open ../frontend/index.html
   ```

---

## 🔮 Future Improvements

- Add JSON Web Token (JWT) stateless user authorization and session trackers.
- Implement containerization using Docker for simple database and web servers orchestration.
- Support pagination for large catalogs to reduce database fetch payloads.

---

## 👤 Author

- **Bhargav Ch S** (imchsbhargav@gmail.com)
- Portfolio/Blog: [bhargavchs.vercel.app](http://bhargavchs.vercel.app)
