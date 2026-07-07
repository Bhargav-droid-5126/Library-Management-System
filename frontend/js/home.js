async function loadBooks() {
    console.log("Loading Books...");
    let loadingDiv = document.getElementById("loading");
    let booksDiv = document.getElementById("books");

    loadingDiv.style.display = "block";
    booksDiv.innerHTML = "";

    try {
        let response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) {
            throw new Error("Failed to fetch books");
        }
        let books = await response.json();
        loadingDiv.style.display = "none";

        if (!books || books.length === 0) {
            booksDiv.innerHTML = `
                <div class="empty-card">
                    <i class="fa-solid fa-book-open"></i>
                    <h2>No books available</h2>
                    <p>Check back later to see our updated library collection.</p>
                </div>
            `;
            return;
        }

        books.forEach(function (book) {
            let status = "Available";
            let button = `<button class="borrow-btn" onclick="borrowBook(${book.book_id})"><i class="fa-solid fa-bookmark"></i> Borrow</button>`;

            if (book.borrowed_by != null) {
                status = "Borrowed";
                button = `<button class="borrowed-btn" disabled><i class="fa-solid fa-bookmark"></i> Borrowed</button>`;
            }

            booksDiv.innerHTML += `
                <div class="book">
                    <h2><i class="fa-solid fa-book-open"></i> ${book.title}</h2>
                    <p><b>Author:</b> ${book.author}</p>
                    <p><b>Genre:</b> ${book.genre}</p>
                    <p><b>Status:</b> ${status}</p>
                    ${button}
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading books:", error);
        loadingDiv.style.display = "none";
        booksDiv.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to load books. Please check if backend is running.
            </div>
        `;
    }
}

async function borrowBook(bookId) {
    let memberId = localStorage.getItem("member_id");

    try {
        let response = await fetch(`${API_BASE_URL}/borrow-book`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                book_id: bookId,
                mem_id: parseInt(memberId)
            })
        });
        if (!response.ok) {
            throw new Error("Failed to borrow book");
        }
        let data = await response.json();
        alert(data.message);
        loadBooks();
    } catch (error) {
        console.error("Error borrowing book:", error);
        alert("Failed to borrow book. Please try again.");
    }
}

async function searchBooks() {
    let text = document.getElementById("search").value;
    let loadingDiv = document.getElementById("loading");
    let booksDiv = document.getElementById("books");
    let recSection = document.getElementById("recommendationSection");
    let recsDiv = document.getElementById("recommendations");

    if (text == "") {
        loadBooks();
        recsDiv.innerHTML = "";
        recSection.style.display = "none";
        return;
    }

    loadingDiv.style.display = "block";
    booksDiv.innerHTML = "";
    recSection.style.display = "none";

    try {
        let response = await fetch(`${API_BASE_URL}/search/` + text);
        if (!response.ok) {
            throw new Error("Failed to search books");
        }
        let books = await response.json();
        loadingDiv.style.display = "none";

        if (!books || books.length === 0) {
            booksDiv.innerHTML = `
                <div class="empty-card">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <h2>No books found</h2>
                    <p>Try adjusting your keywords or search terms.</p>
                </div>
            `;
            return;
        }

        books.forEach(function (book) {
            let button = `<button class="borrow-btn" onclick="borrowBook(${book.book_id})"><i class="fa-solid fa-bookmark"></i> Borrow</button>`;
            if (book.borrowed_by != null) {
                button = `<button class="borrowed-btn" disabled><i class="fa-solid fa-bookmark"></i> Borrowed</button>`;
            }

            booksDiv.innerHTML += `
                <div class="book">
                    <h2>${book.title}</h2>
                    <p>Author : ${book.author}</p>
                    <p>Genre : ${book.genre}</p>
                    ${button}
                </div>
                <br>
            `;

            recSection.style.display = "block";
            loadRecommendations(book.genre, book.book_id);
        });
    } catch (error) {
        console.error("Error searching books:", error);
        loadingDiv.style.display = "none";
        booksDiv.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to search books. Please try again.
            </div>
        `;
    }
}

async function loadRecommendations(genre, bookId) {
    let recLoading = document.getElementById("rec-loading");
    let recsDiv = document.getElementById("recommendations");

    recLoading.style.display = "block";
    recsDiv.innerHTML = "";

    try {
        let response = await fetch(`${API_BASE_URL}/recommend/` + genre + "/" + bookId);
        if (!response.ok) {
            throw new Error("Failed to load recommendations");
        }
        let books = await response.json();
        recLoading.style.display = "none";

        if (!books || books.length === 0) {
            recsDiv.innerHTML = `
                <div class="empty-card" style="box-shadow: none; border: 1px dashed #dbe3ef; padding: 40px;">
                    <i class="fa-solid fa-thumbs-up"></i>
                    <h2>No recommendations available</h2>
                    <p>Search and borrow some books to get personalized recommendations.</p>
                </div>
            `;
            return;
        }

        books.forEach(function (book) {
            recsDiv.innerHTML += `
                <div class="book">
                    <h3>📖 ${book.title}</h3>
                    <p><b>Author:</b> ${book.author}</p>
                    <p><b>Genre:</b> ${book.genre}</p>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading recommendations:", error);
        recLoading.style.display = "none";
        recsDiv.innerHTML = `
            <div class="error-message" style="margin: 10px 0;">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to load recommendations.
            </div>
        `;
    }
}

// Load all books when the page opens
loadBooks();