async function loadBooks() {
    let loadingDiv = document.getElementById("loading");
    let container = document.getElementById("bookContainer");

    loadingDiv.style.display = "block";
    container.innerHTML = "";

    try {
        let response = await fetch("http://127.0.0.1:8000/books");
        if (!response.ok) {
            throw new Error("Failed to load books");
        }
        let books = await response.json();
        loadingDiv.style.display = "none";

        if (!books || books.length === 0) {
            container.innerHTML = `
                <div class="empty-card">
                    <i class="fa-solid fa-folder-open"></i>
                    <h2>No books in the library</h2>
                    <p>Click "Add Book" to start adding items to the catalog.</p>
                </div>
            `;
            return;
        }

        books.forEach(function (book) {
            let status = "✅ Available";

            if (book.borrowed_by != null) {
                status = "❌ Borrowed by Member ID : " + book.borrowed_by;
            }

            container.innerHTML += `
            <div class="book">
                <h2><i class="fa-solid fa-book-open"></i> ${book.title}</h2>
                <p><b>Author :</b> ${book.author}</p>
                <p><b>Genre :</b> ${book.genre}</p>
                <p><b>Status :</b> ${status}</p>
                <br>
                <div class="book-actions">
                    <button class="update-btn"
                    onclick="editBook(
                    ${book.book_id},
                    '${book.title.replace(/'/g, "\\'")}',
                    '${book.author.replace(/'/g, "\\'")}',
                    '${book.genre.replace(/'/g, "\\'")}'
                    )">
                       <i class="fa-solid fa-pen"></i> Update
                    </button>
                    <button class="delete-btn"
                    onclick="deleteBook(${book.book_id})">
                        <i class="fa-solid fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            `;
        });
    } catch (error) {
        console.error("Error loading books:", error);
        loadingDiv.style.display = "none";
        container.innerHTML = `
            <div class="error-message">
                <i class="fa-solid fa-triangle-exclamation"></i> Failed to load books. Please verify if backend is running.
            </div>
        `;
    }
}

function editBook(id, title, author, genre) {
    localStorage.setItem("updateBookId", id);
    localStorage.setItem("updateTitle", title);
    localStorage.setItem("updateAuthor", author);
    localStorage.setItem("updateGenre", genre);
    window.location.href = "update_book.html";
}

async function deleteBook(bookId) {
    if (!confirm("Delete this book?")) {
        return;
    }

    try {
        let response = await fetch("http://127.0.0.1:8000/delete-book", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                book_id: bookId
            })
        });
        if (!response.ok) {
            throw new Error("Failed to delete book");
        }
        let data = await response.json();
        alert(data.message);
        loadBooks();
    } catch (error) {
        console.error("Error deleting book:", error);
        alert("Failed to delete book. Please try again.");
    }
}

loadBooks();