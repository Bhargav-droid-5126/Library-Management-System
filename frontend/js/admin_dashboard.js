async function loadStats() {
    let loadingDiv = document.getElementById("loading");
    let statsDiv = document.getElementById("statsContainer");

    loadingDiv.style.display = "block";
    statsDiv.style.display = "none";

    // Remove any existing error messages
    let existingMsg = document.querySelector(".error-message");
    if (existingMsg) {
        existingMsg.remove();
    }

    try {
        let response = await fetch("http://127.0.0.1:8000/dashboard-stats");
        if (!response.ok) {
            throw new Error("Failed to load statistics");
        }
        let data = await response.json();

        loadingDiv.style.display = "none";
        statsDiv.style.display = "grid";

        document.getElementById("totalBooks").innerHTML = data.books;
        document.getElementById("totalMembers").innerHTML = data.members;
        document.getElementById("borrowedBooks").innerHTML = data.borrowed;
    } catch (error) {
        console.error("Error loading stats:", error);
        loadingDiv.style.display = "none";

        let errorMsg = document.createElement("div");
        errorMsg.className = "error-message";
        errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Failed to load dashboard statistics. Please verify if backend is running.`;
        statsDiv.parentNode.insertBefore(errorMsg, statsDiv);
    }
}

loadStats();