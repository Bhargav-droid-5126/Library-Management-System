let bookId = localStorage.getItem("updateBookId");

document.getElementById("title").value =
    localStorage.getItem("updateTitle");

document.getElementById("author").value =
    localStorage.getItem("updateAuthor");

document.getElementById("genre").value =
    localStorage.getItem("updateGenre");

async function updateBook() {

    let response = await fetch(
        "http://127.0.0.1:8000/update-book",
        {

            method: "PUT",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                book_id: bookId,

                title: document.getElementById("title").value,

                author: document.getElementById("author").value,

                genre: document.getElementById("genre").value

            })

        }
    );

    let data = await response.json();

    alert(data.message);

    window.location.href = "view_books.html";

}