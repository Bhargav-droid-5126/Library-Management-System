async function loadMyBooks() {
    let memberId = localStorage.getItem("member_id");
    let loadingDiv = document.getElementById("loading");
    let booksDiv = document.getElementById("books");

    loadingDiv.style.display = "block";
    booksDiv.innerHTML = "";

    try {
        let response = await fetch(`${API_BASE_URL}/my-books/` + memberId);
        if (!response.ok) {
            throw new Error("Failed to load my books");
        }
        let books = await response.json();
        loadingDiv.style.display = "none";

        if (!books || books.length === 0) {
            booksDiv.innerHTML = `
                <div class="empty-card">
                    <i class="fa-solid fa-book"></i>
                    <h2>You haven't borrowed any books yet</h2>
                    <p>Start exploring the library collection to borrow your first book.</p>
                </div>
            `;
            return;
        }

        books.forEach(function (book) {
            booksDiv.innerHTML += `
                <div class="book">
                    <h2><i class="fa-solid fa-book-open"></i> ${book.title}</h2>
                    <p><b>Author :</b> ${book.author}</p>
                    <p><b>Genre :</b> ${book.genre}</p>
                    <p style="color:#EF4444;font-weight:bold;">Borrowed</p>
                    <button class="return-btn" onclick="returnBook(${book.book_id})">
                        <i class="fa-solid fa-arrow-rotate-left"></i> Return Book
                    </button>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading borrowed books:", error);
        loadingDiv.style.display = "none";
        booksDiv.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to load borrowed books. Please check your connection.
            </div>
        `;
    }
}

async function returnBook(bookId) {
    try {
        let response = await fetch(`${API_BASE_URL}/return-book`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                book_id: bookId
            })
        });
        if (!response.ok) {
            throw new Error("Failed to return book");
        }
        let data = await response.json();
        alert(data.message);
        loadMyBooks();
    } catch (error) {
        console.error("Error returning book:", error);
        alert("Failed to return book. Please try again.");
    }
}

loadMyBooks();