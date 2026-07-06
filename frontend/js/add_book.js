async function addBook() {

    let title = document.getElementById("title").value;
    let author = document.getElementById("author").value;
    let genre = document.getElementById("genre").value;

    if (title == "" || author == "" || genre == "") {
        alert("Please fill all fields");
        return;
    }

    let response = await fetch(`${API_BASE_URL}/add-book`, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            title: title,
            author: author,
            genre: genre
        })

    });

    let data = await response.json();

    alert(data.message);

    document.getElementById("title").value = "";
    document.getElementById("author").value = "";
    document.getElementById("genre").value = "";
}